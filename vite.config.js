import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure proper routing for SPA
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Base path for deployment (use '/' for root, or '/subfolder/' for subfolder deployment)
  base: '/',
})
