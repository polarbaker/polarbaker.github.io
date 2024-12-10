export class UI {
    constructor(earthScene) {
        this.earthScene = earthScene;
        this.createUI();
    }

    createUI() {
        // Create main UI container
        const uiContainer = document.createElement('div');
        uiContainer.className = 'ui-container';
        
        // Add controls panel
        const controls = `
            <div class="controls-panel">
                <button class="control-btn" data-action="reset">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="control-btn" data-action="photo">
                    <i class="fas fa-camera"></i>
                </button>
                <div class="rotation-controls">
                    <button class="control-btn" data-action="pause">
                        <i class="fas fa-pause"></i>
                    </button>
                    <input type="range" class="rotation-speed" min="0" max="100" value="50">
                </div>
            </div>
            <div class="info-panel">
                <div class="coordinates"></div>
                <div class="location-info"></div>
            </div>
        `;
        
        uiContainer.innerHTML = controls;
        document.body.appendChild(uiContainer);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Implementation of control button handlers
    }
} 