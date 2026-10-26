import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist', 'node_modules', 'build', 'coverage', '*.config.js', '*.config.ts'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      // Plugins run in QuickJS: no DOM, only the host's `sendMessage`
      // (declared in src/shared/types/global.d.ts) and `console`.
      globals: { console: 'readonly', globalThis: 'readonly', sendMessage: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  }
);
