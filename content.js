// Content script for Universal AI Assistant Sidebar
console.log('🧠 Universal AI Assistant Sidebar - Content script loaded');

// Global variables
let sidebarInjected = false;
let sidebarVisible = false;
let aiSession = null;
let contentAnalysis = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

async function initialize() {
  console.log('Initializing AI Assistant Sidebar');

  // Check if we're in a frame or if the sidebar is already injected
  if (window.top !== window || document.getElementById('ai-assistant-sidebar')) {
    return;
  }

  // Inject sidebar
  await injectSidebar();

  // Analyze page content
  analyzePageContent();

  // Set up event listeners
  setupEventListeners();

  // Check AI availability
  await checkAIAvailability();
}

// Inject the sidebar HTML and CSS
async function injectSidebar() {
  if (sidebarInjected) return;

  try {
    console.log('Injecting sidebar...');

    // Create sidebar container
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'ai-assistant-sidebar';
    sidebarContainer.innerHTML = `
      <div class="ai-sidebar-header">
        <div class="ai-sidebar-title">
          <span class="ai-icon">🧠</span>
          AI Assistant
        </div>
        <div class="ai-sidebar-controls">
          <button class="ai-btn ai-btn-minimize" title="Minimize">−</button>
          <button class="ai-btn ai-btn-close" title="Close">×</button>
        </div>
      </div>

      <div class="ai-sidebar-content">
        <div class="ai-context-info">
          <div class="ai-context-type">
            <span class="ai-context-icon">📄</span>
            <span class="ai-context-text">Analyzing page...</span>
          </div>
        </div>

        <div class="ai-quick-actions">
          <button class="ai-action-btn" data-action="summarize">
            <span class="ai-action-icon">📝</span>
            Summarize Page
          </button>
          <button class="ai-action-btn" data-action="explain">
            <span class="ai-action-icon">💡</span>
            Explain
          </button>
          <button class="ai-action-btn" data-action="improve">
            <span class="ai-action-icon">✨</span>
            Improve Text
          </button>
        </div>

        <div class="ai-prompt-area">
          <textarea
            id="ai-prompt-input"
            placeholder="Ask AI anything about this page..."
            rows="3"
          ></textarea>
          <div class="ai-prompt-controls">
            <button class="ai-btn ai-btn-primary" id="ai-send-prompt">
              <span class="ai-btn-icon">🚀</span>
              Send
            </button>
            <button class="ai-btn ai-btn-secondary" id="ai-clear-prompt">
              Clear
            </button>
          </div>
        </div>

        <div class="ai-response-area" id="ai-response-area">
          <div class="ai-status">
            <span class="ai-status-icon">⚡</span>
            Ready to help!
          </div>
        </div>

        <div class="ai-history-toggle">
          <button class="ai-btn ai-btn-ghost" id="ai-history-toggle">
            <span class="ai-btn-icon">📋</span>
            History
          </button>
        </div>
      </div>
    `;

    // Inject into page
    document.body.appendChild(sidebarContainer);

    // Add event listeners to sidebar elements
    setupSidebarEventListeners();

    sidebarInjected = true;
    console.log('✅ Sidebar injected successfully');

  } catch (error) {
    console.error('❌ Failed to inject sidebar:', error);
  }
}

// Set up sidebar event listeners
function setupSidebarEventListeners() {
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar) return;

  // Close button
  const closeBtn = sidebar.querySelector('.ai-btn-close');
  closeBtn?.addEventListener('click', () => toggleSidebar(false));

  // Minimize button
  const minimizeBtn = sidebar.querySelector('.ai-btn-minimize');
  minimizeBtn?.addEventListener('click', () => minimizeSidebar());

  // Quick action buttons
  const actionBtns = sidebar.querySelectorAll('.ai-action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleQuickAction(action);
    });
  });

  // Send prompt button
  const sendBtn = sidebar.querySelector('#ai-send-prompt');
  sendBtn?.addEventListener('click', handleSendPrompt);

  // Clear prompt button
  const clearBtn = sidebar.querySelector('#ai-clear-prompt');
  clearBtn?.addEventListener('click', () => {
    const input = sidebar.querySelector('#ai-prompt-input');
    if (input) input.value = '';
  });

  // Prompt input - Enter key
  const promptInput = sidebar.querySelector('#ai-prompt-input');
  promptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  });

  // History toggle
  const historyBtn = sidebar.querySelector('#ai-history-toggle');
  historyBtn?.addEventListener('click', toggleHistory);
}

