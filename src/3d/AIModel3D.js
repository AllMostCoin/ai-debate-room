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
    this.health = 100;
    this.maxHealth = 100;
    
    this.build();
  }
  
  build() {
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getModelColor(),
      roughness: 0.4,
      metalness: 0.6
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 1.6;
    this.body.castShadow = true;
    this.group.add(this.body);
    
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.6
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 2.8;
    this.head.castShadow = true;
    this.group.add(this.head);
    
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.85, 0.32);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.85, 0.32);
    this.group.add(rightEye);
    
    this.addArms();
    this.addHealthBar();
    this.addAura();
    this.addNameTag();
    this.addRing();
    
    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }
  
  addArms() {
    const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: this.getModelColor(),
      roughness: 0.4,
      metalness: 0.6
    });
    
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-0.7, 1.8, 0.3);
    this.leftArm.rotation.z = 0.5;
    this.leftArm.rotation.x = -0.3;
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(0.7, 1.8, 0.3);
    this.rightArm.rotation.z = -0.5;
    this.rightArm.rotation.x = -0.3;
    this.group.add(this.rightArm);
    
    const fistGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    const fistMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });
    
    const leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
    leftFist.position.set(-0.5, 2.2, 0.8);
    this.group.add(leftFist);
    
    const rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
    rightFist.position.set(0.5, 2.2, 0.8);
    this.group.add(rightFist);
  }
  
  addHealthBar() {
    const barWidth = 3;
    const barHeight = 0.4;
    
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 256;
    bgCanvas.height = 64;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.fillStyle = '#1a1a1a';
    bgCtx.fillRect(0, 0, 256, 64);
    bgCtx.strokeStyle = '#e94560';
    bgCtx.lineWidth = 4;
    bgCtx.strokeRect(2, 2, 252, 60);
    
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture, transparent: true });
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarBg.position.set(0, 4, 0.8);
    this.group.add(this.healthBarBg);
    
    const healthCanvas = document.createElement('canvas');
    healthCanvas.width = 240;
    healthCanvas.height = 52;
    this.healthCtx = healthCanvas.getContext('2d');
    this.healthTexture = new THREE.CanvasTexture(healthCanvas);
    const healthMaterial = new THREE.MeshBasicMaterial({
      map: this.healthTexture,
      transparent: true
    });
    const healthGeometry = new THREE.PlaneGeometry(barWidth * 0.9, barHeight * 0.8);
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.set(0, 4, 0.81);
    this.group.add(this.healthBar);
    
    this.updateHealthBar();
  }
  
  updateHealthBar() {
    this.healthCtx.fillStyle = '#e94560';
    this.healthCtx.fillRect(0, 0, 240, 52);
    
    this.healthCtx.fillStyle = '#00ffff';
    const healthWidth = (this.health / this.maxHealth) * 240;
    this.healthCtx.fillRect(0, 0, healthWidth, 52);
    
    this.healthCtx.fillStyle = '#ffffff';
    this.healthCtx.font = 'bold 36px Impact';
    this.healthCtx.textAlign = 'center';
    this.healthCtx.fillText(`${this.displayName}: ${this.health}%`, 120, 40);
    
    this.healthTexture.needsUpdate = true;
  }
  
  addAura() {
    const auraGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.getModelColor(),
      transparent: true,
      opacity: 0.5
    });
    this.aura = new THREE.Mesh(auraGeometry, auraMaterial);
    this.aura.rotation.x = Math.PI / 2;
    this.aura.position.y = 0.2;
    this.group.add(this.aura);
    
    this.indicator = new THREE.PointLight(this.getModelColor(), 1, 5);
    this.indicator.position.y = 2;
    this.group.add(this.indicator);
  }
  
  addNameTag() {
    const nameTagGeometry = new THREE.PlaneGeometry(2, 0.4);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = this.getModelColorHex();
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = this.getModelColorHex();
    ctx.font = 'bold 36px Impact';
    ctx.textAlign = 'center';
    ctx.fillText(this.displayName.toUpperCase(), 128, 44);
    
    const nameTagTexture = new THREE.CanvasTexture(canvas);
    const nameTagMaterial = new THREE.MeshBasicMaterial({
      map: nameTagTexture,
      transparent: true
    });
    this.nameTag = new THREE.Mesh(nameTagGeometry, nameTagMaterial);
    this.nameTag.position.y = 3.5;
    this.nameTag.position.z = 0.6;
    this.group.add(this.nameTag);
  }
  
  addRing() {
    const ringGeometry = new THREE.TorusGeometry(0.8, 0.05, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.1;
    this.ring.visible = false;
    this.group.add(this.ring);
  }
  
  getModelColor() {
    const colors = {
      'llama3': 0xff4444,
      'mistral': 0x44ff44,
      'codellama': 0x4444ff,
      'gemini': 0xffaa00,
      'default': 0xe94560
    };
    return colors[this.modelId] || colors.default;
  }
  
  getModelColorHex() {
    const colors = {
      'llama3': '#ff4444',
      'mistral': '#44ff44',
      'codellama': '#4444ff',
      'gemini': '#ffaa00',
      'default': '#e94560'
    };
    return colors[this.modelId] || colors.default;
  }
  
  select() {
    this.isSelected = true;
    this.ring.visible = true;
    this.indicator.intensity = 2;
    this.aura.material.opacity = 0.8;
  }
  
  deselect() {
    this.isSelected = false;
    this.ring.visible = false;
    this.indicator.intensity = 1;
    this.aura.material.opacity = 0.5;
  }
  
  setThinking(thinking) {
    this.isThinking = thinking;
    if (thinking) {
      this.indicator.color.setHex(0xffaa00);
      this.indicator.intensity = 1.5;
    } else {
      this.indicator.color.setHex(this.getModelColor());
      if (!this.isSelected) {
        this.indicator.intensity = 1;
      }
    }
  }
  
  setSpeaking(speaking) {
    this.speaking = speaking;
    if (speaking) {
      this.indicator.color.setHex(0x00ffff);
      this.indicator.intensity = 2;
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();
  }
  
  update() {
    this.animTime += 0.016;
    
    this.aura.rotation.z = this.animTime * 0.5;
    this.aura.scale.y = 1 + Math.sin(this.animTime * 2) * 0.2;
    
    if (this.isSelected) {
      this.group.position.y = this.position.y + Math.sin(this.animTime * 3) * 0.1;
      this.ring.rotation.z = this.animTime * 2;
    } else {
      this.group.position.y = this.position.y;
    }
    
    if (this.isThinking) {
      this.body.scale.y = 1 + Math.sin(this.animTime * 5) * 0.03;
      this.head.rotation.y = Math.sin(this.animTime * 0.5) * 0.2;
    } else {
      this.body.scale.y = 1;
      this.head.rotation.y = Math.sin(this.animTime * 0.5) * 0.05;
    }
    
    if (this.speaking) {
      this.leftArm.rotation.x = -0.3 + Math.sin(this.animTime * 8) * 0.2;
      this.rightArm.rotation.x = -0.3 + Math.cos(this.animTime * 8) * 0.2;
    }
    
    if (this.health <= 25) {
      this.aura.material.color.setHex(0xff0000);
      this.indicator.color.setHex(0xff0000);
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
