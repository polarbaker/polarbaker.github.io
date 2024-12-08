import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/ThomasBakerTechPortfolio/',
  resolve: {
    alias: {
      'three': resolve(__dirname, 'node_modules/three')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true
  }
}) 