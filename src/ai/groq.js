const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const PERSONAS = {
  scientist: {
    name: 'Dr. Science',
    persona: 'You are a brilliant scientist who speaks with precision, cites research, and values empirical evidence. You analyze topics from a logical, data-driven perspective.',
    color: '#4ade80',
    icon: '🔬'
  },
  philosopher: {
    name: 'Socrates',
    persona: 'You are an ancient philosopher who questions assumptions, uses Socratic method, and explores the deeper meaning of topics. You speak thoughtfully and pose rhetorical questions.',
    color: '#a78bfa',
    icon: '🏛️'
  },
  comedian: {
    name: 'Comedy King',
    persona: 'You are a witty comedian who addresses serious topics with humor, tells jokes, and lightens the mood while still making valid points.',
    color: '#fbbf24',
    icon: '🎭'
  },
  hacker: {
    name: 'Cyber Punk',
    persona: 'You are a tech hacker who speaks in code metaphors, focuses on digital aspects, cybersecurity, and the future of technology.',
    color: '#22d3ee',
    icon: '💻'
  },
  politician: {
    name: 'Senator',
    persona: 'You are a seasoned politician who speaks persuasively, considers multiple stakeholder perspectives, and often deflects with rhetorical flourishes.',
    color: '#f87171',
    icon: '🎖️'
  },
  historian: {
    name: 'History Buff',
    persona: 'You are a historian who draws parallels to past events, references historical figures, and provides long-term context for topics.',
    color: '#c084fc',
    icon: '📜'
  }
};

class GroqClient {
  constructor() {
    this.apiKey = GROQ_API_KEY;
  }

  async checkConnection() {
    if (!this.apiKey) {
      return { connected: false, error: 'No API key' };
    }
    return { connected: true, provider: 'groq', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'] };
  }

  async listModels() {
    if (!this.apiKey) return [];
    return [
      { name: 'llama-3.1-8b-instant', description: 'Fast, free' },
      { name: 'llama-3.3-70b-versatile', description: 'Large, powerful' }
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

  async chatStreaming(model, messages, options = {}) {
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
          temperature: options.temperature || 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API error');
      }

      return { success: true, stream: response.body, streamController: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async scoreResponse(question, answer) {
    if (!this.apiKey) return null;

    const prompt = `Score this answer on a scale of 1-10 for the question: "${question}"
    
Answer: "${answer}"
    
Provide a JSON response with:
{
  "score": [1-10],
  "clarity": [1-10],
  "evidence": [1-10],
  "reasoning": [1-10],
  "feedback": "[brief feedback]"
}`;

    const result = await this.chat('llama-3.1-8b-instant', [
      { role: 'system', content: 'You are an expert debate judge. Score responses fairly and provide constructive feedback.' },
      { role: 'user', content: prompt }
    ]);

    if (result.success) {
      try {
        return JSON.parse(result.response);
      } catch {
        return { score: 7, feedback: result.response };
      }
    }
    return null;
  }
}

export const groqClient = new GroqClient();
