import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { cloudinaryDevPlugin } from './server/cloudinary.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, ['CLOUDINARY_', 'BACKEND_'])
  const proxy = {
    '/backend': {
      target: env.BACKEND_URL || 'http://localhost:8080', changeOrigin: true,
      rewrite: (path) => path.replace(/^\/backend/, ''),
      configure: (server) => server.on('proxyReq', (request) => request.removeHeader('origin')),
    },
  }
  return { plugins: [react(), cloudinaryDevPlugin(env.CLOUDINARY_URL)], server: { proxy }, preview: { proxy } }
})
