export class LoadingScreen {
    constructor() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading-screen';
        this.loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loading-title">Loading Earth</div>
                <div class="loading-spinner"></div>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
                <div class="loading-text">Preparing your journey...</div>
            </div>
        `;
        document.body.appendChild(this.loadingElement);
    }

    updateProgress(progress) {
        const progressBar = this.loadingElement.querySelector('.progress-bar');
        const loadingText = this.loadingElement.querySelector('.loading-text');
        
        progressBar.style.width = `${progress}%`;
        
        // Update loading message based on progress
        if (progress < 25) {
            loadingText.textContent = 'Loading terrain data...';
        } else if (progress < 50) {
            loadingText.textContent = 'Generating atmosphere...';
        } else if (progress < 75) {
            loadingText.textContent = 'Adding cloud layers...';
        } else {
            loadingText.textContent = 'Almost ready...';
        }
    }

    hide() {
        this.loadingElement.classList.add('fade-out');
        setTimeout(() => {
            this.loadingElement.remove();
        }, 1000);
    }
} 