import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages deployment - use repo name as base path only in production
  base: mode === 'production' ? '/3DesignLab/' : '/',
  // Ensure WASM files are served with correct MIME type
  assetsInclude: ['**/*.wasm'],
}))
