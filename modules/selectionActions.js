// Selection actions module for floating buttons
class SelectionActionsManager {
  constructor() {
    this.selectionTimeout = null;
    this.isShowingFloatingButtons = false;
    this.autoHideTimeout = null;
  }

  // Initialize selection event listeners
  setupEventListeners() {
    // Listen for text selection
    document.addEventListener('selectionchange', () => this.handleSelectionChange());

    // Listen for clicks to hide floating buttons when clicking elsewhere
    document.addEventListener('click', (e) => {
      // Don't hide if clicking on floating buttons themselves or the sidebar
      if (!e.target.closest('#ai-floating-buttons') && !e.target.closest('#ai-assistant-sidebar')) {
        // Add small delay to allow for double-clicks and avoid immediate hiding
        setTimeout(() => {
          // Only hide if no text is currently selected
          if (window.getSelection().toString().trim().length === 0) {
            this.removeFloatingButtons();
          }
        }, 100);
      }
    });
  }

  // Handle text selection with smart debouncing
  handleSelectionChange() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Clear any existing timeouts
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }

    // If text is empty, immediately remove buttons
    if (selectedText.length === 0) {
      this.removeFloatingButtons();
      return;
    }

    // If we have meaningful text and no buttons are showing, show them immediately
    if (selectedText.length > 5 && selection.rangeCount > 0 && !this.isShowingFloatingButtons) {
      console.log('Text selected:', selectedText.substring(0, 100) + '...');
      this.showFloatingActionButtons(selection);
      return;
    }

    // If buttons are already showing, debounce updates to prevent flickering
    if (this.isShowingFloatingButtons && selectedText.length > 5) {
      this.selectionTimeout = setTimeout(() => {
        if (window.getSelection().toString().trim().length > 5) {
          // Only update position, don't recreate buttons
          this.updateFloatingButtonsPosition(window.getSelection());
        }
      }, 100); // Shorter delay for updates
    }
  }

  // Show floating action buttons for selected text
  showFloatingActionButtons(selection) {
    // Prevent multiple floating buttons from appearing
    if (this.isShowingFloatingButtons) {
      return;
    }
    
    // Ensure we remove any existing buttons first
    this.removeFloatingButtons();
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Mark that we're showing floating buttons
    this.isShowingFloatingButtons = true;
    
    // Create floating button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'ai-floating-buttons';
    buttonContainer.className = 'ai-floating-buttons';
    
    // Position above the selection
    buttonContainer.style.cssText = `
      position: fixed;
      left: ${rect.left + (rect.width / 2) - 100}px;
      top: ${rect.top - 45}px;
      z-index: 2147483647;
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.9);
      padding: 4px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      transform: translateY(-10px);
      opacity: 0;
      transition: all 0.2s ease;
      pointer-events: none;
    `;

    // Create action buttons
    const actions = [
      { icon: '📝', text: 'Explain', action: 'explain' },
      { icon: '🔍', text: 'Define', action: 'define' },
      { icon: '🧒', text: 'ELI5', action: 'eli5' },
      { icon: '📚', text: 'Summary', action: 'summary' }
    ];

    actions.forEach(({icon, text, action}) => {
      const button = document.createElement('button');
      button.className = 'ai-floating-btn';
      button.innerHTML = `${icon}`;
      button.title = text;
      button.dataset.action = action;
      
      button.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        pointer-events: auto;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.style.transform = 'scale(1.05)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.transform = 'scale(1)';
      });
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleFloatingAction(action, selection.toString().trim());
        this.removeFloatingButtons();
      });
      
      buttonContainer.appendChild(button);
    });

    document.body.appendChild(buttonContainer);
    
    // Animate in
    setTimeout(() => {
      buttonContainer.style.opacity = '1';
      buttonContainer.style.transform = 'translateY(0)';
      buttonContainer.style.pointerEvents = 'auto';
    }, 10);
    
    // Only auto-hide if no text is selected after 10 seconds
    this.autoHideTimeout = setTimeout(() => {
      // Check if text is still selected before hiding
      const currentSelection = window.getSelection().toString().trim();
      if (currentSelection.length === 0) {
        this.removeFloatingButtons();
      } else {
        // If text is still selected, check again in another 5 seconds
        this.autoHideTimeout = setTimeout(() => {
          if (window.getSelection().toString().trim().length === 0) {
            this.removeFloatingButtons();
          }
        }, 5000);
      }
    }, 10000);
  }

  // Update floating buttons position without recreating them
  updateFloatingButtonsPosition(selection) {
    const buttonContainer = document.getElementById('ai-floating-buttons');
    if (!buttonContainer || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Update position smoothly
    buttonContainer.style.left = `${rect.left + (rect.width / 2) - 100}px`;
    buttonContainer.style.top = `${rect.top - 45}px`;
  }

  // Remove floating action buttons
  removeFloatingButtons() {
    // Clear any auto-hide timeouts
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
    
    const existing = document.getElementById('ai-floating-buttons');
    if (existing) {
      existing.style.opacity = '0';
      existing.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
        // Reset the flag when buttons are completely removed
        this.isShowingFloatingButtons = false;
      }, 200);
    } else {
      // Reset flag even if no buttons exist
      this.isShowingFloatingButtons = false;
    }
  }

  // Handle floating action button clicks
  async handleFloatingAction(action, selectedText) {
    console.log('Floating action:', action, 'for text:', selectedText.substring(0, 50) + '...');
    
    // Show the sidebar and populate with the appropriate prompt
    window.aiAssistant?.sidebar.showSidebar();
    
    let prompt = '';
    switch (action) {
      case 'explain':
        prompt = `Please explain this text in detail:\n\n"${selectedText}"`;
        break;
      case 'define':
        prompt = `Please define and explain the key terms in this text:\n\n"${selectedText}"`;
        break;
      case 'eli5':
        prompt = `Please explain this text like I'm 5 years old (use simple language):\n\n"${selectedText}"`;
        break;
      case 'summary':
        prompt = `Please summarize this text with the key points:\n\n"${selectedText}"`;
        break;
    }
    
    if (prompt) {
      // Set the prompt in the input field
      const promptInput = document.querySelector('#ai-prompt-input');
      if (promptInput) {
        promptInput.value = prompt;
        // Auto-submit the prompt
        await window.aiAssistant?.sendPromptToAI(prompt);
      }
    }
  }

  // Clean up on navigation
  cleanup() {
    this.removeFloatingButtons();
  }
}

// Export for use in content script
window.SelectionActionsManager = SelectionActionsManager;