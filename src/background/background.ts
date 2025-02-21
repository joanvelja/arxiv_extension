console.log('[Service Worker] Script starting...');
console.log('[Service Worker] Module type:', import.meta.url ? 'module' : 'non-module');

import { Message, TabState, PaperMetadata, APIResponse, ExtensionStatus } from '../types';
import { parseURL, isPaperURL } from '../utils/url-parser';
import { paperCache } from '../utils/cache';
import { fetchArxivMetadata } from '../api/arxiv';
import { fetchOpenReviewMetadata } from '../api/openreview';

console.log('[Service Worker] Dependencies imported');

// Global state for statistics
let renamedTabsCount = 0;
let lastError: string | undefined;
let isInitialized = false;

class TabStateManager {
  private tabs: Map<number, TabState> = new Map();

  public updateTab(tabId: number, update: Partial<TabState>): void {
    const current = this.tabs.get(tabId) || {
      id: tabId,
      url: '',
      status: 'loading',
      lastUpdate: Date.now(),
      retryCount: 0
    };

    this.tabs.set(tabId, { ...current, ...update });
  }

  public getTab(tabId: number): TabState | undefined {
    return this.tabs.get(tabId);
  }

  public deleteTab(tabId: number): void {
    this.tabs.delete(tabId);
  }

  public getActiveTabsCount(): number {
    return this.tabs.size;
  }
}

const tabManager = new TabStateManager();

// Core functionality
async function handleTabComplete(tabId: number, url: string): Promise<void> {
  console.log('[Service Worker] Handling tab complete:', { tabId, url });
  
  const parsed = parseURL(url);
  if (!parsed) return;

  const cached = await paperCache.get(url);
  if (cached) {
    await updateTabTitle(tabId, cached);
    return;
  }

  let response: APIResponse<PaperMetadata>;

  switch (parsed.type) {
    case 'arxiv':
      response = await fetchArxivMetadata(parsed.id);
      break;
    
    case 'openreview':
      response = await fetchOpenReviewMetadata(parsed.id);
      break;
    
    default:
      response = await requestMetadataFromContent(tabId, url, parsed.type);
      break;
  }

  if (response.success && response.data) {
    await paperCache.set(url, response.data);
    await updateTabTitle(tabId, response.data);
  } else {
    console.warn(`Failed to get metadata for ${url}:`, response.error);
    lastError = response.error?.message;
  }
}

async function requestMetadataFromContent(
  tabId: number,
  url: string,
  source: PaperMetadata['source']
): Promise<APIResponse<PaperMetadata>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {
      type: 'METADATA_REQUEST',
      url,
      tabId,
      source
    }, resolve);
  });
}

async function updateTabTitle(tabId: number, metadata: PaperMetadata): Promise<void> {
  const title = formatTitle(metadata);
  console.log('[Service Worker] Attempting to update tab title:', {
    tabId,
    title,
    metadata: {
      id: metadata.id,
      source: metadata.source,
      rawTitle: metadata.title,
      rawAuthors: metadata.authors
    }
  });
  
  try {
    // Try to send message to content script with retries
    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        await new Promise<void>((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, {
            type: 'UPDATE_TITLE',
            title: String(title) // Ensure we're sending a string
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('[Service Worker] Failed to update title (attempt ' + (retries + 1) + '/' + maxRetries + '):', 
                chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            if (!response?.success) {
              reject(new Error(response?.error || 'Failed to update title'));
              return;
            }
            resolve();
          });
        });
        
        // If we get here, the update was successful
        tabManager.updateTab(tabId, {
          status: 'complete',
          metadata
        });
        renamedTabsCount++;
        return;
        
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          console.log('[Service Worker] Retrying title update in ' + retryDelay + 'ms...');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw new Error(`Failed to update title after ${maxRetries} attempts`);
    
  } catch (error) {
    console.error('[Service Worker] Failed to update tab title:', error);
    lastError = error instanceof Error ? error.message : 'Failed to update tab title';
  }
}

