import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built site works from any folder (GitHub Pages root or a subpath).
export default defineConfig({
  base: './',
  plugins: [react()],
  // three.js is most of the bundle (~310 kB gzipped); one chunk is fine for this page.
  // Built files go in static/ so they never collide with the old site's assets/ folder,
  // which the original blog posts still use when the build is written to the repo root.
  build: { chunkSizeWarningLimit: 1200, assetsDir: 'static' },
});
