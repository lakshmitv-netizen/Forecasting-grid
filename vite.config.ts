import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    // Bind IPv4 explicitly — avoids some setups where "localhost" resolves to ::1 but nothing listens.
    host: process.env.VITE_DEV_HOST ?? '127.0.0.1',
    // If 3000 is taken, use the next free port instead of failing silently for users.
    strictPort: false,
  },
  preview: {
    port: parseInt(process.env.PORT || '5000'),
    host: true,
  },
})





