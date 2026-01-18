import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Ignore temp files created by editors/tools (fixes WSL2 crashes)
      ignored: ['**/*.tmp.*', '**/node_modules/**'],
      // Use polling on WSL2 for reliability
      usePolling: true,
      interval: 1000,
    },
  },
})
