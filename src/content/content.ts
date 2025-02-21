import { Message, MetadataRequestMessage, MetadataResponseMessage } from '../types';
import { extractMetadata } from '../utils/metadata-extractor';

let isInitialized = false;

// Initialize content script
function initialize() {
  if (isInitialized) return;
  
  console.log('[Content Script] Initializing on:', window.location.href);
  isInitialized = true;

  // Notify the background script that we're ready
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    url: window.location.href
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[Content Script] Message received:', {
    type: message.type,
    url: window.location.href,
    isInitialized
  });

  if (message.type === 'METADATA_REQUEST') {
    handleMetadataRequest(message as MetadataRequestMessage)
      .then(sendResponse);
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'UPDATE_TITLE') {
    try {
      // Ensure title is a string
      const title = typeof message.title === 'string' ? message.title : 
        (message.title ? String(message.title) : 'Untitled');
      
      console.log('[Content Script] Updating title to:', title);
      document.title = title;
      sendResponse({ success: true });
    } catch (error) {
      console.error('[Content Script] Failed to update title:', error);
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
});

async function handleMetadataRequest(message: MetadataRequestMessage): Promise<MetadataResponseMessage> {
  // If this is a PDF, we need to wait for the PDF viewer to load
  if (document.contentType === 'application/pdf') {
    await waitForPDFViewer();
  }

  // Extract metadata from the page
  const result = extractMetadata(message.url);
  
  return {
    type: 'METADATA_RESPONSE',
    success: result.success,
    data: result.data,
    error: result.error,
    tabId: message.tabId
  };
}

async function waitForPDFViewer(): Promise<void> {
  console.log('[Content Script] Waiting for PDF viewer...');
  // Wait for up to 5 seconds for the PDF viewer to load
  for (let i = 0; i < 50; i++) {
    if (document.querySelector('embed[type="application/pdf"]')) {
      console.log('[Content Script] PDF viewer found');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('[Content Script] PDF viewer not found after timeout');
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also initialize on load to be safe
window.addEventListener('load', initialize); 