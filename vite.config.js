import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { downloadApiPlugin } from './vite-download-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), downloadApiPlugin()],
  server: {
    proxy: {
      '/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tmdb/, ''),
        secure: true,
      },
    },
  },
})
