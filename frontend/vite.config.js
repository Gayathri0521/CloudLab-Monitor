import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Port 5174 matches the Cognito App Client callback URL and sign-out URL
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // fail if port is already in use
  },
})