// Set up general event listeners
function setupEventListeners() {
  // Listen for text selection
  document.addEventListener('selectionchange', handleSelectionChange);

  // Listen for page changes (for SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      analyzePageContent();
    }
  }).observe(document, { subtree: true, childList: true });
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.action) {
    case 'contextMenuClick':
      handleContextMenuAction(message.menuItemId, message.selectionText);
      break;

    case 'keyboardShortcut':
      handleKeyboardShortcut(message.command);
      break;

    default:
      console.warn('Unknown message action:', message.action);
  }
});

// Handle keyboard shortcuts
function handleKeyboardShortcut(command) {
  switch (command) {
    case 'toggle-sidebar':
      toggleSidebar();
      break;

    case 'quick-prompt':
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        showSidebar();
        handleQuickPrompt(selectedText);
      }
      break;
  }
}

// Handle context menu actions
function handleContextMenuAction(menuItemId, selectionText) {
  showSidebar();

  switch (menuItemId) {
    case 'ai-summarize':
      if (selectionText) {
        handleQuickPrompt(`Summarize this text: "${selectionText}"`);
      } else {
        handleQuickAction('summarize');
      }
      break;

    case 'ai-explain':
      handleQuickPrompt(`Explain this text: "${selectionText}"`);
      break;

    case 'ai-improve':
      handleQuickPrompt(`Improve this text: "${selectionText}"`);
      break;

    case 'ai-translate':
      handleQuickPrompt(`Translate this text to English: "${selectionText}"`);
      break;
  }
}

// Toggle sidebar visibility
function toggleSidebar(show = null) {
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar) return;

  if (show === null) {
    sidebarVisible = !sidebarVisible;
  } else {
    sidebarVisible = show;
  }

  if (sidebarVisible) {
    sidebar.classList.add('ai-sidebar-visible');
    sidebar.classList.remove('ai-sidebar-hidden');
  } else {
    sidebar.classList.add('ai-sidebar-hidden');
    sidebar.classList.remove('ai-sidebar-visible');
  }

  console.log(`Sidebar ${sidebarVisible ? 'shown' : 'hidden'}`);
}

// Show sidebar
function showSidebar() {
  toggleSidebar(true);
}

// Minimize sidebar
function minimizeSidebar() {
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('ai-sidebar-minimized');
}

// Analyze page content
function analyzePageContent() {
  console.log('Analyzing page content...');

  const analysis = {
    title: document.title,
    url: location.href,
    type: detectContentType(),
    wordCount: getWordCount(),
    hasCode: hasCodeContent(),
    language: detectLanguage(),
    mainContent: extractMainContent()
  };

  contentAnalysis = analysis;
  updateContextInfo(analysis);

  console.log('Content analysis:', analysis);
}

// Detect content type
function detectContentType() {
  const url = location.href;
  const title = document.title.toLowerCase();
  const content = document.body.textContent.toLowerCase();

  if (url.includes('github.com')) return 'code';
  if (url.includes('stackoverflow.com')) return 'forum';
  if (url.includes('reddit.com')) return 'forum';
  if (title.includes('documentation') || title.includes('docs')) return 'documentation';
  if (content.includes('email') || url.includes('mail')) return 'email';
  if (document.querySelector('article')) return 'article';
  if (document.querySelector('pre, code')) return 'code';

  return 'webpage';
}

