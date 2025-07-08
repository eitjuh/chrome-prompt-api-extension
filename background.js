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
    console.log('🔍 Checking Chrome Prompt API availability...');
    
    // Check if Language Model API is available
    if (!('LanguageModel' in self)) {
      console.error('❌ LanguageModel not found in self');
      throw new Error('Chrome Prompt API not available - ensure Chrome 138+ and Early Preview Program enrollment');
    }
    
    console.log('✅ LanguageModel found in self');
    console.log('📋 LanguageModel object:', LanguageModel);
    console.log('📋 LanguageModel methods:', Object.getOwnPropertyNames(LanguageModel));

    // Check model availability
    console.log('🔍 Calling LanguageModel.availability()...');
    const availability = await LanguageModel.availability();
    console.log('📋 Raw availability response:', availability);
    console.log('📋 Availability type:', typeof availability);
    console.log('📋 Availability value:', JSON.stringify(availability));

    switch (availability) {
      case 'available':
      case 'readily':
        console.log('✅ AI model is available/ready');
        return { available: true, state: 'ready' };

      case 'after-download':
        console.log('📥 AI model available after download');
        return { available: true, state: 'download-required' };

      case 'no':
      case 'unavailable':
        console.log('❌ AI model not available on this device');
        return { available: false, state: 'unavailable', error: 'Model not available on this device' };

      default:
        console.log('❓ Unknown availability state:', availability);
        console.log('📋 Expected one of: available, readily, after-download, no, unavailable');
        return { available: false, state: 'unknown', error: `Unknown availability state: ${availability}` };
    }
  } catch (error) {
    console.error('❌ Chrome Prompt API check failed:', error);
    console.error('📋 Error details:', error.stack);
    
    // Try alternative API access methods
    console.log('🔍 Checking alternative API access methods...');
    console.log('📋 chrome.ai exists?', 'ai' in chrome);
    console.log('📋 window.ai exists?', typeof window !== 'undefined' && 'ai' in window);
    console.log('📋 globalThis.ai exists?', 'ai' in globalThis);
    console.log('📋 self.ai exists?', 'ai' in self);
    
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