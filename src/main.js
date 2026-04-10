import * as THREE from 'three';
import { DebateRoom } from './DebateRoom.js';
import { aiClient, PERSONAS } from './ai/client.js';
import { speechSynth } from './ai/speech.js';
import { debateManager } from './ai/debate.js';

class App {
  constructor() {
    this.debateRoom = new DebateRoom();
    this.speechEnabled = false;
    this.selectedModels = [];
    this.cloudMode = false;
    this.debateHistory = [];
    this.currentDebate = [];
    
    this.init();
  }
  
  async init() {
    await this.checkConnection();
    this.setupEventListeners();
    this.populateModelSelector();
    this.populatePersonaSelector();
    
    debateManager.setModels(this.debateRoom.getModels());
    debateManager.setUpdateCallback((entry) => this.handleDebateUpdate(entry));
  }
  
  async checkConnection() {
    const status = document.getElementById('model-status');
    const connection = await aiClient.checkConnection();
    
    this.cloudMode = connection.provider === 'openai' || connection.provider === 'groq';
    
    if (connection.connected) {
      const provider = connection.provider === 'groq' ? 'Groq (Free!)' : (this.cloudMode ? 'OpenAI' : 'Ollama');
      const modelCount = Array.isArray(connection.models) ? connection.models.length : 0;
      status.textContent = `Connected to ${provider} (${modelCount} models)`;
      status.style.color = '#4ade80';
    } else {
      status.textContent = `Not connected: ${connection.error}`;
      status.style.color = '#e94560';
    }
  }
  
  setupEventListeners() {
    const sendBtn = document.getElementById('send-btn');
    const questionInput = document.getElementById('question-input');
    const voiceToggle = document.getElementById('voice-toggle');
    const startDebateBtn = document.getElementById('start-debate-btn');
    const addModelBtn = document.getElementById('add-model-btn');
    const saveDebateBtn = document.getElementById('save-debate-btn');
    
    sendBtn.addEventListener('click', () => this.handleSend());
    questionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
    
    voiceToggle.addEventListener('click', () => {
      this.speechEnabled = speechSynth.toggle();
      voiceToggle.classList.toggle('listening', this.speechEnabled);
    });
    
    startDebateBtn.addEventListener('click', () => this.handleStartDebate());
    addModelBtn.addEventListener('click', () => this.showAddModelDialog());
    
    if (saveDebateBtn) {
      saveDebateBtn.addEventListener('click', () => this.saveDebate());
    }
  }
  
  populateModelSelector() {
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    
    this.debateRoom.getModels().forEach(model => {
      const tag = document.createElement('div');
      tag.className = 'model-tag';
      tag.innerHTML = `
        <span class="model-icon">${this.getModelIcon(model.displayName)}</span>
        ${model.displayName}
        <span class="remove" data-model-id="${model.modelId}">×</span>
      `;
      tag.querySelector('.remove').addEventListener('click', () => {
        this.debateRoom.removeModel(model);
        this.populateModelSelector();
      });
      modelList.appendChild(tag);
    });
  }
  
  populatePersonaSelector() {
    const personaSelector = document.getElementById('persona-selector');
    if (!personaSelector) return;
    
    personaSelector.innerHTML = '';
    Object.entries(PERSONAS).forEach(([key, persona]) => {
      const option = document.createElement('button');
      option.className = 'persona-btn';
      option.innerHTML = `${persona.icon} ${persona.name}`;
      option.style.setProperty('--persona-color', persona.color);
      option.dataset.persona = key;
      option.addEventListener('click', () => this.selectPersona(key));
      personaSelector.appendChild(option);
    });
  }
  
