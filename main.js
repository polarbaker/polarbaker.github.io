import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Performance monitoring
const stats = new Stats();
document.body.appendChild(stats.dom);

// Scene setup with fog for depth
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 50, 200);

// Renderer with optimized settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    canvas: document.querySelector('#three-canvas'),
    powerPreference: "high-performance",
    precision: "mediump"
});

// Basic setup
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.background = new THREE.Color(0x000000);

// Camera with optimized FOV and draw distance
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 200);
camera.position.set(0, 2, 15);

// Optimized lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 3, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Texture loading optimization
const loadingManager = new THREE.LoadingManager();

// Setup loading manager handlers
loadingManager.onProgress = (url, loaded, total) => {
    const progress = (loaded / total) * 100;
    console.log(`Loading: ${progress}%`);
};

loadingManager.onLoad = () => {
    console.log('Loading complete!');
    console.log('Textures:', textures);
    animate();
};

loadingManager.onError = (url) => {
    console.error('Error loading texture:', url);
};

const textureLoader = new THREE.TextureLoader(loadingManager);

// Add this near your texture loading code
function loadTexture(url, onError) {
    return textureLoader.load(
        url,
        optimizeTexture,
        undefined, // onProgress callback
        () => {
            console.error(`Failed to load texture: ${url}`);
            onError?.();
        }
    );
}

// Add this after your texture loading code
function createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, 2, 2);
    return new THREE.CanvasTexture(canvas);
}

// Update your textures loading to use this function
const textures = {
    day: loadTexture('/textures/earth_daymap.jpg', () => {
        console.warn('Failed to load day texture, using fallback');
        return createFallbackTexture();
    }),
    night: loadTexture('/textures/earth_nightmap.jpg', () => {
        console.warn('Failed to load night texture, using fallback');
        return createFallbackTexture();
    }),
    bump: loadTexture('/textures/earth_bump.jpg', () => {
        console.warn('Failed to load bump texture, using fallback');
        return createFallbackTexture();
    }),
    specular: loadTexture('/textures/earth_specular.jpg', () => {
        console.warn('Failed to load specular texture, using fallback');
        return createFallbackTexture();
    })
};

function optimizeTexture(texture) {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// Create Earth with optimized geometry
const earthGeometry = new THREE.SphereGeometry(5, 48, 48); // Reduced segments
const earthMaterial = new THREE.MeshPhongMaterial({
    map: textures.day,
    bumpMap: textures.bump,
    bumpScale: 0.15,
    specularMap: textures.specular,
    specular: new THREE.Color('grey'),
    shininess: 25
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
scene.add(earth);

// Optimized atmosphere
const atmosphereGeometry = new THREE.SphereGeometry(5.2, 48, 48);
const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    depthWrite: false // Optimization for transparent objects
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// Optimized stars using InstancedMesh
const starCount = 5000; // Reduced number of stars
const starGeometry = new THREE.SphereGeometry(0.1, 4, 4); // Simplified geometry
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
const starInstance = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);

const dummy = new THREE.Object3D();
for(let i = 0; i < starCount; i++) {
    dummy.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
    );
    dummy.updateMatrix();
    starInstance.setMatrixAt(i, dummy.matrix);
}
starInstance.instanceMatrix.needsUpdate = true;
scene.add(starInstance);

// Optimized controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 7;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 1.5;
controls.update();

// Efficient animation loop with delta time
const clock = new THREE.Clock();
let previousTime = 0;

function animate() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // Update earth rotation based on delta time
    earth.rotation.y += 0.2 * deltaTime;
    
    // Update controls
    controls.update();

    // Render scene
    renderer.render(scene, camera);

    // Update stats
    stats.update();

    requestAnimationFrame(animate);
}

// Start animation
animate();

// Efficient resize handler
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize, false);

// Memory management
window.addEventListener('beforeunload', () => {
    // Dispose of geometries
    earthGeometry.dispose();
    atmosphereGeometry.dispose();
    starGeometry.dispose();

    // Dispose of materials
    earthMaterial.dispose();
    atmosphereMaterial.dispose();
    starMaterial.dispose();

    // Dispose of textures
    Object.values(textures).forEach(texture => texture.dispose());

    // Clear scene
    scene.clear();
    
    // Dispose of renderer
    renderer.dispose();
});

// Debug logging
console.log('Scene children:', scene.children);
console.log('Camera position:', camera.position);