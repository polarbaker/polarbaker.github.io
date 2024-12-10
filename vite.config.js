import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name)) {
            return `assets/images/[name][extname]`;
          }
          return `assets/[name][extname]`;
        }
      }
    }
  },
  css: {
    // CSS configuration
    modules: true, // Enable CSS modules
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'three': 'three',
      'three/examples/jsm/controls/OrbitControls': 'three/examples/jsm/controls/OrbitControls.js'
    }
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls']
  },
  publicDir: 'public'
}) 