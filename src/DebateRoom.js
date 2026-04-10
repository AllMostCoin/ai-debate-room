import * as THREE from 'three';
import { Room } from './3d/Room.js';
import { AIModel3D } from './3d/AIModel3D.js';

const CHARACTERS = {
  'gpt-4': { name: 'Cloud', emoji: '⚔️', description: 'GPT-4.1 - The Hero' },
  'claude': { name: 'Barret', emoji: '🔫', description: 'Claude Sonnet - The Tank' },
  'gemini': { name: 'Red XIII', emoji: '🔥', description: 'Gemini 2.5 - The Speedster' },
  'mistral': { name: 'Cid', emoji: '🦞', description: 'Mistral - The Mechanic' },
  'llama3': { name: 'Tifa', emoji: '👊', description: 'Llama 3 - The Brawler' },
  'codellama': { name: 'Vincent', emoji: '🦇', description: 'Code Llama - The Dark' },
  'copilot': { name: 'Sephiroth', emoji: '👑', description: 'GitHub Copilot - The Nemesis' },
  'grok': { name: 'Yuffie', emoji: '🌊', description: 'Grok 3 - The Ninja' },
  'ollama': { name: 'Nanaki', emoji: '🌙', description: 'Ollama - The Guardian' }
};

class DebateRoom {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.room = null;
    this.aiModels = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedModel = null;
    this.fightState = 'idle';
    this.currentRound = 1;
    this.responses = {};
    this.winner = null;
    
