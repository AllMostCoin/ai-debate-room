import { ollamaClient } from './ollama.js';
import { speechSynth } from './speech.js';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const USE_CLOUD = import.meta.env.VITE_USE_CLOUD === 'true';

class AIClient {
  constructor() {
    this.ollama = ollamaClient;
    this.cloudEnabled = USE_CLOUD && OPENAI_API_KEY;
    this.currentProvider = USE_CLOUD ? 'openai' : 'ollama';
  }

  async checkConnection() {
    if (this.cloudEnabled) {
      return { connected: true, provider: 'openai', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] };
    }
    return await this.ollama.checkConnection();
  }

  async listModels() {
    if (this.cloudEnabled) {
      return [
        { name: 'gpt-4o-mini', description: 'Fast, affordable' },
        { name: 'gpt-4o', description: 'Most capable' },
        { name: 'gpt-3.5-turbo', description: 'Legacy model' }
      ];
    }
    return await this.ollama.listModels();
  }

  async chat(model, messages, options = {}) {
    if (this.cloudEnabled) {
      return await this.chatOpenAI(model, messages, options);
    }
    return await this.ollama.chat(model, messages, options);
  }

  async chatOpenAI(model, messages, options = {}) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      return { success: true, response: data.choices[0].message.content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async chatOllama(model, messages, options = {}) {
    return await this.ollama.chat(model, messages, options);
  }

  async analyzeResponse(model, originalQuestion, responses) {
    const analysisPrompt = `You are analyzing responses to: "${originalQuestion}"

Responses:
${responses.map((r, i) => `${i + 1}. ${r.modelName}: "${r.answer}"`).join('\n')}

Analyze and pick the best. Format:
WINNER: [1-${responses.length}]
REASONING: [brief explanation]`;

    const result = await this.chat(model, [{ role: 'user', content: analysisPrompt }]);
    
    if (result.success) {
      const winnerMatch = result.response.match(/WINNER:\s*(\d+)/i);
      const reasonMatch = result.response.match(/REASONING:\s*(.+)/i);
      return {
        winnerIndex: winnerMatch ? parseInt(winnerMatch[1]) - 1 : -1,
        reasoning: reasonMatch ? reasonMatch[1].trim() : 'No reasoning'
      };
    }
    return null;
  }

  async improveResponse(model, question, currentAnswer, criticism) {
    const prompt = `Question: "${question}"
Your answer: "${currentAnswer}"
Criticism: "${criticism}"

Provide an improved answer:`;

    return await this.chat(model, [{ role: 'user', content: prompt }]);
  }
}

export const aiClient = new AIClient();
