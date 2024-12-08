import { defineConfig } from 'vite'

export default defineConfig({
  base: '/ThomasBakerTechPortfolio/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    sourcemap: true
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true
  },
  optimizeDeps: {
    include: ['three']
  },
  publicDir: 'public'
}) 