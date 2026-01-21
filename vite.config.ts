import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use base path for production (GitHub Pages), not for local dev
  base: command === 'build' ? '/3DesignLab/' : '/',
}))
