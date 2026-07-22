import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work from localhost, a static ZIP, and a GitHub Pages subpath.
  base: './',
});

