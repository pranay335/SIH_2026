import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< Updated upstream
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
=======
    port: 3000,
    open: true,        // Auto-open browser
    host: true         // Expose to network
>>>>>>> Stashed changes
  }
})
