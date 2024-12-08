import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
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
  },
  resolve: {
    alias: {
      'three': 'three'
    }
  }
}) 