    this.init();
  }
  
  init() {
    this.setupScene();
    this.setupLighting();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    
    this.room = new Room(this.scene);
    this.addDefaultModels();
    
    this.startFightSequence();
    
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('click', (e) => this.onClick(e));
    
    this.animate();
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);
  }
  
  setupLighting() {
    const ambient = new THREE.AmbientLight(0x111111, 0.3);
    this.scene.add(ambient);
    
    const mainLight = new THREE.PointLight(0xe94560, 1.5, 50);
    mainLight.position.set(0, 15, 0);
    this.scene.add(mainLight);
    
    const accentLight1 = new THREE.PointLight(0xe94560, 2, 20);
    accentLight1.position.set(-10, 5, 5);
    this.scene.add(accentLight1);
    
    const accentLight2 = new THREE.PointLight(0x00ffff, 1.5, 20);
    accentLight2.position.set(10, 5, -5);
    this.scene.add(accentLight2);
    
    const bottomLight1 = new THREE.PointLight(0xe94560, 1, 15);
    bottomLight1.position.set(0, 0.5, 0);
    this.scene.add(bottomLight1);
    
    const bottomLight2 = new THREE.PointLight(0x00ffff, 0.5, 15);
    bottomLight2.position.set(-5, 0.5, 5);
    this.scene.add(bottomLight2);
    
    const bottomLight3 = new THREE.PointLight(0x00ffff, 0.5, 15);
    bottomLight3.position.set(5, 0.5, -5);
    this.scene.add(bottomLight3);
    
    this.mainLight = mainLight;
    this.accentLights = [accentLight1, accentLight2, bottomLight1, bottomLight2, bottomLight3];
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 20);
    this.camera.lookAt(0, 2, 0);
  }
  
  setupRenderer() {
    const container = document.getElementById('canvas-container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
  }
  
  setupControls() {
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      
      const theta = deltaX * 0.01;
      const phi = deltaY * 0.01;
      
      const pos = this.camera.position;
      const x = pos.x * Math.cos(theta) - pos.z * Math.sin(theta);
      const z = pos.x * Math.sin(theta) + pos.z * Math.cos(theta);
      pos.x = x;
      pos.z = z;
      
      pos.y = Math.max(3, Math.min(20, pos.y - phi));
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    this.renderer.domElement.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    this.renderer.domElement.addEventListener('wheel', (e) => {
      const zoomSpeed = 0.1;
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      
      const distance = this.camera.position.length();
      const newDistance = distance + e.deltaY * zoomSpeed * 0.01;
      
      if (newDistance > 8 && newDistance < 50) {
        this.camera.position.multiplyScalar(newDistance / distance);
        this.camera.position.y = Math.max(3, Math.min(20, this.camera.position.y));
      }
    });
  }
  
  addDefaultModels() {
    const useGroq = import.meta.env.VITE_USE_GROQ === 'true';
    if (useGroq) {
      this.addModel('gpt-4', 'GPT-4.1', new THREE.Vector3(-6, 0, 0));
      this.addModel('claude', 'Claude Sonnet', new THREE.Vector3(-2, 0, 0));
      this.addModel('gemini', 'Gemini 2.5', new THREE.Vector3(2, 0, 0));
    } else {
      const models = [
        { id: 'gpt-4', name: 'Cloud', x: -7 },
        { id: 'claude', name: 'Barret', x: -3.5 },
        { id: 'gemini', name: 'Red XIII', x: 0 },
        { id: 'mistral', name: 'Cid', x: 3.5 },
        { id: 'llama3', name: 'Tifa', x: 7 }
      ];
      
      models.forEach(m => {
        this.addModel(m.id, m.name, new THREE.Vector3(m.x, 0, 0));
      });
    }
  }
  
  addModel(modelId, displayName, position) {
    const character = CHARACTERS[modelId] || { name: displayName, emoji: '🤖' };
    const model = new AIModel3D(this.scene, modelId, character.name, position, character);
    this.aiModels.push(model);
    return model;
  }
  
  removeModel(model) {
    model.remove();
    this.aiModels = this.aiModels.filter(m => m !== model);
  }
  
  startFightSequence() {
    this.fightState = 'intros';
    this.fightSequenceTime = 0;
    
    this.room.showRound(1);
    
    this.aiModels.forEach((model, i) => {
      setTimeout(() => {
        model.startIntro();
      }, 1500 + i * 300);
    });
  }
  
  scoreResponse(response, question, modelId) {
    const keywords = this.extractKeywords(question);
    let score = 0;
    
    const responseLower = response.toLowerCase();
    
    keywords.forEach(kw => {
      if (responseLower.includes(kw.toLowerCase())) {
        score += 10;
      }
    });
    
    if (response.length > 100) score += 5;
    if (response.length > 500) score += 10;
    
    if (response.includes('.') && response.includes(',')) score += 5;
    
    const bonusScores = {
      'gpt-4': 15,
      'claude': 12,
      'gemini': 10,
      'mistral': 5,
      'llama3': 5
    };
    score += bonusScores[modelId] || 0;
    
    return Math.min(score, 100);
  }
  
  extractKeywords(text) {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'who', 'which'];
    return text.split(' ')
      .filter(word => word.length > 4 && !stopWords.includes(word.toLowerCase()))
      .slice(0, 10);
  }
  
  addResponse(modelId, response, question) {
    this.responses[modelId] = response;
    
    const model = this.aiModels.find(m => m.modelId === modelId);
    if (model) {
      const score = this.scoreResponse(response, question, modelId);
      model.addScore(score);
      model.setThinking(false);
    }
  }
  
  crownWinner() {
    const scored = this.aiModels.filter(m => m.health > 0);
    scored.sort((a, b) => b.score - a.score);
    
    if (scored.length > 0) {
      this.winner = scored[0];
      scored[0].crown();
      
      this.room.showWinner(scored[0].displayName);
    }
  }
  
  simulateDebateRound(question) {
    this.aiModels.forEach((model, i) => {
      model.setThinking(true);
      
      setTimeout(() => {
        const demoResponses = [
          `As ${model.displayName}, I believe this question requires careful analysis. The key factors involve understanding the context and applying logical reasoning. In conclusion, the best approach balances multiple considerations.`,
          `This is an interesting challenge. ${model.displayName} here with my perspective: we need to consider both short-term and long-term implications. My recommendation would be to focus on the core fundamentals first.`,
          `${model.character?.emoji || '🤖'} ${model.displayName} speaking! Here's my take: the answer depends on several variables. Let me break it down systematically and provide actionable insights.`
        ];
        
        const response = demoResponses[i % demoResponses.length];
        this.addResponse(model.modelId, response, question);
        model.setSpeaking(true);
        
        const target = this.aiModels.filter(m => m !== model)[Math.floor(Math.random() * (this.aiModels.length - 1))];
        if (target && Math.random() > 0.3) {
          setTimeout(() => {
            target.takeDamage(Math.floor(Math.random() * 10) + 5);
          }, 300);
        }
        
        setTimeout(() => {
          model.setSpeaking(false);
        }, 2000);
        
      }, 1000 + i * 500);
    });
    
    setTimeout(() => {
      this.crownWinner();
    }, 4000);
  }
  
  selectModel(model) {
    if (this.selectedModel) {
      this.selectedModel.deselect();
    }
    this.selectedModel = model;
    if (model) {
      model.select();
    }
  }
  
  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(
      this.aiModels.flatMap(m => m.getClickableObjects())
    );
    
    if (intersects.length > 0) {
      const clickedModel = this.aiModels.find(m => 
        m.getClickableObjects().includes(intersects[0].object)
      );
      this.selectModel(clickedModel);
    } else {
      this.selectModel(null);
    }
  }
  
  onResize() {
    const container = document.getElementById('canvas-container');
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.updateFightSequence();
    
    this.aiModels.forEach(model => model.update());
    this.room.update();
    
    this.renderer.render(this.scene, this.camera);
  }
  
  updateFightSequence() {
    this.fightSequenceTime += 0.016;
    
    const allIntrosComplete = this.aiModels.every(m => m.introComplete);
    
    if (this.fightState === 'intros' && allIntrosComplete) {
      this.fightState = 'ready';
      this.aiModels.forEach(m => m.fightState = 'idle');
    }
  }
  
  getModels() {
    return this.aiModels;
  }
  
  getWinner() {
    return this.winner;
  }
  
  getResponses() {
    return this.responses;
  }
  
  resetForNewRound() {
    this.responses = {};
    this.winner = null;
    this.aiModels.forEach(m => {
      m.uncrown();
      m.health = 100;
      m.updateHealthBar();
    });
    this.room.hideAll();
  }
}

export { DebateRoom, CHARACTERS };
