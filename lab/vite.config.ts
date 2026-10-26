import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built site works from any folder (GitHub Pages root or a subpath).
export default defineConfig({
  base: './',
  plugins: [react()],
  // three.js is most of the bundle (~310 kB gzipped); one chunk is fine for this page.
  build: { chunkSizeWarningLimit: 1200 },
});
