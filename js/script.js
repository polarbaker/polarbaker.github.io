// Import necessary Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Initialize core variables
let scene, camera, renderer, earth, stars, composer, controls;
let particles = [];

// Configuration object
const config = {
    earthRadius: 1,
    rotationSpeed: 0.001,
    particleCount: 1000,
    bloomStrength: 1.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.85
};

// Initialize the 3D scene
function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup with dynamic positioning
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 4);

    // Renderer setup with advanced features
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('three-canvas'),
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Add OrbitControls with constraints
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 2;
    controls.enablePan = false;
}

// Create post-processing effects
function initPostProcessing() {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        config.bloomStrength,
        config.bloomRadius,
        config.bloomThreshold
    );
    composer.addPass(bloomPass);
}

// Create the Earth with atmosphere
async function createEarth() {
    const textureLoader = new THREE.TextureLoader();
    
    // Load all textures concurrently
    const [earthTexture, normalMap, specularMap, cloudsTexture] = await Promise.all([
        textureLoader.loadAsync('images/earth_texture.jpg'),
        textureLoader.loadAsync('images/earth_normal.jpg'),
        textureLoader.loadAsync('images/earth_specular.jpg'),
        textureLoader.loadAsync('images/earth_clouds.png')
    ]);

    // Earth geometry with high detail
    const geometry = new THREE.SphereGeometry(config.earthRadius, 64, 64);
    
    // Earth material with advanced features
    const material = new THREE.MeshPhysicalMaterial({
        map: earthTexture,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: specularMap,
        metalness: 0.1,
        roughness: 0.8,
        envMapIntensity: 0.5,
    });

    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Add cloud layer
    const cloudsMaterial = new THREE.MeshPhysicalMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4,
    });

    const cloudsGeometry = new THREE.SphereGeometry(config.earthRadius + 0.01, 64, 64);
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    earth.add(clouds);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(config.earthRadius + 0.1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
}

// Create star field
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.02,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const starsVertices = [];
    for(let i = 0; i < config.particleCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', 
        new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Add interactive markers
function addLocationMarkers() {
    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4444 });

    // Example locations (longitude, latitude)
    const locations = [
        { name: "New York", coords: [40.7128, -74.0060] },
        { name: "London", coords: [51.5074, -0.1278] },
        { name: "Tokyo", coords: [35.6762, 139.6503] }
    ];

    locations.forEach(location => {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLongToVector3(location.coords[0], location.coords[1]);
        marker.position.copy(position);
        earth.add(marker);

        // Add hover effect
        marker.userData.name = location.name;
        marker.userData.originalScale = marker.scale.clone();
    });
}

// Convert latitude and longitude to 3D coordinates
function latLongToVector3(lat, lon) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const radius = config.earthRadius + 0.02;

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Handle window resize
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Ray casting for interactive elements
function initRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(earth.children);

        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

        earth.children.forEach(child => {
            if (child.userData.originalScale) {
                child.scale.copy(child.userData.originalScale);
            }
        });

        if (intersects.length > 0) {
            const marker = intersects[0].object;
            marker.scale.multiplyScalar(1.5);
            
            // Show tooltip
            showTooltip(marker.userData.name, event.clientX, event.clientY);
        } else {
            hideTooltip();
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Rotate Earth
    if (earth) {
        earth.rotation.y += config.rotationSpeed;
    }

    // Animate stars
    if (stars) {
        stars.rotation.y += config.rotationSpeed * 0.1;
    }

    // Render scene with post-processing
    composer.render();
}

// Initialize everything
async function init() {
    initScene();
    initPostProcessing();
    await createEarth();
    createStars();
    addLocationMarkers();
    initRaycaster();

    // Event listeners
    window.addEventListener('resize', handleResize);

    // Start animation loop
    animate();
}

// Start the application
init().catch(console.error);

// Export for potential module usage
export { init }; 