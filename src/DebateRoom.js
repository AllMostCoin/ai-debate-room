import * as THREE from 'three';
import { Room } from './3d/Room.js';
import { AIModel3D } from './3d/AIModel3D.js';

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
    
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('click', (e) => this.onClick(e));
    
    this.animate();
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
  }
  
  setupLighting() {
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);
    
    const mainLight = new THREE.PointLight(0xffffff, 1, 100);
    mainLight.position.set(0, 8, 0);
    this.scene.add(mainLight);
    
    const accentLight1 = new THREE.PointLight(0xe94560, 0.5, 30);
    accentLight1.position.set(-5, 3, 5);
    this.scene.add(accentLight1);
    
    const accentLight2 = new THREE.PointLight(0x0f3460, 0.5, 30);
    accentLight2.position.set(5, 3, -5);
    this.scene.add(accentLight2);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, 12);
    this.camera.lookAt(0, 1, 0);
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
      
      pos.y = Math.max(2, Math.min(10, pos.y - phi));
      
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
      
      if (newDistance > 5 && newDistance < 30) {
        this.camera.position.multiplyScalar(newDistance / distance);
      }
    });
  }
  
  addDefaultModels() {
    const useGroq = import.meta.env.VITE_USE_GROQ === 'true';
    if (useGroq) {
      this.addModel('llama-3.1-8b-instant', 'Llama 3.1', new THREE.Vector3(-3, 0, 0));
      this.addModel('mixtral-8x7b-32768', 'Mixtral', new THREE.Vector3(0, 0, 0));
      this.addModel('gemma2-9b-it', 'Gemma 2', new THREE.Vector3(3, 0, 0));
    } else {
      this.addModel('llama3', 'LLama 3', new THREE.Vector3(-3, 0, 0));
      this.addModel('mistral', 'Mistral', new THREE.Vector3(0, 0, 0));
      this.addModel('codellama', 'Code Llama', new THREE.Vector3(3, 0, 0));
    }
  }
  
  addModel(modelId, displayName, position) {
    const model = new AIModel3D(this.scene, modelId, displayName, position);
    this.aiModels.push(model);
    return model;
  }
  
  removeModel(model) {
    model.remove();
    this.aiModels = this.aiModels.filter(m => m !== model);
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
    
    this.aiModels.forEach(model => model.update());
    this.room.update();
    
    this.renderer.render(this.scene, this.camera);
  }
  
  getModels() {
    return this.aiModels;
  }
}

export { DebateRoom };
