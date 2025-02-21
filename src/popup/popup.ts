interface ExtensionStatus {
  isActive: boolean;
  error?: string;
  renamedCount: number;
  cacheSize: number;
}

// Update the UI with the current status
function updateStatus(status: ExtensionStatus) {
  console.log('[Popup] Updating status:', status);
  
  const statusElement = document.getElementById('status');
  const renamedCountElement = document.getElementById('renamedCount');
  const cacheCountElement = document.getElementById('cacheCount');
  
  if (statusElement) {
    statusElement.className = 'status ' + (status.error ? 'error' : status.isActive ? 'active' : '');
    statusElement.textContent = status.error || (status.isActive ? 'Extension is active and running' : 'Extension is inactive');
  }
  
  if (renamedCountElement) {
    renamedCountElement.textContent = status.renamedCount.toString();
  }
  
  if (cacheCountElement) {
    cacheCountElement.textContent = status.cacheSize.toString();
  }
}

// Get the current status from the background script
async function getStatus(): Promise<void> {
  console.log('[Popup] Requesting status from background...', {
    runtimeAvailable: !!chrome.runtime,
    runtimeId: chrome.runtime?.id,
    lastError: chrome.runtime?.lastError
  });
  
  try {
    // Check if runtime is available
    if (!chrome.runtime) {
      console.error('[Popup] Chrome runtime is not available at initial check');
      throw new Error('Chrome runtime is not available');
    }

    const response = await new Promise<ExtensionStatus>((resolve, reject) => {
      console.log('[Popup] Sending GET_STATUS message...');
      chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('[Popup] Runtime error during message send:', error, {
            messageResponse: response,
            runtimeId: chrome.runtime?.id
          });
          reject(new Error(error.message || 'Failed to send message'));
          return;
        }
        
        if ('error' in response) {
          console.error('[Popup] Error in response:', response.error);
          reject(new Error(response.error));
          return;
        }

        console.log('[Popup] Received status response:', {
          response,
          responseType: typeof response,
          hasError: !!response?.error
        });
        resolve(response as ExtensionStatus);
      });
    });

    updateStatus(response);
  } catch (error) {
    console.error('[Popup] Failed to get status:', {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    updateStatus({
      isActive: false,
      error: error instanceof Error ? error.message : String(error),
      renamedCount: 0,
      cacheSize: 0
    });
  }
}

// Clear the cache
async function clearCache(): Promise<void> {
  console.log('[Popup] Clearing cache...');
  
  try {
    const response = await new Promise<{success: boolean, error?: string}>((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('[Popup] Runtime error during cache clear:', error);
          reject(new Error(error.message || 'Failed to clear cache'));
          return;
        }
        
        if (!response.success) {
          reject(new Error(response.error || 'Failed to clear cache'));
          return;
        }

        resolve(response);
      });
    });

    if (response.success) {
      await getStatus(); // Refresh the status
    }
  } catch (error) {
    console.error('[Popup] Failed to clear cache:', error);
    updateStatus({
      isActive: false,
      error: error instanceof Error ? error.message : String(error),
      renamedCount: 0,
      cacheSize: 0
    });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] DOM loaded, initializing...');
  
  // Get initial status
  getStatus();
  
  // Set up clear cache button
  const clearCacheButton = document.getElementById('clearCache');
  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', clearCache);
  }
  
  // Refresh status every 5 seconds
  setInterval(getStatus, 5000);
}); 