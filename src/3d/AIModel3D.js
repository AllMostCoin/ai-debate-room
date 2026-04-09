import * as THREE from 'three';

class AIModel3D {
  constructor(scene, modelId, displayName, position) {
    this.scene = scene;
    this.modelId = modelId;
    this.displayName = displayName;
    this.position = position;
    this.group = new THREE.Group();
    this.isSelected = false;
    this.isThinking = false;
    this.speaking = false;
    this.animTime = 0;
    
    this.build();
  }
  
  build() {
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getModelColor(),
      roughness: 0.5,
      metalness: 0.3
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 1.4;
    this.body.castShadow = true;
    this.group.add(this.body);
    
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xeaeaea,
      roughness: 0.8
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 2.3;
    this.head.castShadow = true;
    this.group.add(this.head);
    
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.35, 0.28);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.35, 0.28);
    this.group.add(rightEye);
    
    this.indicator = new THREE.PointLight(0x4ade80, 0, 3);
    this.indicator.position.y = 3;
    this.group.add(this.indicator);
    
    const nameTagGeometry = new THREE.PlaneGeometry(1.5, 0.3);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.displayName, 128, 42);
    
    const nameTagTexture = new THREE.CanvasTexture(canvas);
    const nameTagMaterial = new THREE.MeshBasicMaterial({
      map: nameTagTexture,
      transparent: true
    });
    this.nameTag = new THREE.Mesh(nameTagGeometry, nameTagMaterial);
    this.nameTag.position.y = 2.8;
    this.nameTag.position.z = 0.5;
    this.group.add(this.nameTag);
    
    const ringGeometry = new THREE.TorusGeometry(0.6, 0.02, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xe94560 });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.1;
    this.ring.visible = false;
    this.group.add(this.ring);
    
    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }
  
  getModelColor() {
    const colors = {
      'llama3': 0xff6b6b,
      'mistral': 0x4ade80,
      'codellama': 0x60a5fa,
      'default': 0xe94560
    };
    return colors[this.modelId] || colors.default;
  }
  
  select() {
    this.isSelected = true;
    this.ring.visible = true;
    this.indicator.intensity = 1;
  }
  
  deselect() {
    this.isSelected = false;
    this.ring.visible = false;
    if (!this.isThinking && !this.speaking) {
      this.indicator.intensity = 0;
    }
  }
  
  setThinking(thinking) {
    this.isThinking = thinking;
    if (thinking) {
      this.indicator.color.setHex(0xffa500);
      this.indicator.intensity = 0.8;
    } else {
      this.indicator.color.setHex(0x4ade80);
      if (!this.isSelected) {
        this.indicator.intensity = 0;
      }
    }
  }
  
  setSpeaking(speaking) {
    this.speaking = speaking;
    if (speaking) {
      this.indicator.color.setHex(0x4ade80);
      this.indicator.intensity = 1.5;
    } else {
      if (!this.isSelected && !this.isThinking) {
        this.indicator.intensity = 0;
      }
    }
  }
  
  update() {
    this.animTime += 0.016;
    
    this.head.rotation.y = Math.sin(this.animTime * 0.5) * 0.1;
    
    if (this.isSelected && !this.isThinking) {
      this.ring.rotation.z = this.animTime;
    }
    
    if (this.isThinking) {
      this.body.scale.y = 1 + Math.sin(this.animTime * 5) * 0.02;
    } else {
      this.body.scale.y = 1;
    }
    
    if (this.speaking) {
      const mouthOpen = Math.abs(Math.sin(this.animTime * 10));
      this.head.scale.x = 1 + mouthOpen * 0.05;
    } else {
      this.head.scale.x = 1;
    }
  }
  
  getClickableObjects() {
    return [this.body, this.head];
  }
  
  remove() {
    this.scene.remove(this.group);
  }
}

export { AIModel3D };
