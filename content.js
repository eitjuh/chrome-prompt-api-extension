// Main content script - Universal AI Assistant Sidebar
console.log('🧠 Universal AI Assistant Sidebar - Content script loaded');
console.log('Current URL:', window.location.href);
console.log('Document ready state:', document.readyState);

// Main AI Assistant class that coordinates all modules
class AIAssistant {
  constructor() {
    // Initialize all modules
    this.sidebar = new window.SidebarManager();
    this.contentAnalysis = new window.ContentAnalysisManager();
    this.selectionActions = new window.SelectionActionsManager();
    this.articleOverlay = new window.ArticleOverlayManager();
    this.formHelper = new window.FormHelperManager();
    this.aiSession = new window.AISessionManager();
  }

  // Initialize the AI Assistant
  async initialize() {
    console.log('Initializing AI Assistant Sidebar');

    // Check if we're in a frame or if the sidebar is already injected
    if (window.top !== window || document.getElementById('ai-assistant-sidebar')) {
      return;
    }

    // Inject sidebar
    await this.sidebar.injectSidebar();

    // Check if auto-show is enabled
    const settings = await chrome.storage.sync.get(['autoShowSidebar']);
    console.log('Auto-show setting:', settings.autoShowSidebar);
    if (settings.autoShowSidebar) {
      console.log('Auto-showing sidebar in 500ms...');
      setTimeout(() => {
        console.log('Auto-showing sidebar now');
        this.sidebar.showSidebar();
      }, 500);
    }

    // Analyze page content
    this.analyzePageContent();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize form helper
    console.log('🚀 Initializing FormHelper...');
    this.formHelper.initialize();
    console.log('✅ FormHelper initialized and available at window.aiAssistant.formHelper');

    // Check AI availability
    await this.aiSession.checkAIAvailability();
  }

  // Analyze page content and show features if needed
  analyzePageContent() {
    const analysis = this.contentAnalysis.analyzePageContent();
    this.contentAnalysis.updateContextInfo(analysis);
    
    // If this is a long article, show article-specific features
    if (analysis.isLongArticle) {
      console.log('✅ Long article detected! Showing article features...');
      this.showArticleFeatures(analysis);
    } else {
      console.log('❌ Not a long article, skipping article features');
    }
  }

  // Show article-specific features (both sidebar and overlay)
  showArticleFeatures(analysis) {
    // Update sidebar features
    this.contentAnalysis.showSidebarArticleFeatures(analysis);
    
    // Inject page overlay features
    this.articleOverlay.injectArticleOverlay(analysis);
  }

  // Set up general event listeners
  setupEventListeners() {
    // Initialize selection actions
    this.selectionActions.setupEventListeners();

    // Listen for page changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.analyzePageContent();
        this.selectionActions.cleanup();
        this.articleOverlay.cleanup();
        this.formHelper.refresh();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Handle messages from background script
  handleMessage(message) {
    console.log('Content script received message:', message);

    switch (message.action) {
      case 'contextMenuClick':
        this.handleContextMenuAction(message.menuItemId, message.selectionText);
        break;

      case 'keyboardShortcut':
        this.handleKeyboardShortcut(message.command);
        break;

      default:
        console.warn('Unknown message action:', message.action);
    }
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcut(command) {
    switch (command) {
      case 'toggle-sidebar':
        this.sidebar.toggleSidebar();
        break;

      case 'quick-prompt':
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
          this.sidebar.showSidebar();
          this.aiSession.handleQuickPrompt(selectedText);
        }
        break;
    }
  }

  // Handle context menu actions
  handleContextMenuAction(menuItemId, selectionText) {
    this.sidebar.showSidebar();

    switch (menuItemId) {
      case 'ai-summarize':
        if (selectionText) {
          this.aiSession.handleQuickPrompt(`Summarize this text: "${selectionText}"`);
        } else {
          this.aiSession.handleQuickAction('summarize');
        }
        break;

      case 'ai-explain':
        this.aiSession.handleQuickPrompt(`Explain this text: "${selectionText}"`);
        break;

      case 'ai-improve':
        this.aiSession.handleQuickPrompt(`Improve this text: "${selectionText}"`);
        break;

      case 'ai-translate':
        this.aiSession.handleQuickPrompt(`Translate this text to English: "${selectionText}"`);
        break;
    }
  }

  // Delegate methods to appropriate modules
  handleQuickAction(action) {
    return this.aiSession.handleQuickAction(action);
  }

  handleArticleAction(action) {
    return this.aiSession.handleArticleAction(action);
  }

  handleSendPrompt() {
    return this.aiSession.handleSendPrompt();
  }

  sendPromptToAI(prompt) {
    return this.aiSession.sendPromptToAI(prompt);
  }

  startModelDownload() {
    return this.aiSession.startModelDownload();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAIAssistant);
} else {
  initializeAIAssistant();
}

async function initializeAIAssistant() {
  // Create global AI Assistant instance
  window.aiAssistant = new AIAssistant();
  await window.aiAssistant.initialize();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'settingsChanged') {
    // Handle settings changes
    window.aiAssistant?.aiSession.handleSettingsChange(message.settings);
  } else {
    window.aiAssistant?.handleMessage(message);
  }
});

// Debug info
setTimeout(() => {
  const sidebar = document.getElementById('ai-assistant-sidebar');
  console.log('DEBUG - Sidebar check after delay:');
  console.log('- Sidebar exists:', !!sidebar);
  if (sidebar) {
    console.log('- Sidebar classes:', sidebar.className);
    console.log('- sidebarVisible variable:', window.aiAssistant?.sidebar.sidebarVisible);
  }
  console.log('TIP: Use Cmd+Shift+S to toggle the sidebar');
}, 1000);

console.log('Content script initialization complete');