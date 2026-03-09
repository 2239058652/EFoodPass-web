import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src')
    }
  },
  server: {
    port: 5602,
    open: true,
    proxy: {
    '/api': {
      target: 'http://localhost:5603',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
  }
})
