import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LoadingScreen } from './LoadingScreen';
import { UI } from './UI';

class EarthScene {
  constructor() {
    console.log('Initializing EarthScene...');
    // Create canvas if it doesn't exist
    this.canvas = document.querySelector('#earth-canvas');
    if (!this.canvas) {
      console.log('Creating canvas element...');
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'earth-canvas';
      document.body.insertBefore(this.canvas, document.body.firstChild);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    this.controls = null;
    this.earth = null;
    this.stars = null;
    this.textureLoader = new THREE.TextureLoader();

    // Add new properties
    this.loadingScreen = new LoadingScreen();
    this.isRotating = true;
    this.rotationSpeed = 0.0001;
    this.markers = new Map();

    // Add scroll handling
    this.scrollY = 0;
    this.lastScrollY = 0;
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Add intersection observer for sections
    this.setupIntersectionObserver();

    // Create loading manager
    this.loadingManager = new THREE.LoadingManager(
        // onLoad callback
        () => {
            console.log('Loading complete!');
            this.loadingScreen.hide();
        },
        // onProgress callback
        (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading: ${progress}%`);
            this.loadingScreen.updateProgress(progress);
        },
        // onError callback
        (url) => {
            console.error('Error loading:', url);
        }
    );

    // Update texture loader to use loading manager
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);

    // Initialize scene
    this.init();
  }

  init() {
    console.log('Initializing Earth scene...');
    
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);

    // Setup camera
    this.camera.position.z = 6;
    this.camera.position.y = 0;
    this.camera.position.x = 0;
    this.camera.lookAt(0, 0, 0);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.enableZoom = false;

    // Create stars first
    this.createStars();
    
    // Create Earth
    this.createEarth();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  createEarth() {
    console.log('Creating Earth...');
    const geometry = new THREE.SphereGeometry(2, 128, 128);
    
    // Update texture paths to match your file structure
    const textureUrls = {
        day: './public/textures/earth_daymap.jpg',
        night: './public/textures/earth_nightmap.jpg',
        bump: './public/textures/earth_bump.jpg',
        normal: './public/textures/earth_normal.jpg',
        specular: './public/textures/earth_specular.jpg'
    };

    // Add debug logging
    console.log('Attempting to load textures from:', textureUrls);
    
    const textures = {};
    let loadedCount = 0;
    const totalTextures = Object.keys(textureUrls).length;

    // Load each texture with better error handling
    Object.entries(textureUrls).forEach(([key, url]) => {
        this.textureLoader.load(
            url,
            (texture) => {
                console.log(`Successfully loaded texture: ${key}`);
                textures[key] = texture;
                loadedCount++;
                
                const progress = (loadedCount / totalTextures) * 100;
                this.loadingScreen.updateProgress(progress);

                if (loadedCount === totalTextures) {
                    this.createEarthWithTextures(geometry, textures);
                }
            },
            undefined,
            (error) => {
                console.error(`Failed to load texture ${key} from ${url}:`, error);
                loadedCount++;
                if (loadedCount === totalTextures) {
                    this.createEarthWithTextures(geometry, textures);
                }
            }
        );
    });
  }

  createEarthWithTextures(geometry, textures) {
    try {
        console.log('Creating Earth with textures:', textures);
        
        // Enhance texture quality
        Object.values(textures).forEach(texture => {
            if (texture) {
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            }
        });

        // Create material with loaded textures - using MeshStandardMaterial instead of MeshPhongMaterial
        const material = new THREE.MeshStandardMaterial({
            map: textures.day || null,
            bumpMap: textures.bump || null,
            bumpScale: 0.15,
            normalMap: textures.normal || null,
            normalScale: new THREE.Vector2(0.2, 0.2),
            roughnessMap: textures.specular || null,
            metalness: 0.2,
            roughness: 0.9,
            emissive: 0x000000,
            emissiveIntensity: 0
        });

        this.earth = new THREE.Mesh(geometry, material);
        
        // Add atmosphere effect - also using MeshStandardMaterial
        const atmosphereGeometry = new THREE.SphereGeometry(2.12, 128, 128);
        const atmosphereMaterial = new THREE.MeshStandardMaterial({
            color: 0x1133ff,
            transparent: true,
            opacity: 0.06,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            metalness: 0.5,
            roughness: 0.5
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        
        // Create clouds layer - also using MeshStandardMaterial
        const cloudGeometry = new THREE.SphereGeometry(2.06, 128, 128);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            metalness: 0.1,
            roughness: 0.8
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Create group and add all elements
        this.earthGroup = new THREE.Group();
        this.earthGroup.add(this.earth);
        this.earthGroup.add(atmosphere);
        this.earthGroup.add(clouds);
        
        // Add subtle rotation
        this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
        
        this.scene.add(this.earthGroup);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.set(8, 3, 8);
        this.scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x223344, 0.2);
        rimLight.position.set(-8, -3, -8);
        this.scene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0x0022ff, 0.1);
        fillLight.position.set(0, -5, 0);
        this.scene.add(fillLight);

        // Hide loading screen when complete
        this.loadingScreen.hide();
        
        console.log('Earth created successfully');
        
    } catch (error) {
        console.error('Error creating Earth:', error);
        // Create a basic sphere as fallback
        const basicMaterial = new THREE.MeshStandardMaterial({
            color: 0x2233ff,
            metalness: 0.5,
            roughness: 0.5
        });
        this.earth = new THREE.Mesh(geometry, basicMaterial);
    }

    // Continue with the rest of the setup...
  }

  createStars() {
    console.log('Creating stars...');
    
    // Create multiple star layers with enhanced characteristics
    this.createStarLayer(30000, 0.1, 3500, 0xFFFFFF, 0.9);   // Distant white stars
    this.createStarLayer(2000, 0.2, 2500, 0x4A90E2, 1.0);    // Mid blue stars
    this.createStarLayer(1000, 0.25, 2000, 0xFFFAF0, 1.0);   // Bright white stars
    this.createStarLayer(500, 0.3, 1500, 0xFF8F8F, 0.95);    // Red stars
    this.createStarLayer(500, 0.2, 2000, 0x90EE90, 0.9);     // Green tinted stars
    this.createStarCluster(1200, 1000);                       // Dense central cluster
    this.createStarCluster(800, 800, 0x4A90E2);              // Blue cluster
    this.createNebula();                                      // Main nebula
    this.createNebula(0x4A90E2, -2000, -500, -1500);         // Secondary nebula
  }

  createStarLayer(count, size, spread, color, opacity) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        opacity: opacity,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        depthWrite: false // Improve rendering of overlapping stars
    });

    const starsVertices = [];
    const starSizes = [];
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        // Improved distribution for more natural star field
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = spread * Math.cbrt(Math.random()); // Cubic root for better distribution
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        // Enhanced size variation with more small stars
        const starSize = Math.pow(Math.random(), 2) * 1.5 + 0.2; // More small stars
        
        // Enhanced color variation
        const hue = THREE.MathUtils.randFloat(-0.15, 0.15);
        const saturation = THREE.MathUtils.randFloat(0, 0.3);
        const lightness = THREE.MathUtils.randFloat(0, 0.3);
        const colorObj = new THREE.Color(color);
        colorObj.offsetHSL(hue, saturation, lightness);
        
        // Add subtle twinkling effect
        const twinkleSpeed = Math.random() * 0.02 + 0.01;
        const twinkleAmount = Math.random() * 0.3 + 0.7;
        
        starsVertices.push(x, y, z);
        starSizes.push(starSize);
        colors.push(colorObj.r, colorObj.g, colorObj.b);
        
        // Store twinkling data
        if (!this.twinklingStars) this.twinklingStars = [];
        this.twinklingStars.push({
            speed: twinkleSpeed,
            amount: twinkleAmount,
            offset: Math.random() * Math.PI * 2 // Random start phase
        });
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    
    // Enhanced movement patterns
    stars.rotation.x = Math.random() * 0.2;
    stars.rotation.y = Math.random() * 0.2;
    stars.rotation.z = Math.random() * 0.2;
    
    stars.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.0002,
        y: (Math.random() - 0.5) * 0.0002,
        z: (Math.random() - 0.5) * 0.0001
    };
    
    stars.userData.originalSizes = [...starSizes];
    stars.userData.twinklingData = this.twinklingStars;
    this.twinklingStars = []; // Reset for next layer
    
    this.scene.add(stars);
    
    if (count === 30000) {
        this.stars = stars;
    }
  }

  createStarCluster(count, radius, color = 0xFFFFFF) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.2,          // Increased size
        transparent: true,
        opacity: 0.9,       // Increased opacity
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const positions = [];
    const colors = [];
    const sizes = [];

    // Create a clustered distribution
    for (let i = 0; i < count; i++) {
        // Use gaussian distribution for more central clustering
        const r = radius * Math.pow(Math.random(), 2); // Cluster towards center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions.push(x, y, z);

        // Add color variation - brighter blue/white
        const intensity = Math.random() * 0.2 + 0.8; // Higher base intensity
        colors.push(intensity, intensity, intensity + Math.random() * 0.3);

        // Vary the size - larger range
        sizes.push(Math.random() * 0.8 + 0.5);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const cluster = new THREE.Points(geometry, material);
    cluster.position.set(1000, -500, -1500); // Position the cluster
    this.scene.add(cluster);
  }

  createNebula(color = 0x0033ff, x = 0, y = 0, z = 0) {
    const textureLoader = new THREE.TextureLoader();
    const spriteMaterial = new THREE.SpriteMaterial({
        map: textureLoader.load('/textures/nebula.png'),
        color: color,
        transparent: true,
        opacity: 0.3,       // Increased opacity
        blending: THREE.AdditiveBlending
    });

    const nebula = new THREE.Sprite(spriteMaterial);
    nebula.scale.set(2500, 2000, 1); // Larger scale
    nebula.position.set(x, y, z);
    this.scene.add(nebula);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = Date.now() * 0.001; // Current time in seconds

    // Enhanced star animation
    this.scene.children.forEach(child => {
        if (child instanceof THREE.Points) {
            // Rotation
            if (child.userData.rotationSpeed) {
                child.rotation.x += child.userData.rotationSpeed.x;
                child.rotation.y += child.userData.rotationSpeed.y;
                child.rotation.z += child.userData.rotationSpeed.z;
            }
            
            // Twinkling effect
            if (child.userData.originalSizes && child.userData.twinklingData) {
                const sizes = child.geometry.attributes.size.array;
                const originalSizes = child.userData.originalSizes;
                const twinklingData = child.userData.twinklingData;
                
                for (let i = 0; i < sizes.length; i++) {
                    const twinkling = twinklingData[i];
                    sizes[i] = originalSizes[i] * 
                        (1 + Math.sin(time * twinkling.speed + twinkling.offset) * 
                        0.2 * twinkling.amount);
                }
                child.geometry.attributes.size.needsUpdate = true;
            }
            
            // Subtle position oscillation
            child.position.y += Math.sin(time * 0.5) * 0.02;
        }
    });

    if (this.earthGroup && this.isRotating) {
        this.earthGroup.rotation.y += this.rotationSpeed;
        this.earthGroup.rotation.x = Math.sin(Date.now() * 0.00001) * 0.005;
    }

    // Only call updateMarkers if we have markers
    if (this.markers && this.markers.size > 0) {
        this.updateMarkers();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  updateMarkers() {
    // Skip if no markers exist
    if (!this.markers || this.markers.size === 0) return;
    
    // Update each marker's position
    this.markers.forEach(marker => {
        if (marker.update) {
            marker.update();
        }
    });
  }

  // Add new methods for enhanced features
  addLocationMarker(lat, lng, label) {
    // Add 3D marker at coordinates
  }

  takeScreenshot() {
    // Implement screenshot functionality
  }

  highlightRegion(coordinates) {
    // Add region highlighting
  }

  toggleRotation() {
    this.isRotating = !this.isRotating;
  }

  setRotationSpeed(speed) {
    this.rotationSpeed = speed * 0.0001;
  }

  handleScroll() {
    this.scrollY = window.scrollY;
    
    // Parallax effect for all star layers
    this.scene.children.forEach((child, index) => {
        if (child instanceof THREE.Points) {
            // Different parallax speeds for different layers
            const speed = 0.0001 * (index + 1);
            child.rotation.y = this.scrollY * speed;
            child.rotation.x = this.scrollY * speed * 0.5;
        }
    });
    
    // Hide/show header based on scroll direction with threshold
    const header = document.querySelector('header');
    if (header) {
        // Only hide header if we've scrolled down more than 100px
        if (this.scrollY > this.lastScrollY && this.scrollY > 100) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
    }
    
    this.lastScrollY = this.scrollY;
  }

  setupIntersectionObserver() {
    const options = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, options);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking WebGL support...');
  // Ensure WebGL is available
  if (!window.WebGLRenderingContext) {
    console.error('WebGL is not available in your browser');
    return;
  }

  try {
    console.log('Creating Earth scene...');
    new EarthScene();
  } catch (error) {
    console.error('Error initializing Earth scene:', error);
  }
});

// Add this after the EarthScene class
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function setupScrollIndicator() {
    const sections = document.querySelectorAll('section');
    const scrollDots = document.querySelectorAll('.scroll-dot');
    
    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                scrollDots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.dataset.section === sectionId) {
                        dot.classList.add('active');
                    }
                });
            }
        });
    }, options);

    sections.forEach(section => observer.observe(section));
}

function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav ul');
    
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        nav.classList.toggle('active');
    });
}

function setupNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const options = {
        threshold: 0.5,
        rootMargin: '-50% 0% -50% 0%'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, options);

    sections.forEach(section => observer.observe(section));

    // Add smooth scroll behavior
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupScrollIndicator();
    setupMobileMenu();
    setupNavigation();
});