// Extract main content
function extractMainContent() {
  const selectors = [
    'main',
    'article',
    '.content',
    '.main-content',
    '#content',
    '.post-content',
    '.entry-content'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim().substring(0, 2000);
    }
  }

  return document.body.textContent.trim().substring(0, 2000);
}

// Get word count
function getWordCount() {
  const text = document.body.textContent;
  return text.trim().split(/\s+/).length;
}

// Check if page has code content
function hasCodeContent() {
  return document.querySelector('pre, code, .highlight') !== null;
}

// Detect language
function detectLanguage() {
  return document.documentElement.lang || 'en';
}

// Update context info in sidebar
function updateContextInfo(analysis) {
  const contextInfo = document.querySelector('.ai-context-info');
  if (!contextInfo) return;

  const typeIcons = {
    'code': '💻',
    'article': '📄',
    'forum': '💬',
    'documentation': '📚',
    'email': '📧',
    'webpage': '🌐'
  };

  const icon = typeIcons[analysis.type] || '📄';
  const typeText = analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1);

  contextInfo.innerHTML = `
    <div class="ai-context-type">
      <span class="ai-context-icon">${icon}</span>
      <span class="ai-context-text">${typeText} • ${analysis.wordCount} words</span>
    </div>
  `;
}

// Handle text selection
function handleSelectionChange() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    console.log('Text selected:', selectedText.substring(0, 100) + '...');
    // Could show floating action buttons here
  }
}

// Handle quick actions
async function handleQuickAction(action) {
  console.log('Quick action:', action);

  let prompt = '';
  switch (action) {
    case 'summarize':
      prompt = `Please summarize this webpage:\n\nTitle: ${contentAnalysis.title}\nURL: ${contentAnalysis.url}\n\nContent: ${contentAnalysis.mainContent}`;
      break;

    case 'explain':
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        prompt = `Please explain this text: "${selectedText}"`;
      } else {
        prompt = `Please explain what this webpage is about:\n\nTitle: ${contentAnalysis.title}\nContent: ${contentAnalysis.mainContent}`;
      }
      break;

    case 'improve':
      const selectedForImprovement = window.getSelection().toString().trim();
      if (selectedForImprovement) {
        prompt = `Please improve this text: "${selectedForImprovement}"`;
      } else {
        prompt = 'Please select some text first to improve it.';
      }
      break;
  }

  if (prompt) {
    await sendPromptToAI(prompt);
  }
}

// Handle quick prompt
async function handleQuickPrompt(prompt) {
  const promptInput = document.querySelector('#ai-prompt-input');
  if (promptInput) {
    promptInput.value = prompt;
  }
  await sendPromptToAI(prompt);
}

// Handle send prompt
async function handleSendPrompt() {
  const promptInput = document.querySelector('#ai-prompt-input');
  if (!promptInput) return;

  const prompt = promptInput.value.trim();
  if (!prompt) return;

  await sendPromptToAI(prompt);
  promptInput.value = '';
}

// Send prompt to AI
async function sendPromptToAI(prompt) {
  console.log('Sending prompt to AI:', prompt);

  const responseArea = document.querySelector('#ai-response-area');
  if (!responseArea) return;

  // Show loading state
  responseArea.innerHTML = `
    <div class="ai-loading">
      <span class="ai-loading-icon">⏳</span>
      Thinking...
    </div>
  `;

  try {
    const response = await queryAI(prompt);
    displayResponse(response);
  } catch (error) {
    console.error('AI query failed:', error);
    displayError(error.message);
  }
}

// Query AI using Chrome Prompt API
async function queryAI(prompt) {
  if (!aiSession) {
    aiSession = await createAISession();
  }

  const response = await aiSession.prompt(prompt);
  return response;
}

