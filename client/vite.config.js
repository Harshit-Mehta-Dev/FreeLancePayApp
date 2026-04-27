import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5175',
        changeOrigin: true,
        secure: false,
        onError: (err, req, res) => {
          // Silence proxy errors during initial server warmup
        }
      },
      '/download': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5175',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
