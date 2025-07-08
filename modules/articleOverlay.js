// Article overlay module for page injection features
class ArticleOverlayManager {
  constructor() {
    // No persistent state needed
  }

  // Inject floating article overlay into the page
  injectArticleOverlay(analysis) {
    // Remove any existing overlay
    this.removeArticleOverlay();
    
    // Find the best position for the overlay (article title or top of content)
    const targetElement = this.findArticleTarget();
    if (!targetElement) {
      console.log('❌ Could not find suitable target for article overlay');
      return;
    }
    
    // Create the overlay
    const overlay = document.createElement('div');
    overlay.id = 'ai-article-overlay';
    overlay.className = 'ai-article-overlay';
    
    overlay.innerHTML = `
      <div class="ai-overlay-content">
        <div class="ai-overlay-header">
          <span class="ai-overlay-icon">📄</span>
          <span class="ai-overlay-time">${analysis.readingTime}</span>
          <button class="ai-overlay-close" title="Close">×</button>
        </div>
        <div class="ai-overlay-actions">
          <button class="ai-overlay-btn" data-action="auto-summarize">
            <span class="ai-btn-icon">📝</span>
            Summarize
          </button>
          <button class="ai-overlay-btn" data-action="tldr">
            <span class="ai-btn-icon">⚡</span>
            TL;DR
          </button>
        </div>
      </div>
    `;
    
    // Position the overlay
    this.positionArticleOverlay(overlay, targetElement);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Add event listeners
    this.setupArticleOverlayListeners(overlay);
    
    // Animate in
    setTimeout(() => {
      overlay.classList.add('ai-overlay-visible');
    }, 100);
    
    console.log('✅ Article overlay injected successfully');
  }

  // Find the best target element for positioning the overlay
  findArticleTarget() {
    // Priority order for positioning
    const selectors = [
      'article h1',
      'h1.title', 
      'h1.post-title',
      'h1.entry-title',
      '.article-title',
      'article',
      '.article',
      '.post',
      '.entry',
      'main h1',
      'h1'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        console.log('🎯 Found target element:', selector);
        return element;
      }
    }
    
    return null;
  }

  // Check if element is visible and has reasonable size
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
  }

  // Position the overlay relative to target element
  positionArticleOverlay(overlay, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    
    // Default positioning styles
    overlay.style.cssText = `
      position: fixed;
      top: ${Math.max(10, rect.top - 60)}px;
      right: 20px;
      z-index: 2147483646;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: auto;
    `;
    
    // Adjust if too close to top
    if (rect.top < 80) {
      overlay.style.top = '10px';
    }
  }

  // Setup event listeners for overlay
  setupArticleOverlayListeners(overlay) {
    // Close button
    const closeBtn = overlay.querySelector('.ai-overlay-close');
    closeBtn?.addEventListener('click', () => this.removeArticleOverlay());
    
    // Action buttons
    const actionBtns = overlay.querySelectorAll('.ai-overlay-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleArticleOverlayAction(action);
      });
    });
    
    // Auto-hide after 15 seconds if not interacted with
    let autoHideTimeout = setTimeout(() => {
      this.removeArticleOverlay();
    }, 15000);
    
    // Clear auto-hide on hover
    overlay.addEventListener('mouseenter', () => {
      clearTimeout(autoHideTimeout);
    });
    
    // Restart auto-hide on leave
    overlay.addEventListener('mouseleave', () => {
      autoHideTimeout = setTimeout(() => {
        this.removeArticleOverlay();
      }, 10000);
    });
  }

  // Handle overlay action clicks
  handleArticleOverlayAction(action) {
    // Show the sidebar and execute the action
    window.aiAssistant?.sidebar.showSidebar();
    window.aiAssistant?.handleArticleAction(action);
    
    // Optionally remove the overlay after action
    setTimeout(() => {
      this.removeArticleOverlay();
    }, 500);
  }

  // Remove article overlay
  removeArticleOverlay() {
    const existing = document.getElementById('ai-article-overlay');
    if (existing) {
      existing.style.opacity = '0';
      existing.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }, 300);
    }
  }

  // Clean up on navigation
  cleanup() {
    this.removeArticleOverlay();
  }
}

// Export for use in content script
window.ArticleOverlayManager = ArticleOverlayManager;