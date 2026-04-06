import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GEOAPIFY_API_KEY': JSON.stringify('2147625628e7408baf97ef929225f25a')
  },
  build: {
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  },
  server: {
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
})