  getModelIcon(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('llama')) return '🦙';
    if (lowerName.includes('gpt')) return '🤖';
    if (lowerName.includes('claude')) return '🧠';
    if (lowerName.includes('gemini')) return '✨';
    return '🎯';
  }
  
  async showAddModelDialog() {
    const models = await aiClient.listModels();
    
    if (models.length === 0) {
      alert('No models available.');
      return;
    }
    
    if (this.cloudMode) {
      const model = prompt(
        `Available models:\n${models.map(m => `- ${m.name}: ${m.description}`).join('\n')}\n\nEnter model name:`
      );
      if (model && models.find(m => m.name === model)) {
        this.debateRoom.addModel(model, model.toUpperCase(), new THREE.Vector3(
          (Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 4
        ));
        this.populateModelSelector();
        debateManager.setModels(this.debateRoom.getModels());
      }
    } else {
      const modelNames = models.map(m => m.name).join(', ');
      const selectedName = prompt(`Available models: ${modelNames}\n\nEnter model name to add:`);
      if (selectedName) {
        const model = models.find(m => m.name === selectedName);
        if (model) {
          const displayName = selectedName.split(':')[0].replace('-', ' ');
          this.debateRoom.addModel(selectedName, displayName, new THREE.Vector3(
            (Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 4
          ));
          this.populateModelSelector();
          debateManager.setModels(this.debateRoom.getModels());
        }
      }
    }
  }
  
  async handleSend() {
    const input = document.getElementById('question-input');
    const question = input.value.trim();
    
    if (!question) return;
    
    input.value = '';
    this.addMessage(question, 'question');
    this.currentDebate.push({ role: 'user', content: question, timestamp: Date.now() });
    
    const models = this.debateRoom.getModels();
    
    for (const model of models) {
      model.setThinking(true);
      const thinkingMsg = this.addMessage(`${this.getModelIcon(model.displayName)} ${model.displayName} is thinking...`, 'thinking');
      const thinkingId = thinkingMsg.dataset.id;
      
      let fullResponse = '';
      
      if (this.cloudMode) {
        const result = await aiClient.chatWithPersona(
          model.modelId,
          this.selectedPersona || 'scientist',
          question,
          (chunk, full) => {
            fullResponse = full;
            this.updateStreamingMessage(thinkingId, `${this.getModelIcon(model.displayName)} ${model.displayName}: ${full}...`);
          }
        );
        
        model.setThinking(false);
        
        if (thinkingMsg) thinkingMsg.remove();
        
        if (result.success) {
          const answerCard = this.addAnswerCard(model, result.response);
          this.currentDebate.push({ role: 'assistant', model: model.displayName, content: result.response, timestamp: Date.now() });
          
          if (this.speechEnabled) {
            model.setSpeaking(true);
            speechSynth.speak(`${model.displayName} says: ${result.response}`, () => {}, () => model.setSpeaking(false));
          }
        } else {
          this.addMessage(`Error: ${result.error}`, 'error', model.displayName);
        }
      } else {
        const result = await aiClient.chat(model.modelId, [{ role: 'user', content: question }]);
        
        model.setThinking(false);
        if (thinkingMsg) thinkingMsg.remove();
        
        if (result.success) {
          this.addAnswerCard(model, result.response);
        } else {
          this.addMessage(`Error: ${result.error}`, 'error', model.displayName);
        }
      }
    }
  }
  
  addMessage(text, type, modelName = null) {
    const messages = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.dataset.id = `msg-${Date.now()}-${Math.random()}`;
    
    if (type === 'question') {
      message.innerHTML = `<span class="you-icon">👤</span> <span class="question-text">${text}</span>`;
    } else if (modelName) {
      message.innerHTML = `<div class="model-name">${modelName}</div><div class="answer-text">${text}</div>`;
    } else {
      message.innerHTML = text;
    }
    
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }
  
  updateStreamingMessage(id, text) {
    const msg = document.querySelector(`[data-id="${id}"]`);
    if (msg) {
      msg.innerHTML = `<span class="streaming-text">${text}</span><span class="cursor">▊</span>`;
    }
  }
  
  addAnswerCard(model, response) {
    const messages = document.getElementById('chat-messages');
    const card = document.createElement('div');
    card.className = 'answer-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="model-icon">${this.getModelIcon(model.displayName)}</span>
        <span class="model-name">${model.displayName}</span>
        <button class="score-btn" onclick="app.scoreAnswer(this)">⭐ Score</button>
      </div>
      <div class="card-body">${response}</div>
      <div class="card-footer">
        <button class="action-btn" onclick="app.copyAnswer(this)">📋 Copy</button>
        <button class="action-btn" onclick="app.regenerateAnswer(this, '${model.modelId}')">🔄 Retry</button>
      </div>
    `;
    messages.appendChild(card);
    messages.scrollTop = messages.scrollHeight;
    return card;
  }
  
  async scoreAnswer(btn) {
    const card = btn.closest('.answer-card');
    const body = card.querySelector('.card-body');
    const response = body.textContent;
    const question = this.currentDebate.find(m => m.role === 'user')?.content || 'General question';
    
    btn.textContent = '⏳ Scoring...';
    btn.disabled = true;
    
    const score = await aiClient.scoreResponse(question, response);
    
    btn.disabled = false;
    
    if (score) {
      const scoreCard = document.createElement('div');
      scoreCard.className = 'score-card';
      scoreCard.innerHTML = `
        <div class="score-header">📊 Score: ${score.score}/10</div>
        <div class="score-stats">
          <span>Clarity: ${score.clarity}/10</span>
          <span>Evidence: ${score.evidence}/10</span>
          <span>Reasoning: ${score.reasoning}/10</span>
        </div>
        <div class="score-feedback">${score.feedback}</div>
      `;
      card.appendChild(scoreCard);
    } else {
      btn.textContent = '⭐ Score (Failed)';
    }
  }
  
  copyAnswer(btn) {
    const card = btn.closest('.answer-card');
    const body = card.querySelector('.card-body');
    navigator.clipboard.writeText(body.textContent);
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 2000);
  }
  
  async regenerateAnswer(btn, modelId) {
    const card = btn.closest('.answer-card');
    const body = card.querySelector('.card-body');
    const question = this.currentDebate.find(m => m.role === 'user')?.content;
    
    if (!question) return;
    
    btn.textContent = '⏳...';
    btn.disabled = true;
    body.innerHTML = 'Generating...';
    
    const result = await aiClient.chat(modelId, [{ role: 'user', content: question }]);
    
    btn.disabled = false;
    btn.textContent = '🔄 Retry';
    
    if (result.success) {
      body.innerHTML = result.response;
    } else {
      body.innerHTML = `Error: ${result.error}`;
    }
  }
  
  async handleStartDebate() {
    const input = document.getElementById('question-input');
    const question = input.value.trim() || 'What is the meaning of life?';
    
    this.currentDebate = [];
    this.addMessage(`⚔️ Starting debate: ${question}`, 'debate-start');
    this.debateHistory.push({ question, timestamp: Date.now() });
    
    await debateManager.startDebate(question);
  }
  
  handleDebateUpdate(entry) {
    if (entry.event) {
      switch (entry.event) {
        case 'MODEL_THINKING':
          entry.model?.setThinking(true);
          break;
        case 'DEBATE_STARTED':
          this.addMessage('⚔️ Debate has started!', 'debate');
          break;
        case 'DEBATE_ROUND':
          this.addMessage(`📢 Round ${entry.round} begins`, 'round');
          break;
        case 'DEBATE_WINNER':
          if (entry.winner) {
            this.addMessage(`🏆 Winner: ${entry.winner.modelName}! ${entry.reasoning}`, 'winner');
          }
          break;
      }
    } else if (entry.type === 'answer') {
      this.addMessage(entry.data, 'answer', 'System');
    } else if (entry.type === 'error') {
      this.addMessage(`❌ ${entry.message}`, 'error');
    }
    
    this.updateDebateLog(entry);
  }
  
  updateDebateLog(entry) {
    const debateLog = document.getElementById('debate-log');
    if (!debateLog) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'debate-entry';
    if (entry.type === 'winner') logEntry.classList.add('winner');
    logEntry.textContent = `${entry.type}: ${entry.message}`;
    debateLog.appendChild(logEntry);
    debateLog.scrollTop = debateLog.scrollHeight;
  }
  
  saveDebate() {
    const debateText = this.currentDebate.map(m => {
      if (m.role === 'user') return `👤 You: ${m.content}`;
      return `${m.model || 'AI'}: ${m.content}`;
    }).join('\n\n');
    
    const blob = new Blob([debateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.App = App;
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