function formatTitle(metadata: PaperMetadata): string {
  console.log('[Service Worker] Formatting title from metadata:', {
    title: metadata.title,
    authors: metadata.authors,
    source: metadata.source
  });

  // Ensure title is a string
  const title = String(metadata.title || 'Untitled');

  // Handle authors array safely
  const authors = Array.isArray(metadata.authors) && metadata.authors.length > 0
    ? `${String(metadata.authors[0])}${metadata.authors.length > 1 ? ' et al.' : ''}`
    : '';

  const formattedTitle = authors
    ? `${title} - ${authors}`
    : title;

  console.log('[Service Worker] Formatted title:', {
    originalTitle: metadata.title,
    originalAuthors: metadata.authors,
    formattedTitle
  });

  return formattedTitle;
}

function handleMetadataResponse(tabId: number, response: APIResponse<PaperMetadata>): void {
  const tab = tabManager.getTab(tabId);
  if (!tab) return;

  if (response.success && response.data) {
    paperCache.set(tab.url, response.data);
    updateTabTitle(tabId, response.data);
  } else {
    tabManager.updateTab(tabId, {
      status: 'error',
      retryCount: (tab.retryCount || 0) + 1
    });

    if ((tab.retryCount || 0) < 3) {
      setTimeout(() => {
        handleTabComplete(tabId, tab.url);
      }, 1000 * Math.pow(2, tab.retryCount || 0));
    }
  }
}

// Initialize event listeners
try {
  console.log('[Service Worker] Starting initialization...', {
    isAlreadyInitialized: isInitialized,
    runtimeId: chrome.runtime?.id,
    availableAPIs: {
      tabs: !!chrome.tabs,
      storage: !!chrome.storage,
      runtime: !!chrome.runtime
    }
  });

  // Register event listeners
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('[Service Worker] Tab updated:', { tabId, changeInfo, tab });
    
    if (!tab.url || !isPaperURL(tab.url)) return;

    if (changeInfo.status === 'loading') {
      tabManager.updateTab(tabId, {
        url: tab.url,
        status: 'loading'
      });
    }

    if (changeInfo.status === 'complete') {
      await handleTabComplete(tabId, tab.url);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('[Service Worker] Tab removed:', tabId);
    tabManager.deleteTab(tabId);
  });

  // Message handling with proper async support
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    console.log('[Service Worker] Message received:', { 
      message, 
      sender,
      isInitialized,
      handlerTime: new Date().toISOString()
    });
    
    try {
      switch (message.type) {
        case 'METADATA_RESPONSE':
          handleMetadataResponse(message.tabId, message);
          sendResponse({ success: true });
          return true;

        case 'GET_STATUS':
          // Handle status request synchronously
          const status: ExtensionStatus = {
            isActive: isInitialized,
            error: lastError,
            renamedCount: renamedTabsCount,
            cacheSize: paperCache.cache.size
          };
          console.log('[Service Worker] Preparing status response:', {
            status,
            currentState: {
              isInitialized,
              lastError,
              renamedTabsCount,
              cacheSize: paperCache.cache.size
            }
          });
          sendResponse(status);
          return true;

        case 'CLEAR_CACHE':
          try {
            paperCache.clear();
            renamedTabsCount = 0;
            lastError = undefined;
            console.log('[Service Worker] Cache cleared successfully');
            sendResponse({ success: true });
          } catch (error) {
            console.error('[Service Worker] Failed to clear cache:', error);
            lastError = 'Failed to clear cache';
            sendResponse({ success: false, error: lastError });
          }
          return true;

        case 'CONTENT_SCRIPT_READY':
          console.log('[Service Worker] Content script ready:', sender.tab?.id);
          // Could potentially retry any pending operations for this tab
          sendResponse({ success: true });
          return true;

        default:
          console.warn('[Service Worker] Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
          return true;
      }
    } catch (error) {
      console.error('[Service Worker] Error handling message:', {
        error,
        messageType: message.type,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      sendResponse({ error: error instanceof Error ? error.message : 'Internal error' });
      return true;
    }
  });

  isInitialized = true;
  console.log('[Service Worker] Initialization complete', {
    isInitialized,
    runtimeId: chrome.runtime?.id,
    timestamp: new Date().toISOString()
  });
} catch (error) {
  console.error('[Service Worker] Failed to initialize:', {
    error,
    errorType: typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined
  });
  isInitialized = false;
  lastError = error instanceof Error ? error.message : 'Failed to initialize service worker';
} 