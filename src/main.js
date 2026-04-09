import * as THREE from 'three';
import { DebateRoom } from './DebateRoom.js';
import { aiClient } from './ai/client.js';
import { speechSynth } from './ai/speech.js';
import { debateManager } from './ai/debate.js';

class App {
  constructor() {
    this.debateRoom = new DebateRoom();
    this.speechEnabled = false;
    this.selectedModels = [];
    this.cloudMode = false;
    
    this.init();
  }
  
  async init() {
    await this.checkConnection();
    this.setupEventListeners();
    this.populateModelSelector();
    
    debateManager.setModels(this.debateRoom.getModels());
    debateManager.setUpdateCallback((entry) => this.handleDebateUpdate(entry));
  }
  
  async checkConnection() {
    const status = document.getElementById('model-status');
    const connection = await aiClient.checkConnection();
    
    this.cloudMode = connection.provider === 'openai';
    
    if (connection.connected) {
      const provider = this.cloudMode ? 'OpenAI' : 'Ollama';
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
  }
  
  populateModelSelector() {
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    
    this.debateRoom.getModels().forEach(model => {
      const tag = document.createElement('div');
      tag.className = 'model-tag';
      tag.innerHTML = `
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
    
    const models = this.debateRoom.getModels();
    
    for (const model of models) {
      model.setThinking(true);
      this.addMessage(`Waiting for ${model.displayName}...`, 'thinking');
      const thinkingIndex = document.querySelectorAll('.message.thinking').length - 1;
      
      const result = await aiClient.chat(model.modelId, [
        { role: 'user', content: question }
      ]);
      
      model.setThinking(false);
      
      const thinkingMsg = document.querySelectorAll('.message.thinking')[thinkingIndex];
      if (thinkingMsg) thinkingMsg.remove();
      
      if (result.success) {
        this.addMessage(result.response, 'answer', model.displayName);
        
        if (this.speechEnabled) {
          model.setSpeaking(true);
          speechSynth.speak(
            `${model.displayName} says: ${result.response}`,
            () => model.setSpeaking(true),
            () => model.setSpeaking(false)
          );
        }
      } else {
        this.addMessage(`Error: ${result.error}`, 'error', model.displayName);
      }
    }
  }
  
  async handleStartDebate() {
    const input = document.getElementById('question-input');
    const question = input.value.trim() || 'What is the meaning of life?';
    
    this.addMessage(`Starting debate: ${question}`, 'debate');
    
    await debateManager.startDebate(question);
  }
  
  handleDebateUpdate(entry) {
    if (entry.event) {
      switch (entry.event) {
        case 'MODEL_THINKING':
          entry.model?.setThinking(true);
          break;
        case 'DEBATE_STARTED':
          this.addMessage('Debate has started!', 'debate');
          break;
        case 'DEBATE_ROUND':
          this.addMessage(`Round ${entry.round} begins`, 'round');
          break;
        case 'DEBATE_WINNER':
          if (entry.winner) {
            this.addMessage(`🏆 Winner: ${entry.winner.modelName}! ${entry.reasoning}`, 'winner');
          }
          break;
      }
    } else if (entry.type === 'answer') {
      this.addMessage(entry.data, 'answer', 'System');
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
  
  addMessage(text, type, modelName = null) {
    const messages = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    if (modelName) {
      message.innerHTML = `<div class="model-name">${modelName}</div><div class="answer-text">${text}</div>`;
    } else {
      message.textContent = text;
    }
    
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
