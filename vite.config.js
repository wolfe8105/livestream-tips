import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /livestream-tips/ path
  base: '/livestream-tips/',
  build: {
    // Output to docs/ folder for GitHub Pages
    outDir: 'docs',
    emptyOutDir: true,
  },
});
