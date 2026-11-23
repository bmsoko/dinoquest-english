import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // API_PROXY lets you point at a backend on another port (default 8000)
      '/api': process.env.API_PROXY ?? 'http://localhost:8000',
    },
  },
})
