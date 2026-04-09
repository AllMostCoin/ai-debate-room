import * as THREE from 'three';

class Room {
  constructor(scene) {
    this.scene = scene;
    this.construct();
  }
  
  construct() {
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4e,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 8),
      wallMaterial
    );
    backWall.position.set(0, 4, -10);
    this.scene.add(backWall);
    
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 8),
      wallMaterial
    );
    leftWall.position.set(-10, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 8),
      wallMaterial
    );
    rightWall.position.set(10, 4, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);
    
    this.addDecorations();
    this.addPodium();
  }
  
  addDecorations() {
    const screenGeometry = new THREE.BoxGeometry(6, 4, 0.1);
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f3460,
      emissive: 0x0f3460,
      emissiveIntensity: 0.3
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 3, -9.9);
    this.scene.add(screen);
    
    const podiumGeometry = new THREE.CylinderGeometry(1, 1.2, 1, 8);
    const podiumMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.3,
      metalness: 0.7
    });
    
    const positions = [
      { x: -6, z: -5 },
      { x: 0, z: -6 },
      { x: 6, z: -5 }
    ];
    
    positions.forEach(pos => {
      const podium = new THREE.Mesh(podiumGeometry, podiumMaterial);
      podium.position.set(pos.x, 0.5, pos.z);
      podium.castShadow = true;
      this.scene.add(podium);
      
      const light = new THREE.PointLight(0xe94560, 0.5, 5);
      light.position.set(pos.x, 2, pos.z);
      this.scene.add(light);
    });
    
    for (let i = 0; i < 20; i++) {
      const starGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 7 + 3,
        (Math.random() - 0.5) * 20 - 5
      );
      this.scene.add(star);
    }
  }
  
  addPodium() {
    const centerPodiumGeometry = new THREE.BoxGeometry(4, 0.5, 2);
    const centerPodiumMaterial = new THREE.MeshStandardMaterial({
      color: 0xe94560,
      roughness: 0.3,
      metalness: 0.5
    });
    const centerPodium = new THREE.Mesh(centerPodiumGeometry, centerPodiumMaterial);
    centerPodium.position.set(0, 0.25, -3);
    centerPodium.castShadow = true;
    this.scene.add(centerPodium);
  }
  
  update() {}
}

export { Room };
