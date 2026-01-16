import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/TeamGeoParty/' : '/',
  resolve: {
    preserveSymlinks: true,
    alias: {
      '../convex': path.resolve(__dirname, './convex'),
    },
  },
})
