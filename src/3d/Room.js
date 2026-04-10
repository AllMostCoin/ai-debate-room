import * as THREE from 'three';

class Room {
  constructor(scene) {
    this.scene = scene;
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
    this.construct();
  }
  
  construct() {
    this.addArena();
    this.addPillars();
    this.addFireTorches();
    this.addMKText();
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
    
    const edgeGeometry = new THREE.BoxGeometry(30, 0.3, 1);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe94560,
      emissive: 0xe94560,
      emissiveIntensity: 0.8
    });
    
    const frontEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    frontEdge.position.set(0, 0.15, 14);
    this.scene.add(frontEdge);
    
    const backEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    backEdge.position.set(0, 0.15, -14);
    this.scene.add(backEdge);
    
    const sideEdge = new THREE.BoxGeometry(1, 0.3, 30);
    const leftEdge = new THREE.Mesh(sideEdge, edgeMaterial);
    leftEdge.position.set(-14, 0.15, 0);
    this.scene.add(leftEdge);
    
    const rightEdge = new THREE.Mesh(sideEdge, edgeMaterial);
    rightEdge.position.set(14, 0.15, 0);
    this.scene.add(rightEdge);
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const tileGeometry = new THREE.BoxGeometry(2.8, 0.1, 2.8);
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: (i + j) % 2 === 0 ? 0x2a0a0a : 0x0a2a2a,
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
    const pillarGeometry = new THREE.BoxGeometry(1.5, 12, 1.5);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a0a,
      roughness: 0.8
    });
    
    const positions = [
      { x: -14, z: -14 }, { x: 14, z: -14 },
      { x: -14, z: 14 }, { x: 14, z: 14 }
    ];
    
    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 6, pos.z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      
      const torchLight = new THREE.PointLight(0xe94560, 2, 15);
      torchLight.position.set(pos.x, 8, pos.z);
      this.scene.add(torchLight);
      
      const torchGlow = new THREE.PointLight(0x00ffff, 0.5, 10);
      torchGlow.position.set(pos.x * 0.9, 3, pos.z);
      this.scene.add(torchGlow);
    });
  }
  
  addFireTorches() {
    const torchGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const torchMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    
    const flameGeometry = new THREE.ConeGeometry(0.4, 1.5, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xe94560,
      transparent: true,
      opacity: 0.9
    });
    
    const positions = [
      { x: -12, y: 5, z: 0 }, { x: 12, y: 5, z: 0 },
      { x: 0, y: 5, z: -12 }, { x: 0, y: 5, z: 12 }
    ];
    
    this.torches = [];
    
    positions.forEach(pos => {
      const torch = new THREE.Mesh(torchGeometry, torchMaterial);
      torch.position.set(pos.x, pos.y, pos.z);
      this.scene.add(torch);
      
      const flame = new THREE.Mesh(flameGeometry, flameMaterial.clone());
      flame.position.set(pos.x, pos.y + 1.5, pos.z);
      this.scene.add(flame);
      
      this.torches.push({ flame, baseY: pos.y + 1.5 });
      
      const fireLight = new THREE.PointLight(0xe94560, 1.5, 8);
      fireLight.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(fireLight);
    });
  }
  
  addMKText() {
    const textGeometry = new THREE.PlaneGeometry(8, 2);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1024, 256);
    
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 8;
    ctx.font = 'bold 120px Impact';
    ctx.textAlign = 'center';
    ctx.strokeText('FIGHT!', 512, 150);
    
    ctx.fillStyle = '#00ffff';
    ctx.fillText('FIGHT!', 512, 150);
    
    const textTexture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true
    });
    this.mkText = new THREE.Mesh(textGeometry, textMaterial);
    this.mkText.position.set(0, 8, -13);
    this.scene.add(this.mkText);
    
    this.mkText.visible = false;
  }
  
  showFightText() {
    this.mkText.visible = true;
    setTimeout(() => {
      this.mkText.visible = false;
    }, 2000);
  }
  
  update() {
    const time = Date.now() * 0.001;
    
    this.torches.forEach((torch, i) => {
      torch.flame.scale.y = 1 + Math.sin(time * 5 + i) * 0.2;
      torch.flame.scale.x = 1 + Math.cos(time * 3 + i) * 0.1;
      torch.flame.rotation.y = time + i;
      torch.flame.position.y = torch.baseY + Math.sin(time * 8 + i) * 0.1;
    });
    
    if (this.mkText.visible) {
      this.mkText.position.y = 8 + Math.sin(time * 3) * 0.3;
    }
  }
}

export { Room };
