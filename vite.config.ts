import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'es2015',
    sourcemap: false,
    minify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'date-vendor': ['date-fns'],
          'ui-vendor': ['lucide-react', 'react-datepicker', 'react-big-calendar']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});