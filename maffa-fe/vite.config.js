import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.BASE_PATH || '/maffa-fe/',
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '^/maffa($|/)': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
