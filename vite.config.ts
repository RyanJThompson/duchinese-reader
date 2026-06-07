import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Always include public/ (incl. public/data) in the build. Lesson data ships
  // as static files served at /data, gated by the edge basic-auth middleware.
  publicDir: 'public',
})
