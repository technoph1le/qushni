import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Lets teammates open the dev server through a Cloudflare quick tunnel.
    allowedHosts: ['.trycloudflare.com'],
    // With VITE_API_URL=/api the browser calls the backend through this server,
    // so a shared tunnel link works without exposing the backend separately.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely, so browsers keep them cached across our deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
