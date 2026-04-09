const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

class GroqClient {
  constructor() {
    this.apiKey = GROQ_API_KEY;
  }

  async checkConnection() {
    if (!this.apiKey) {
      return { connected: false, error: 'No API key' };
    }
    return { connected: true, provider: 'groq', models: ['llama-3.1-8b-instant', 'llama-3.2-3b-preview', 'mixtral-8x7b-32768', 'gemma2-9b-it'] };
  }

  async listModels() {
    if (!this.apiKey) return [];
    return [
      { name: 'llama-3.1-8b-instant', description: 'Fast, free, accurate' },
      { name: 'llama-3.2-3b-preview', description: 'Compact, efficient' },
      { name: 'mixtral-8x7b-32768', description: 'Large, powerful' },
      { name: 'gemma2-9b-it', description: 'Google\'s model' }
    ];
  }

  async chat(model, messages, options = {}) {
    if (!this.apiKey) {
      return { success: false, error: 'No API key configured' };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model || 'llama-3.1-8b-instant',
          messages,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API error');
      }

      const data = await response.json();
      return { success: true, response: data.choices[0].message.content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const groqClient = new GroqClient();
