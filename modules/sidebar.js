// Sidebar management module
class SidebarManager {
  constructor() {
    this.sidebarInjected = false;
    this.sidebarVisible = false;
  }

  // Inject the sidebar HTML and CSS
  async injectSidebar() {
    if (this.sidebarInjected) return;

    try {
      console.log('Injecting sidebar...');

      // Create sidebar container
      const sidebarContainer = document.createElement('div');
      sidebarContainer.id = 'ai-assistant-sidebar';
      sidebarContainer.className = 'ai-sidebar-hidden'; // Start hidden
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
      this.setupSidebarEventListeners();

      this.sidebarInjected = true;
      console.log('✅ Sidebar injected successfully');

    } catch (error) {
      console.error('❌ Failed to inject sidebar:', error);
    }
  }

  // Set up sidebar event listeners
  setupSidebarEventListeners() {
    const sidebar = document.getElementById('ai-assistant-sidebar');
    if (!sidebar) return;

    // Close button
    const closeBtn = sidebar.querySelector('.ai-btn-close');
    closeBtn?.addEventListener('click', () => this.toggleSidebar(false));

    // Minimize button
    const minimizeBtn = sidebar.querySelector('.ai-btn-minimize');
    minimizeBtn?.addEventListener('click', () => this.minimizeSidebar());

    // Quick action buttons
    const actionBtns = sidebar.querySelectorAll('.ai-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        window.aiAssistant?.handleQuickAction(action);
      });
    });

    // Send prompt button
    const sendBtn = sidebar.querySelector('#ai-send-prompt');
    sendBtn?.addEventListener('click', () => window.aiAssistant?.handleSendPrompt());

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
        window.aiAssistant?.handleSendPrompt();
      }
    });

    // History toggle
    const historyBtn = sidebar.querySelector('#ai-history-toggle');
    historyBtn?.addEventListener('click', this.toggleHistory);
  }

  // Toggle sidebar visibility
  toggleSidebar(show = null) {
    console.log('toggleSidebar called with show=', show);
    const sidebar = document.getElementById('ai-assistant-sidebar');
    if (!sidebar) {
      console.error('Sidebar element not found!');
      return;
    }

    if (show === null) {
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      this.sidebarVisible = show;
    }

    console.log('Setting sidebarVisible to:', this.sidebarVisible);
    console.log('Before toggle - sidebar classes:', sidebar.className);

    if (this.sidebarVisible) {
      sidebar.classList.add('ai-sidebar-visible');
      sidebar.classList.remove('ai-sidebar-hidden');
    } else {
      sidebar.classList.add('ai-sidebar-hidden');
      sidebar.classList.remove('ai-sidebar-visible');
    }

    console.log('After toggle - sidebar classes:', sidebar.className);
    console.log(`Sidebar ${this.sidebarVisible ? 'shown' : 'hidden'}`);
  }

  // Show sidebar
  showSidebar() {
    console.log('showSidebar() called');
    this.toggleSidebar(true);
  }

  // Minimize sidebar
  minimizeSidebar() {
    const sidebar = document.getElementById('ai-assistant-sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('ai-sidebar-minimized');
  }

  // Toggle history
  toggleHistory() {
    console.log('Toggle history clicked');
    // TODO: Implement history panel
  }

  // Update AI status in sidebar
  updateAIStatus(state, error = null) {
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
            <button class="ai-btn ai-btn-primary ai-download-btn" onclick="window.aiAssistant?.startModelDownload()">
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

  // Display AI response
  displayResponse(response) {
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
  displayError(message) {
    const responseArea = document.querySelector('#ai-response-area');
    if (!responseArea) return;

    responseArea.innerHTML = `
      <div class="ai-error">
        <span class="ai-error-icon">⚠️</span>
        <div class="ai-error-message">${message}</div>
      </div>
    `;
  }

  // Show loading state
  showLoading() {
    const responseArea = document.querySelector('#ai-response-area');
    if (!responseArea) return;

    responseArea.innerHTML = `
      <div class="ai-loading">
        <span class="ai-loading-icon">⏳</span>
        Thinking...
      </div>
    `;
  }
}

// Export for use in content script
window.SidebarManager = SidebarManager;