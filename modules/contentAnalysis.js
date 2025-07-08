// Content analysis module
class ContentAnalysisManager {
  constructor() {
    this.contentAnalysis = null;
  }

  // Analyze page content
  analyzePageContent() {
    console.log('Analyzing page content...');

    const analysis = {
      title: document.title,
      url: location.href,
      type: this.detectContentType(),
      wordCount: this.getWordCount(),
      hasCode: this.hasCodeContent(),
      language: this.detectLanguage(),
      mainContent: this.extractMainContent(),
      isLongArticle: this.isLongArticle(),
      readingTime: this.calculateReadingTime(),
      articleText: this.extractArticleText()
    };

    this.contentAnalysis = analysis;
    console.log('Content analysis:', analysis);
    
    return analysis;
  }

  // Detect content type
  detectContentType() {
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
  extractMainContent() {
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
  getWordCount() {
    const text = document.body.textContent;
    return text.trim().split(/\s+/).length;
  }

  // Check if page has code content
  hasCodeContent() {
    return document.querySelector('pre, code, .highlight') !== null;
  }

  // Detect language
  detectLanguage() {
    return document.documentElement.lang || 'en';
  }

  // Check if page is a long article
  isLongArticle() {
    const wordCount = this.getWordCount();
    const hasArticleStructure = document.querySelector('article, .article, .post, .entry, .content');
    const hasHeadings = document.querySelectorAll('h1, h2, h3').length >= 3;
    const hasLongParagraphs = document.querySelectorAll('p').length >= 5;
    
    console.log('🔍 Article Detection Debug:');
    console.log('- Word count:', wordCount);
    console.log('- Has article structure:', !!hasArticleStructure);
    console.log('- Headings count:', document.querySelectorAll('h1, h2, h3').length);
    console.log('- Paragraph count:', document.querySelectorAll('p').length);
    console.log('- Is long article?', wordCount >= 800 && (hasArticleStructure || (hasHeadings && hasLongParagraphs)));
    
    return wordCount >= 800 && (hasArticleStructure || (hasHeadings && hasLongParagraphs));
  }

  // Calculate reading time estimate
  calculateReadingTime() {
    const wordCount = this.getWordCount();
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  // Extract article text for summarization
  extractArticleText() {
    const selectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      'main p',
      '.article p'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        let text = '';
        elements.forEach(el => {
          if (el.tagName === 'P' || el.tagName === 'ARTICLE' || el.classList.contains('content')) {
            text += el.textContent.trim() + '\n\n';
          }
        });
        
        if (text.trim().length > 500) {
          return text.trim().substring(0, 3000); // Limit to 3000 chars for summarization
        }
      }
    }

    // Fallback: get all paragraphs
    const paragraphs = document.querySelectorAll('p');
    let text = '';
    for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
      const pText = paragraphs[i].textContent.trim();
      if (pText.length > 50) { // Skip short paragraphs
        text += pText + '\n\n';
      }
    }
    
    return text.trim().substring(0, 3000);
  }

  // Update context info in sidebar
  updateContextInfo(analysis) {
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

    const readingTimeText = analysis.readingTime ? ` • ${analysis.readingTime}` : '';
    
    contextInfo.innerHTML = `
      <div class="ai-context-type">
        <span class="ai-context-icon">${icon}</span>
        <span class="ai-context-text">${typeText} • ${analysis.wordCount} words${readingTimeText}</span>
      </div>
    `;
  }

  // Show article features in sidebar
  showSidebarArticleFeatures(analysis) {
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
        <span class="ai-context-text">${typeText} • ${analysis.wordCount} words • ${analysis.readingTime}</span>
      </div>
      <div class="ai-article-actions">
        <button class="ai-action-btn ai-action-btn-small" data-action="auto-summarize">
          <span class="ai-action-icon">📝</span>
          Auto-Summarize
        </button>
        <button class="ai-action-btn ai-action-btn-small" data-action="tldr">
          <span class="ai-action-icon">⚡</span>
          TL;DR
        </button>
      </div>
    `;

    // Add event listeners for sidebar buttons
    const autoSummarizeBtn = contextInfo.querySelector('[data-action="auto-summarize"]');
    const tldrBtn = contextInfo.querySelector('[data-action="tldr"]');
    
    autoSummarizeBtn?.addEventListener('click', () => window.aiAssistant?.handleArticleAction('auto-summarize'));
    tldrBtn?.addEventListener('click', () => window.aiAssistant?.handleArticleAction('tldr'));
  }
}

// Export for use in content script
window.ContentAnalysisManager = ContentAnalysisManager;