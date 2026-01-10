import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite de aviso para 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          pdfmake: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'], // Separa pdfmake em um chunk isolado
          vendor: ['react', 'react-dom', 'react-router-dom'], // Separa libs principais
        },
      },
    },
  },
})
