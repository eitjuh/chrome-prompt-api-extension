// AI session management module
class AISessionManager {
  constructor() {
    this.aiSession = null;
  }

  // Query AI using Chrome Prompt API
  async queryAI(prompt) {
    if (!this.aiSession) {
      this.aiSession = await this.createAISession();
    }

    const response = await this.aiSession.prompt(prompt);
    return response;
  }

  // Create AI session
  async createAISession() {
    try {
      // Check if Language Model API is available
      if (!('LanguageModel' in self)) {
        throw new Error('Chrome Prompt API not available');
      }

      // Check current availability
      const availability = await LanguageModel.availability();
      console.log('LanguageModel availability:', availability);

      if (availability === 'no' || availability === 'unavailable') {
        throw new Error('AI model not available on this device');
      }

      if (availability === 'after-download') {
        throw new Error('AI model needs to be downloaded first');
      }
      
      // Accept both 'available' and 'readily' as ready states
      if (availability !== 'available' && availability !== 'readily') {
        throw new Error(`Unexpected availability state: ${availability}`);
      }

      // Create session with optimal parameters
      const session = await LanguageModel.create({
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
  async startModelDownload() {
    try {
      window.aiAssistant?.sidebar.updateAIStatus('downloading');

      // Create a session which triggers the download
      const session = await LanguageModel.create();

      // Store session for later use
      this.aiSession = session;

      console.log('✅ AI model downloaded and session created');
      window.aiAssistant?.sidebar.updateAIStatus('ready');

    } catch (error) {
      console.error('❌ Model download failed:', error);
      window.aiAssistant?.sidebar.updateAIStatus('error', 'Failed to download model: ' + error.message);
    }
  }

  // Check AI availability
  async checkAIAvailability() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'checkPromptAPI'
      });

      console.log('AI availability response:', response);

      if (response.available) {
        if (response.state === 'ready') {
          console.log('✅ AI is ready');
          window.aiAssistant?.sidebar.updateAIStatus('ready');
        } else if (response.state === 'download-required') {
          console.log('📥 AI requires download');
          window.aiAssistant?.sidebar.updateAIStatus('download-required');
        }
      } else {
        console.log('❌ AI is not available:', response.error);
        window.aiAssistant?.sidebar.updateAIStatus('unavailable', response.error);
      }
    } catch (error) {
      console.error('Failed to check AI availability:', error);
      window.aiAssistant?.sidebar.updateAIStatus('error', error.message);
    }
  }

  // Send prompt to AI
  async sendPromptToAI(prompt) {
    console.log('Sending prompt to AI:', prompt);

    // Show loading state
    window.aiAssistant?.sidebar.showLoading();

    try {
      const response = await this.queryAI(prompt);
      window.aiAssistant?.sidebar.displayResponse(response);
    } catch (error) {
      console.error('AI query failed:', error);
      window.aiAssistant?.sidebar.displayError(error.message);
    }
  }

  // Handle article-specific actions
  async handleArticleAction(action) {
    console.log('Article action:', action);
    
    const contentAnalysis = window.aiAssistant?.contentAnalysis?.contentAnalysis;
    if (!contentAnalysis?.articleText) {
      await this.sendPromptToAI('Sorry, I could not extract enough article content for summarization.');
      return;
    }

    let prompt = '';
    switch (action) {
      case 'auto-summarize':
        prompt = `Please provide a comprehensive summary of this article:\n\nTitle: ${contentAnalysis.title}\n\nContent: ${contentAnalysis.articleText}\n\nPlease include:\n- Main topic and key points\n- Important conclusions\n- Any actionable insights`;
        break;
        
      case 'tldr':
        prompt = `Please provide a very brief TL;DR (Too Long; Didn't Read) summary of this article in 2-3 sentences:\n\nTitle: ${contentAnalysis.title}\n\nContent: ${contentAnalysis.articleText}`;
        break;
    }

    if (prompt) {
      await this.sendPromptToAI(prompt);
    }
  }

  // Handle quick actions
  async handleQuickAction(action) {
    console.log('Quick action:', action);

    const contentAnalysis = window.aiAssistant?.contentAnalysis?.contentAnalysis;
    if (!contentAnalysis) return;

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
        
      case 'auto-summarize':
      case 'tldr':
        await this.handleArticleAction(action);
        return;
    }

    if (prompt) {
      await this.sendPromptToAI(prompt);
    }
  }

  // Handle quick prompt
  async handleQuickPrompt(prompt) {
    const promptInput = document.querySelector('#ai-prompt-input');
    if (promptInput) {
      promptInput.value = prompt;
    }
    await this.sendPromptToAI(prompt);
  }

  // Handle send prompt
  async handleSendPrompt() {
    const promptInput = document.querySelector('#ai-prompt-input');
    if (!promptInput) return;

    const prompt = promptInput.value.trim();
    if (!prompt) return;

    await this.sendPromptToAI(prompt);
    promptInput.value = '';
  }
}

// Export for use in content script
window.AISessionManager = AISessionManager;