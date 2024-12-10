export class LocationMarker {
    constructor(position, label) {
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.createMarkerTexture(),
                color: 0x0088ff,
                transparent: true
            })
        );
        // Implementation details...
    }
} 