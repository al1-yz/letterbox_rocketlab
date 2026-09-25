import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Setup local: o front chama /api no próprio servidor do Vite, que repassa
    // para o FastAPI. Assim não há CORS nem URL do backend espalhada pelo código.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})