import { aiClient } from './client.js';

class DebateManager {
  constructor() {
    this.models = [];
    this.currentQuestion = '';
    this.debateRound = 0;
    this.maxRounds = 3;
    this.isRunning = false;
    this.onUpdate = null;
  }
  
  setModels(models) {
    this.models = models;
  }
  
  async startDebate(question, modelsToDebate = null) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentQuestion = question;
    this.debateRound = 0;
    
    const participants = modelsToDebate || this.models;
    if (participants.length < 2) {
      this.log('Need at least 2 models to debate');
      this.isRunning = false;
      return;
    }
    
    this.log('Starting debate...');
    this.notify('DEBATE_STARTED');
    
    const responses = [];
    
    this.log('Round 1: All models answer the question');
    for (const model of participants) {
      this.notify('MODEL_THINKING', { model });
      const result = await aiClient.chat(model.modelId, [
        { role: 'user', content: question }
      ]);
      
      if (result.success) {
        responses.push({
          modelId: model.modelId,
          modelName: model.displayName,
          answer: result.response,
          round: 1
        });
        this.log(`${model.displayName} answered`, 'answer', result.response);
      } else {
        this.log(`${model.displayName} failed: ${result.error}`, 'error');
      }
    }
    
    this.debateRound = 1;
    
    if (responses.length >= 2) {
      this.log('Round 2: Models analyze each other\'s answers');
      this.notify('DEBATE_ROUND', { round: 2 });
      
      for (const model of participants) {
        this.notify('MODEL_THINKING', { model });
        const analysis = await aiClient.analyzeResponse(
          model.modelId,
          question,
          responses.filter(r => r.modelId !== model.modelId)
        );
        
        if (analysis) {
          this.log(`${model.displayName} analyzed responses`, 'analysis', analysis);
          responses.push({
            modelId: model.modelId,
            modelName: model.displayName,
            answer: `Analysis: ${analysis.reasoning}`,
            round: 2,
            isAnalysis: true
          });
        }
      }
      
      this.debateRound = 2;
      
      this.log('Round 3: Models improve their answers');
      this.notify('DEBATE_ROUND', { round: 3 });
      
      const firstRoundResponses = responses.filter(r => r.round === 1);
      const analyses = responses.filter(r => r.isAnalysis);
      
      for (const response of firstRoundResponses) {
        const criticism = analyses
          .filter(a => a.modelId !== response.modelId)
          .map(a => a.answer)
          .join(' ');
        
        const model = participants.find(m => m.modelId === response.modelId);
        if (model) {
          this.notify('MODEL_THINKING', { model });
          const improved = await aiClient.improveResponse(
            model.modelId,
            question,
            response.answer,
            criticism
          );
          
          responses.push({
            modelId: response.modelId,
            modelName: response.modelName,
            answer: improved,
            round: 3,
            isImproved: true
          });
          this.log(`${response.modelName} improved answer`, 'improved', improved);
        }
      }
    }
    
    this.debateRound = 3;
    this.determineWinner(responses);
    
    this.isRunning = false;
    this.notify('DEBATE_ENDED', { responses });
  }
  
  async determineWinner(responses) {
    const finalResponses = responses.filter(r => r.round === 3);
    
    if (finalResponses.length < 2) {
      this.log('Not enough responses to determine a winner');
      return;
    }
    
    this.log('Determining the winner...');
    
    const bestModel = this.models.find(m => m.modelId === 'llama3') || this.models[0];
    
    const analysis = await aiClient.analyzeResponse(
      bestModel.modelId,
      this.currentQuestion,
      finalResponses
    );
    
    if (analysis && analysis.winnerIndex >= 0 && analysis.winnerIndex < finalResponses.length) {
      const winner = finalResponses[analysis.winnerIndex];
      this.log(`WINNER: ${winner.modelName}`, 'winner');
      this.log(`Reasoning: ${analysis.reasoning}`, 'reasoning');
      this.notify('DEBATE_WINNER', { winner, reasoning: analysis.reasoning });
    } else {
      this.log('Could not determine a clear winner');
      this.notify('DEBATE_WINNER', { winner: null });
    }
  }
  
  async askAllModels(question, onResponse) {
    const promises = this.models.map(async (model) => {
      model.setThinking(true);
      this.notify('MODEL_THINKING', { model });
      
      const result = await aiClient.chat(model.modelId, [
        { role: 'user', content: question }
      ]);
      
      model.setThinking(false);
      
      if (result.success) {
        if (onResponse) {
          onResponse(model, result.response);
        }
        return { model, response: result.response };
      } else {
        return { model, error: result.error };
      }
    });
    
    return Promise.all(promises);
  }
  
  log(message, type = 'info', data = null) {
    const entry = { message, type, data, timestamp: Date.now() };
    if (this.onUpdate) {
      this.onUpdate(entry);
    }
  }
  
  notify(event, data = {}) {
    if (this.onUpdate) {
      this.onUpdate({ event, ...data });
    }
  }
  
  setUpdateCallback(callback) {
    this.onUpdate = callback;
  }
}

export const debateManager = new DebateManager();
