/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const patchUseOptimistic = () => ({
  name: 'patch-use-optimistic',
  enforce: 'pre' as const,
  transform(code: string) {
    if (code.includes('useOptimistic')) {
      return code.replace(/import\s*\{([^}]*useOptimistic[^}]*)\}\s*from\s*['"]react['"];?/g, (_match, imports) => {
        const remaining = imports.split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== 'useOptimistic').join(', ');
        const remImport = remaining ? `import { ${remaining} } from 'react';` : '';
        return `${remImport}\nimport * as React from 'react';\nconst useOptimistic = React.useOptimistic || ((p) => [p, () => {}]);`;
      });
    }
  }
});

export default defineConfig({
  plugins: [patchUseOptimistic(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        inline: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
