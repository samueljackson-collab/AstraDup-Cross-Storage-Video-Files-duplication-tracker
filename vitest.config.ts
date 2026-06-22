import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/node_modules/**',
        'vite.config.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
