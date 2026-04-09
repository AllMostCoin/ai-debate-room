const OLLAMA_HOST = 'http://localhost:11434';

class OllamaClient {
  constructor() {
    this.host = OLLAMA_HOST;
  }
  
  async checkConnection() {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return { connected: true, models: data.models || [] };
      }
      return { connected: false, error: 'Connection failed' };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
  
  async listModels() {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
  
  async generate(model, prompt, options = {}) {
    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            ...options
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Generation failed');
      }
      
      const data = await response.json();
      return { success: true, response: data.response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async chat(model, messages, options = {}) {
    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            ...options
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Chat failed');
      }
      
      const data = await response.json();
      return { success: true, response: data.message.content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async analyzeResponse(model, originalQuestion, responses) {
    const analysisPrompt = `You are analyzing responses from multiple AI models to the question: "${originalQuestion}"

Here are the responses:
${responses.map((r, i) => `${i + 1}. ${r.modelName}: "${r.answer}"`).join('\n')}

Analyze each response and determine which one is the best. Consider:
- Accuracy and relevance
- Clarity and coherence
- Depth of understanding
- Usefulness

Provide your analysis in this format:
WINNER: [number of best response]
REASONING: [brief explanation of why this response is best]`;

    const result = await this.chat(model, [
      { role: 'user', content: analysisPrompt }
    ]);
    
    if (result.success) {
      return this.parseAnalysis(result.response);
    }
    return null;
  }
  
  parseAnalysis(analysisText) {
    const winnerMatch = analysisText.match(/WINNER:\s*(\d+)/i);
    const reasonMatch = analysisText.match(/REASONING:\s*(.+)/i);
    
    return {
      winnerIndex: winnerMatch ? parseInt(winnerMatch[1]) - 1 : -1,
      reasoning: reasonMatch ? reasonMatch[1].trim() : 'No reasoning provided'
    };
  }
  
  async improveResponse(model, originalQuestion, currentAnswer, criticism) {
    const improvementPrompt = `The original question was: "${originalQuestion}"

Your previous answer was:
"${currentAnswer}"

You received this criticism:
"${criticism}"

Based on the criticism, provide an improved answer that addresses the weaknesses while maintaining the strengths.`;

    const result = await this.chat(model, [
      { role: 'user', content: improvementPrompt }
    ], { temperature: 0.8 });
    
    if (result.success) {
      return result.response;
    }
    return currentAnswer;
  }
}

export const ollamaClient = new OllamaClient();
