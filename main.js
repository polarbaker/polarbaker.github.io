// Update the textures loading section
const textures = {
    day: loadTexture('/textures/earth_daymap.jpg', () => {
        console.warn('Failed to load day texture, using fallback');
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

// Update the Earth material creation
const earthMaterial = new THREE.MeshPhongMaterial({
    map: textures.day,
    bumpMap: textures.bump,
    bumpScale: 0.05,
    specularMap: textures.specular,
    specular: new THREE.Color('grey'),
    shininess: 15
});

// Make sure the Earth size matches your textures better
const earthGeometry = new THREE.SphereGeometry(5, 64, 64); // Increased segments for better detail

// Update the atmosphere size to match
const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.1, // Reduced opacity for more subtle effect
    side: THREE.BackSide,
    depthWrite: false
});