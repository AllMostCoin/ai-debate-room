import * as THREE from 'three';

class AIModel3D {
  constructor(scene, modelId, displayName, position, character = null) {
    this.scene = scene;
    this.modelId = modelId;
    this.displayName = displayName;
    this.position = position.clone();
    this.character = character;
    this.group = new THREE.Group();
    this.isSelected = false;
    this.isThinking = false;
    this.speaking = false;
    this.animTime = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.score = 0;
    this.isLive = false;
    
    this.fightState = 'idle';
    this.fightAnimTime = 0;
    this.introComplete = false;
    this.startX = position.x;
    
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
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
      color: this.isLive ? 0x00ff00 : 0xffaa00 
    });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.12, 2.85, 0.32);
    this.group.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.12, 2.85, 0.32);
    this.group.add(this.rightEye);
    
    this.addArms();
    this.addHealthBar();
    this.addAura();
    this.addNameTag();
    this.addRing();
    this.addDamageFlash();
    this.addCrown();
    
    this.group.position.copy(this.position);
    this.group.position.x += this.startX < 0 ? -20 : 20;
    this.group.position.y = 0;
    this.scene.add(this.group);
  }
  
  addArms() {
    const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: this.getModelColor(),
      roughness: 0.4,
      metalness: 0.6
    });
    
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial.clone());
    this.leftArm.position.set(-0.7, 1.8, 0.3);
    this.leftArm.rotation.z = 0.5;
    this.leftArm.rotation.x = -0.3;
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial.clone());
    this.rightArm.position.set(0.7, 1.8, 0.3);
    this.rightArm.rotation.z = -0.5;
    this.rightArm.rotation.x = -0.3;
    this.group.add(this.rightArm);
    
    const fistGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    const fistMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });
    
    this.leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
    this.leftFist.position.set(-0.5, 2.2, 0.8);
    this.group.add(this.leftFist);
    
    this.rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
    this.rightFist.position.set(0.5, 2.2, 0.8);
    this.group.add(this.rightFist);
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
    this.healthBarBg.visible = false;
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
    this.healthBar.visible = false;
    this.group.add(this.healthBar);
    
    this.updateHealthBar();
  }
  
  updateHealthBar() {
    this.healthCtx.fillStyle = '#1a1a1a';
    this.healthCtx.fillRect(0, 0, 240, 52);
    
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    this.healthCtx.fillStyle = healthColor;
    const healthWidth = healthPercent * 240;
    this.healthCtx.fillRect(0, 0, healthWidth, 52);
    
    const label = this.character ? `${this.character.emoji} ${this.displayName.toUpperCase()}` : this.displayName.toUpperCase();
    const status = this.isLive ? ' ● LIVE' : ' ○ DEMO';
    const scoreText = ` ${this.score} PTS`;
    
    this.healthCtx.fillStyle = '#ffffff';
    this.healthCtx.font = 'bold 28px Impact';
    this.healthCtx.textAlign = 'left';
    this.healthCtx.fillText(label, 10, 30);
    
    this.healthCtx.fillStyle = this.isLive ? '#00ff00' : '#ffaa00';
    this.healthCtx.font = 'bold 20px Impact';
    this.healthCtx.textAlign = 'right';
    this.healthCtx.fillText(status + scoreText, 230, 30);
    
    this.healthTexture.needsUpdate = true;
  }
  
  addAura() {
    this.aura = new THREE.Group();
    
    for (let i = 0; i < 3; i++) {
      const auraGeometry = new THREE.TorusGeometry(1.2 + i * 0.3, 0.05, 8, 32);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: this.getModelColor(),
        transparent: true,
        opacity: 0.5 - i * 0.15
      });
      const ring = new THREE.Mesh(auraGeometry, auraMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.2 + i * 0.5;
      this.aura.add(ring);
    }
    
    this.group.add(this.aura);
    
    this.indicator = new THREE.PointLight(this.getModelColor(), 1, 5);
    this.indicator.position.y = 2;
    this.group.add(this.indicator);
  }
  
  addNameTag() {
    const nameTagGeometry = new THREE.PlaneGeometry(2.5, 0.5);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = this.getModelColorHex();
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 120);
    
    const label = this.character ? `${this.character.emoji} ${this.displayName}` : this.displayName;
    ctx.fillStyle = this.getModelColorHex();
    ctx.font = 'bold 56px Impact';
    ctx.textAlign = 'center';
    ctx.fillText(label, 256, 80);
    
    const nameTagTexture = new THREE.CanvasTexture(canvas);
    const nameTagMaterial = new THREE.MeshBasicMaterial({
      map: nameTagTexture,
      transparent: true
    });
    this.nameTag = new THREE.Mesh(nameTagGeometry, nameTagMaterial);
    this.nameTag.position.y = 4.2;
    this.nameTag.position.z = 0.6;
    this.group.add(this.nameTag);
  }
  
  addRing() {
    const ringGeometry = new THREE.TorusGeometry(1, 0.08, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.1;
    this.ring.visible = false;
    this.group.add(this.ring);
  }
  
  addDamageFlash() {
    this.damageFlash = new THREE.PointLight(0xff0000, 0, 8);
    this.damageFlash.position.y = 2;
    this.group.add(this.damageFlash);
  }
  
  addCrown() {
    const crownGeometry = new THREE.ConeGeometry(0.3, 0.5, 4);
    const crownMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0
    });
    this.crown = new THREE.Mesh(crownGeometry, crownMaterial);
    this.crown.position.y = 3.5;
    this.crown.rotation.x = Math.PI;
    this.group.add(this.crown);
    
    const crownLight = new THREE.PointLight(0xffd700, 0, 3);
    crownLight.position.y = 3.5;
    this.crownLight = crownLight;
    this.group.add(crownLight);
  }
  
  getModelColor() {
    const colors = {
      'gpt-4': 0xffd700,
      'claude': 0xff6b6b,
      'gemini': 0x4ade80,
      'mistral': 0x60a5fa,
      'llama3': 0xf472b6,
      'codellama': 0x22d3ee,
      'copilot': 0xa78bfa,
      'grok': 0xf97316,
      'ollama': 0x84cc16,
      'default': 0xe94560
    };
    return colors[this.modelId] || colors.default;
  }
  
  getModelColorHex() {
    const colors = {
      'gpt-4': '#ffd700',
      'claude': '#ff6b6b',
      'gemini': '#4ade80',
      'mistral': '#60a5fa',
      'llama3': '#f472b6',
      'codellama': '#22d3ee',
      'copilot': '#a78bfa',
      'grok': '#f97316',
      'ollama': '#84cc16',
      'default': '#e94560'
    };
    return colors[this.modelId] || colors.default;
  }
  
  setLive(live) {
    this.isLive = live;
    this.leftEye.material.color.setHex(live ? 0x00ff00 : 0xffaa00);
    this.rightEye.material.color.setHex(live ? 0x00ff00 : 0xffaa00);
    this.updateHealthBar();
  }
  
  addScore(points) {
    this.score += points;
    this.updateHealthBar();
  }
  
  setScore(points) {
    this.score = points;
    this.updateHealthBar();
  }
  
  crown() {
    this.crown.material.opacity = 1;
    this.crownLight.intensity = 2;
    this.crown.visible = true;
    
    this.crown.scale.set(0, 0, 0);
    let scaleTime = 0;
    const animateCrown = () => {
      scaleTime += 0.05;
      const scale = Math.min(scaleTime * 3, 1);
      this.crown.scale.set(scale, scale, scale);
      this.crown.rotation.y += 0.1;
      if (scale < 1) requestAnimationFrame(animateCrown);
    };
    animateCrown();
  }
  
  uncrown() {
    this.crown.material.opacity = 0;
    this.crownLight.intensity = 0;
  }
  
  startIntro() {
    this.fightState = 'intro';
    this.fightAnimTime = 0;
  }
  
  select() {
    this.isSelected = true;
    this.ring.visible = true;
    this.indicator.intensity = 2;
    this.aura.children.forEach(c => c.material.opacity = 0.8);
  }
  
  deselect() {
    this.isSelected = false;
    this.ring.visible = false;
    this.indicator.intensity = 1;
    this.aura.children.forEach(c => c.material.opacity = 0.5);
  }
  
  setThinking(thinking) {
    this.isThinking = thinking;
    if (thinking) {
      this.indicator.color.setHex(0xffaa00);
      this.indicator.intensity = 1.5;
    } else {
      this.indicator.color.setHex(this.getModelColor());
      if (!this.isSelected) this.indicator.intensity = 1;
    }
  }
  
  setSpeaking(speaking) {
    this.speaking = speaking;
    if (speaking) {
      this.fightState = 'attack';
      this.fightAnimTime = 0;
      this.indicator.color.setHex(0x00ffff);
      this.indicator.intensity = 2;
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    this.fightState = 'hit';
    this.fightAnimTime = 0;
    this.damageFlash.intensity = 3;
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();
  }
  
  ko() {
    this.fightState = 'ko';
    this.fightAnimTime = 0;
  }
  
  update() {
    this.animTime += 0.016;
    this.fightAnimTime += 0.016;
    
    this.updateFightAnimation();
    this.updateAura();
    
    if (this.health <= 25 && this.fightState !== 'ko') {
      this.aura.children.forEach(c => c.material.color.setHex(0xff0000));
      this.indicator.color.setHex(0xff0000);
    }
    
    if (this.damageFlash.intensity > 0) {
      this.damageFlash.intensity -= 0.1;
    }
    
    if (this.crown.visible) {
      this.crown.position.y = 3.5 + Math.sin(this.animTime * 3) * 0.1;
    }
  }
  
  updateFightAnimation() {
    const speed = 3;
    const t = this.fightAnimTime * speed;
    
    switch (this.fightState) {
      case 'intro':
        const targetX = this.position.x;
        const dir = targetX > this.startX ? -1 : 1;
        const progress = Math.min(t / 1.5, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        this.group.position.x = this.startX + dir * (1 - easeOut) * 20;
        this.group.position.y = Math.sin(progress * Math.PI) * 3;
        this.group.rotation.z = dir * Math.sin(progress * Math.PI) * 0.5;
        
        if (progress >= 1) {
          this.group.position.x = targetX;
          this.group.position.y = 0;
          this.group.rotation.z = 0;
          this.fightState = 'idle';
          this.introComplete = true;
          this.healthBarBg.visible = true;
          this.healthBar.visible = true;
        }
        break;
        
      case 'idle':
        this.group.position.y = Math.sin(this.animTime * 2) * 0.05;
        this.group.rotation.z = Math.sin(this.animTime) * 0.02;
        
        if (this.speaking) {
          this.fightState = 'attack';
          this.fightAnimTime = 0;
        }
        break;
        
      case 'attack':
        const punchProgress = Math.sin(t * 4);
        this.rightArm.rotation.x = -0.3 + punchProgress * 1.5;
        this.rightFist.position.z = 0.8 + punchProgress * 1.5;
        this.rightFist.position.y = 2.2 + Math.abs(punchProgress) * 0.5;
        
        this.group.position.z = Math.sin(t * 4) * 0.3;
        this.group.rotation.y = Math.sin(t * 2) * 0.1;
        
        if (t > Math.PI / 2) {
          this.fightState = 'idle';
          this.rightArm.rotation.x = -0.3;
          this.rightFist.position.set(0.5, 2.2, 0.8);
          this.group.position.z = 0;
        }
        break;
        
      case 'hit':
        const hitProgress = Math.min(t / 0.3, 1);
        this.group.position.x = this.position.x + Math.sin(t * 20) * 0.3 * (1 - hitProgress);
        this.group.rotation.z = Math.sin(t * 25) * 0.2 * (1 - hitProgress);
        this.body.scale.x = 1 + Math.sin(t * 30) * 0.1 * (1 - hitProgress);
        
        if (hitProgress >= 1) {
          this.group.position.x = this.position.x;
          this.group.rotation.z = 0;
          this.body.scale.x = 1;
          this.fightState = this.health <= 0 ? 'ko' : 'idle';
        }
        break;
        
      case 'ko':
        const koProgress = Math.min(t / 0.5, 1);
        this.group.position.y = Math.max(-1, -koProgress * 2);
        this.group.rotation.x = koProgress * 1.5;
        this.group.rotation.z = Math.sin(t * 5) * 0.1;
        this.group.scale.y = 1 - koProgress * 0.3;
        
        if (this.group.position.y <= -1 && koProgress >= 1) {
          this.fightState = 'fallen';
        }
        break;
        
      case 'fallen':
        this.group.position.y = -1;
        this.group.rotation.x = 1.5;
        this.group.rotation.z = Math.sin(this.animTime * 2) * 0.05;
        this.group.scale.y = 0.7;
        break;
    }
  }
  
  updateAura() {
    if (!this.introComplete && this.fightState !== 'intro') return;
    
    this.aura.children.forEach((ring, i) => {
      ring.rotation.z = this.animTime * (0.5 + i * 0.2) * (this.startX < 0 ? 1 : -1);
      ring.scale.y = 1 + Math.sin(this.animTime * 2 + i) * 0.2;
      ring.position.y = 0.2 + i * 0.5 + Math.sin(this.animTime * 3 + i * 0.5) * 0.1;
    });
  }
  
  getClickableObjects() {
    return [this.body, this.head];
  }
  
  remove() {
    this.scene.remove(this.group);
  }
}

export { AIModel3D };
