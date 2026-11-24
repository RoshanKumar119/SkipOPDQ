import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies API and Socket.IO traffic to the Express backend,
// so the frontend can use relative URLs (/api, /socket.io).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
