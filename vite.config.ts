import { defineConfig } from 'vite';
import * as path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: false,
    lib: {
      entry: './src/index.ts',
      name: 'globalThis',
      formats: ['iife'],
      fileName: () => 'app.js',
    },
    rollupOptions: {
      treeshake: false,
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
