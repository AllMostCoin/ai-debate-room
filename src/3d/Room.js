import * as THREE from 'three';

class Room {
  constructor(scene) {
    this.scene = scene;
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);
    this.torches = [];
    this.roundText = null;
    this.roundTimer = 0;
    this.showRoundText = false;
    this.construct();
  }
  
  construct() {
    this.addArena();
    this.addPillars();
    this.addFireTorches();
    this.addMKDecorations();
    this.addRoundText();
  }
  
  addArena() {
    const floorGeometry = new THREE.PlaneGeometry(30, 30, 30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe94560,
      emissive: 0xe94560,
      emissiveIntensity: 1
    });
    
    const edgePositions = [
      { pos: [0, 0.15, 14], scale: [30, 0.3, 1] },
      { pos: [0, 0.15, -14], scale: [30, 0.3, 1] },
      { pos: [-14, 0.15, 0], scale: [1, 0.3, 30] },
      { pos: [14, 0.15, 0], scale: [1, 0.3, 30] }
    ];
    
    edgePositions.forEach(({ pos, scale }) => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(...scale),
        edgeMaterial
      );
      edge.position.set(...pos);
      this.scene.add(edge);
    });
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const tileGeometry = new THREE.BoxGeometry(2.8, 0.1, 2.8);
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: (i + j) % 2 === 0 ? 0x2a0a0a : 0x0a1a2a,
          roughness: 0.7
        });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(-12 + i * 6, 0.05, -12 + j * 6);
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }
  }
  
  addPillars() {
    const pillarGeometry = new THREE.BoxGeometry(1.5, 14, 1.5);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      roughness: 0.8
    });
    
    const flameGeometry = new THREE.ConeGeometry(0.6, 2, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xe94560,
      transparent: true,
      opacity: 0.9
    });
    
    const positions = [
      { x: -14, z: -14 }, { x: 14, z: -14 },
      { x: -14, z: 14 }, { x: 14, z: 14 }
    ];
    
    positions.forEach((pos, i) => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 7, pos.z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      
      const flame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
      flame.position.set(pos.x, 14.5, pos.z);
      this.scene.add(flame);
      
      this.torches.push({ flame, baseY: 14.5, offset: i });
      
      const fireLight = new THREE.PointLight(0xe94560, 2, 12);
      fireLight.position.set(pos.x, 12, pos.z);
      this.scene.add(fireLight);
    });
  }
  
  addFireTorches() {
    const torchGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const torchMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    
    const flameGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xe94560,
      transparent: true,
      opacity: 0.9
    });
    
    const positions = [
      { x: -10, y: 6, z: 0 }, { x: 10, y: 6, z: 0 },
      { x: 0, y: 6, z: -10 }, { x: 0, y: 6, z: 10 }
    ];
    
    positions.forEach((pos, i) => {
      const torch = new THREE.Mesh(torchGeometry, torchMaterial);
      torch.position.set(pos.x, pos.y, pos.z);
      this.scene.add(torch);
      
      const flame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
      flame.position.set(pos.x, pos.y + 2, pos.z);
      this.scene.add(flame);
      
      this.torches.push({ flame, baseY: pos.y + 2, offset: i + 4 });
      
      const fireLight = new THREE.PointLight(0xe94560, 1.5, 8);
      fireLight.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(fireLight);
    });
  }
  
  addMKDecorations() {
    const skullGeometry = new THREE.IcosahedronGeometry(0.5, 0);
    const skullMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6
    });
    
    const skullPositions = [
      { x: -12, y: 10, z: -8 },
      { x: 12, y: 10, z: -8 },
      { x: 0, y: 10, z: -12 }
    ];
    
    skullPositions.forEach(pos => {
      const skull = new THREE.Mesh(skullGeometry, skullMaterial);
      skull.position.set(pos.x, pos.y, pos.z);
      skull.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(skull);
    });
    
    const chainGeometry = new THREE.TorusGeometry(8, 0.1, 8, 32);
    const chainMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.3
    });
    const chain = new THREE.Mesh(chainGeometry, chainMaterial);
    chain.position.y = 12;
    chain.rotation.x = Math.PI / 2;
    this.scene.add(chain);
  }
  
  addRoundText() {
    const createText = (text, size, color) => {
      const textGeometry = new THREE.PlaneGeometry(size, size * 0.4);
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1024, 512);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 12;
      ctx.font = 'bold 120px Impact';
      ctx.textAlign = 'center';
      ctx.strokeText(text, 512, 280);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 512, 280);
      
      const textTexture = new THREE.CanvasTexture(canvas);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      return new THREE.Mesh(textGeometry, textMaterial);
    };
    
    this.roundText = createText('ROUND 1', 10, '#e94560');
    this.roundText.position.set(0, 10, -5);
    this.roundText.visible = false;
    this.scene.add(this.roundText);
    
    this.fightText = createText('FIGHT!', 8, '#00ffff');
    this.fightText.position.set(0, 8, -5);
    this.fightText.visible = false;
    this.scene.add(this.fightText);
    
    this.koText = createText('K.O.!', 12, '#ff0000');
    this.koText.position.set(0, 8, -5);
    this.koText.visible = false;
    this.scene.add(this.koText);
    
    this.winnerText = createText('WINNER!', 10, '#ffd700');
    this.winnerText.position.set(0, 6, -5);
    this.winnerText.visible = false;
    this.scene.add(this.winnerText);
    
    this.flashOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 30),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      })
    );
    this.flashOverlay.position.set(0, 10, 5);
    this.scene.add(this.flashOverlay);
  }
  
  showRound(round) {
    this.roundText.children[0].material.map.dispose();
    this.roundText.children[0].material = new THREE.MeshBasicMaterial({
      map: this.createTextTexture(`ROUND ${round}`),
      transparent: true
    });
    this.roundText.visible = true;
    this.roundText.scale.set(0, 0, 1);
    this.showRoundText = true;
    this.roundTimer = 0;
    this.flashOverlay.material.opacity = 0.8;
  }
  
  showFight() {
    this.fightText.visible = true;
    this.fightText.scale.set(0, 0, 1);
    this.flashOverlay.material.opacity = 0.5;
  }
  
  showKO() {
    this.koText.visible = true;
    this.koText.scale.set(0, 0, 1);
    this.flashOverlay.material.opacity = 1;
  }
  
  showWinner(name) {
    this.winnerText.visible = true;
    this.winnerText.scale.set(0, 0, 1);
    this.flashOverlay.material.opacity = 0.5;
    
    this.winnerTimer = 0;
    this.winnerName = name;
  }
  
  hideAll() {
    this.roundText.visible = false;
    this.fightText.visible = false;
    this.koText.visible = false;
    this.flashOverlay.material.opacity = 0;
  }
  
  createTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 12;
    ctx.font = 'bold 120px Impact';
    ctx.textAlign = 'center';
    ctx.strokeText(text, 512, 280);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 512, 280);
    return new THREE.CanvasTexture(canvas);
  }
  
  update() {
    const time = Date.now() * 0.001;
    
    this.torches.forEach((torch, i) => {
      torch.flame.scale.y = 1 + Math.sin(time * 5 + i) * 0.3;
      torch.flame.scale.x = 1 + Math.cos(time * 3 + i) * 0.15;
      torch.flame.rotation.y = time + i;
      torch.flame.position.y = torch.baseY + Math.sin(time * 8 + i) * 0.15;
      
      const flicker = 0.8 + Math.sin(time * 10 + i * 2) * 0.2;
      torch.flame.material.opacity = flicker;
    });
    
    if (this.showRoundText) {
      this.roundTimer += 0.016;
      
      if (this.roundTimer < 0.3) {
        const scale = this.roundTimer / 0.3;
        this.roundText.scale.set(scale * 2, scale * 2, 1);
      } else if (this.roundTimer < 1.5) {
        this.roundText.scale.set(2, 2, 1);
        this.roundText.rotation.y = Math.sin(time * 2) * 0.1;
      } else if (this.roundTimer < 2) {
        this.roundText.scale.set(2, 2, 1);
      } else if (this.roundTimer < 2.5) {
        const scale = 2 - (this.roundTimer - 2) / 0.5;
        this.roundText.scale.set(scale, scale, 1);
      } else {
        this.roundText.visible = false;
        this.showRoundText = false;
        this.showFight();
      }
    }
    
    if (this.fightText.visible) {
      this.fightTimer = (this.fightTimer || 0) + 0.016;
      
      if (this.fightTimer < 0.3) {
        const scale = this.fightTimer / 0.3;
        this.fightText.scale.set(scale * 3, scale * 3, 1);
      } else if (this.fightTimer < 2) {
        this.fightText.scale.set(3, 3, 1);
        this.fightText.position.y = 8 + Math.sin(time * 5) * 0.5;
      } else {
        this.fightText.visible = false;
        this.fightTimer = 0;
      }
    }
    
    if (this.koText.visible) {
      this.koTimer = (this.koTimer || 0) + 0.016;
      
      if (this.koTimer < 0.2) {
        const scale = this.koTimer / 0.2;
        this.koText.scale.set(scale * 4, scale * 4, 1);
      } else if (this.koTimer < 3) {
        this.koText.scale.set(4, 4, 1);
        this.koText.rotation.z = Math.sin(time * 10) * 0.2;
        this.koText.position.y = 8 + Math.sin(time * 3) * 1;
      } else {
        this.koText.visible = false;
        this.koTimer = 0;
      }
    }
    
    if (this.winnerText.visible) {
      this.winnerTimer += 0.016;
      
      if (this.winnerTimer < 0.3) {
        const scale = this.winnerTimer / 0.3;
        this.winnerText.scale.set(scale * 3, scale * 3, 1);
      } else if (this.winnerTimer < 5) {
        this.winnerText.scale.set(3, 3, 1);
        this.winnerText.rotation.y = Math.sin(time * 2) * 0.3;
        this.winnerText.position.y = 6 + Math.sin(time * 4) * 0.5;
      } else {
        this.winnerText.visible = false;
        this.winnerTimer = 0;
      }
    }
    
    if (this.flashOverlay.material.opacity > 0) {
      this.flashOverlay.material.opacity -= 0.02;
    }
    
    this.roundText.rotation.y = Math.sin(time * 0.5) * 0.2;
  }
}

export { Room };
