// OpenAI API Provider module
class OpenAIProvider {
  constructor() {
    this.apiKey = null;
    this.model = 'gpt-4o-mini';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // Initialize with settings
  async initialize() {
    await this.loadSettings();
  }

  // Load settings from storage
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['openaiModel']);
      const encryptedData = await chrome.storage.local.get(['openaiApiKey']);
      
      this.model = settings.openaiModel || 'gpt-4o-mini';
      this.apiKey = encryptedData.openaiApiKey || null;
      
      console.log('OpenAI Provider initialized with model:', this.model);
    } catch (error) {
      console.error('Failed to load OpenAI settings:', error);
    }
  }

  // Check if OpenAI is available
  isAvailable() {
    return !!this.apiKey;
  }

  // Query OpenAI API
  async queryAI(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  // Create a streaming response (for future use)
  async *streamAI(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      stream: true,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  yield parsed.choices[0].delta.content;
                }
              } catch (parseError) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('OpenAI streaming request failed:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.queryAI('Hello, this is a test message.', { maxTokens: 10 });
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get model information
  getModelInfo() {
    const modelInfo = {
      'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: 'Fast and cost-effective model for most tasks',
        maxTokens: 128000,
        costPer1kTokens: { input: 0.00015, output: 0.0006 }
      },
      'gpt-4o': {
        name: 'GPT-4o',
        description: 'Most capable model with vision and advanced reasoning',
        maxTokens: 128000,
        costPer1kTokens: { input: 0.005, output: 0.015 }
      },
      'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'High-performance model with large context window',
        maxTokens: 128000,
        costPer1kTokens: { input: 0.01, output: 0.03 }
      },
      'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and affordable model for simpler tasks',
        maxTokens: 16385,
        costPer1kTokens: { input: 0.0005, output: 0.0015 }
      }
    };

    return modelInfo[this.model] || modelInfo['gpt-4o-mini'];
  }

  // Update settings
  async updateSettings(newSettings) {
    if (newSettings.model) {
      this.model = newSettings.model;
    }
    if (newSettings.apiKey) {
      this.apiKey = newSettings.apiKey;
    }
    
    console.log('OpenAI Provider settings updated');
  }

  // Format prompt for OpenAI (can be customized per use case)
  formatPrompt(prompt, context = {}) {
    let formattedPrompt = prompt;

    // Add system context if provided
    if (context.systemPrompt) {
      formattedPrompt = `${context.systemPrompt}\n\nUser: ${prompt}`;
    }

    // Add conversation history if provided
    if (context.history && context.history.length > 0) {
      const historyText = context.history.map(item => `${item.role}: ${item.content}`).join('\n');
      formattedPrompt = `${historyText}\n\nUser: ${prompt}`;
    }

    return formattedPrompt;
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Get usage statistics
  getUsageStats() {
    return {
      provider: 'OpenAI',
      model: this.model,
      modelInfo: this.getModelInfo(),
      isConfigured: this.isAvailable()
    };
  }
}

// Export for use in content script
window.OpenAIProvider = OpenAIProvider;

// Log that OpenAI Provider module is loaded
console.log('📦 OpenAI Provider module loaded');