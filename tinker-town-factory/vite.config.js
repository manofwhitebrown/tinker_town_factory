import { defineConfig } from 'vite';

// base './' keeps asset paths relative so the build also works inside
// the Capacitor Android WebView (Part 8).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
});
