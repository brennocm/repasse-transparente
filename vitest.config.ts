import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // O núcleo é TypeScript puro: sem DOM, sem React, sem async.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
