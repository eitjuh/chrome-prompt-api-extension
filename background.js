// Background service worker for Universal AI Assistant Sidebar
console.log('🧠 Universal AI Assistant Sidebar - Background script loaded');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  // Create context menu items
  chrome.contextMenus.create({
    id: 'ai-summarize',
    title: '🧠 Summarize with AI',
    contexts: ['selection', 'page']
  });

  chrome.contextMenus.create({
    id: 'ai-explain',
    title: '🧠 Explain with AI',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-improve',
    title: '🧠 Improve text with AI',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-translate',
    title: '🧠 Translate with AI',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);

  chrome.tabs.sendMessage(tab.id, {
    action: 'contextMenuClick',
    menuItemId: info.menuItemId,
    selectionText: info.selectionText || '',
    pageUrl: info.pageUrl
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command triggered:', command);

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'keyboardShortcut',
        command: command
      });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.action) {
    case 'checkPromptAPI':
      // Check if Prompt API is available
      checkPromptAPIAvailability()
        .then(available => sendResponse({available}))
        .catch(error => sendResponse({available: false, error: error.message}));
      return true; // Will respond asynchronously

    case 'getStorageData':
      chrome.storage.local.get(message.keys, (data) => {
        sendResponse(data);
      });
      return true;

    case 'setStorageData':
      chrome.storage.local.set(message.data, () => {
        sendResponse({success: true});
      });
      return true;

    default:
      console.warn('Unknown message action:', message.action);
  }
});

// Check Chrome Prompt API availability
async function checkPromptAPIAvailability() {
  try {
    // Check if AI API is available
    if (!('ai' in self) || !('languageModel' in self.ai)) {
      throw new Error('Chrome Prompt API not available - ensure Chrome 138+ and Early Preview Program enrollment');
    }

    // Check model capabilities and availability
    const capabilities = await self.ai.languageModel.capabilities();
    console.log('Model capabilities:', capabilities);

    const availability = capabilities.available;

    switch (availability) {
      case 'readily':
        console.log('✅ AI model is readily available');
        return { available: true, state: 'ready' };

      case 'after-download':
        console.log('📥 AI model available after download');
        return { available: true, state: 'download-required' };

      case 'no':
        console.log('❌ AI model not available on this device');
        return { available: false, state: 'unavailable', error: 'Model not available on this device' };

      default:
        console.log('❓ Unknown availability state:', availability);
        return { available: false, state: 'unknown', error: 'Unknown availability state' };
    }
  } catch (error) {
    console.error('❌ Chrome Prompt API check failed:', error);
    return { available: false, state: 'error', error: error.message };
  }
}

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener(() => {
  console.log('Extension update available');
  chrome.runtime.reload();
});

// Handle errors
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup');
});