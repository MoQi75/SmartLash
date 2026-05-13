import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const projectDir = fileURLToPath(new URL('.', import.meta.url))
const backendDistDir = path.resolve(projectDir, '..', 'SmartLash_后端', 'frontend_dist')

function cleanBackendDist() {
  const targets = [
    path.join(backendDistDir, 'assets'),
    path.join(backendDistDir, 'index.html'),
    path.join(backendDistDir, 'favicon.svg'),
    path.join(backendDistDir, 'login-visual-v2.png'),
    path.join(backendDistDir, '图片1.png'),
  ]

  return {
    name: 'clean-backend-dist',
    buildStart() {
      for (const target of targets) {
        fs.rmSync(target, { recursive: true, force: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), cleanBackendDist()],
  base: '/static/vue/',
  build: {
    outDir: backendDistDir,
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index.css'
          }
          return 'assets/[name][extname]'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        rewrite: (filePath) => filePath.replace(/^\/api/, ''),
      },
    },
  },
})
