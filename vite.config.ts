import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Two builds from one config:
//   npm run build            -> dist/            normal static site (Vercel, GitHub Pages, serve.js)
//   npm run build:classroom  -> dist-classroom/  everything inlined into one index.html, so it opens
//                                               by double-click (file://) with no server and no internet.
export default defineConfig(({ mode }) => {
  const classroom = mode === 'classroom';
  return {
    // Relative base + HashRouter: works from any sub-path and from file://.
    base: './',
    plugins: [react(), ...(classroom ? [viteSingleFile()] : [])],
    build: {
      outDir: classroom ? 'dist-classroom' : 'dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