// Create AI session
async function createAISession() {
  try {
    // Check if AI API is available
    if (!('ai' in self) || !('languageModel' in self.ai)) {
      throw new Error('Chrome Prompt API not available');
    }

    // Check current availability
    const capabilities = await self.ai.languageModel.capabilities();

    if (capabilities.available === 'no') {
      throw new Error('AI model not available on this device');
    }

    if (capabilities.available === 'after-download') {
      throw new Error('AI model needs to be downloaded first');
    }

    // Create session with optimal parameters
    const session = await self.ai.languageModel.create({
      temperature: 0.7,
      topK: 8,
    });

    console.log('✅ AI session created successfully');
    return session;
  } catch (error) {
    console.error('❌ Failed to create AI session:', error);
    throw error;
  }
}

// Start model download process
async function startModelDownload() {
  try {
    updateAIStatus('downloading');

    // Create a session which triggers the download
    const session = await self.ai.languageModel.create();

    // Store session for later use
    aiSession = session;

    console.log('✅ AI model downloaded and session created');
    updateAIStatus('ready');

  } catch (error) {
    console.error('❌ Model download failed:', error);
    updateAIStatus('error', 'Failed to download model: ' + error.message);
  }
}

// Display AI response
function displayResponse(response) {
  const responseArea = document.querySelector('#ai-response-area');
  if (!responseArea) return;

  responseArea.innerHTML = `
    <div class="ai-response">
      <div class="ai-response-header">
        <span class="ai-response-icon">🤖</span>
        AI Response
      </div>
      <div class="ai-response-content">
        ${response.replace(/\n/g, '<br>')}
      </div>
    </div>
  `;
}

// Display error
function displayError(message) {
  const responseArea = document.querySelector('#ai-response-area');
  if (!responseArea) return;

  responseArea.innerHTML = `
    <div class="ai-error">
      <span class="ai-error-icon">⚠️</span>
      <div class="ai-error-message">${message}</div>
    </div>
  `;
}

// Check AI availability
async function checkAIAvailability() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkPromptAPI'
    });

    console.log('AI availability response:', response);

    if (response.available) {
      if (response.state === 'ready') {
        console.log('✅ AI is ready');
        updateAIStatus('ready');
      } else if (response.state === 'download-required') {
        console.log('📥 AI requires download');
        updateAIStatus('download-required');
      }
    } else {
      console.log('❌ AI is not available:', response.error);
      updateAIStatus('unavailable', response.error);
    }
  } catch (error) {
    console.error('Failed to check AI availability:', error);
    updateAIStatus('error', error.message);
  }
}

// Update AI status in sidebar
function updateAIStatus(state, error = null) {
  const statusElement = document.querySelector('.ai-status');
  if (!statusElement) return;

  switch (state) {
    case 'ready':
      statusElement.innerHTML = `
        <span class="ai-status-icon">✅</span>
        AI Ready
      `;
      break;

    case 'download-required':
      statusElement.innerHTML = `
        <span class="ai-status-icon">📥</span>
        <div class="ai-download-info">
          <div>AI Model Download Required</div>
          <button class="ai-btn ai-btn-primary ai-download-btn" onclick="startModelDownload()">
            Download Model (~2GB)
          </button>
        </div>
      `;
      break;

    case 'downloading':
      statusElement.innerHTML = `
        <span class="ai-status-icon">⏳</span>
        Downloading AI Model...
      `;
      break;

    case 'unavailable':
      statusElement.innerHTML = `
        <span class="ai-status-icon">❌</span>
        <div class="ai-error-info">
          <div>AI Unavailable</div>
          <div class="ai-error-detail">${error || 'Hardware requirements not met'}</div>
        </div>
      `;
      break;

    case 'error':
    default:
      statusElement.innerHTML = `
        <span class="ai-status-icon">⚠️</span>
        <div class="ai-error-info">
          <div>AI Error</div>
          <div class="ai-error-detail">${error || 'Unknown error'}</div>
        </div>
      `;
      break;
  }
}

// Toggle history
function toggleHistory() {
  console.log('Toggle history clicked');
  // TODO: Implement history panel
}

console.log('Content script initialization complete');