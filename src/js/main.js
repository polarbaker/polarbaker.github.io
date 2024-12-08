import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class EarthScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('#earth-canvas'),
      antialias: true,
      alpha: true
    });

    this.controls = null;
    this.earth = null;
    this.stars = null;
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.setPath('./textures/');

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Setup camera
    this.camera.position.z = 5;

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.enableZoom = false;

    // Create Earth
    this.createEarth();
    
    // Create stars
    this.createStars();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  createEarth() {
    // Earth geometry
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Load Earth textures
    const dayMap = this.textureLoader.load('earth_daymap.jpg');
    const normalMap = this.textureLoader.load('earth_normal.jpg');
    const specularMap = this.textureLoader.load('earth_specular.jpg');

    // Earth material with textures
    const material = new THREE.MeshPhongMaterial({
      map: dayMap,
      normalMap: normalMap,
      specularMap: specularMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      shininess: 25
    });

    this.earth = new THREE.Mesh(geometry, material);
    
    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    
    // Create a group for Earth and atmosphere
    this.earthGroup = new THREE.Group();
    this.earthGroup.add(this.earth);
    this.earthGroup.add(atmosphere);
    
    // Tilt Earth's axis (23.5 degrees)
    this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
    
    this.scene.add(this.earthGroup);
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = -Math.random() * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Rotate Earth
    if (this.earthGroup) {
      this.earthGroup.rotation.y += 0.001;
    }

    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EarthScene();
});