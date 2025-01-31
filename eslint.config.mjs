import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/** @type {Array<import('eslint').Linter.FlatConfig>} */
export default [
  // Base config for all JavaScript files
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...js.configs.recommended,
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  // TypeScript config
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Browser environment config
  {
    files: ['packages/web/**/*', 'packages/extension/**/*'],
    languageOptions: {
      globals: Object.fromEntries(
        Object.entries(globals.browser).map(([key, value]) => [key.trim(), value]),
      ),
    },
  },
  // WebExtension specific config
  {
    files: ['packages/extension/**/*'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
  },
  // Node.js environment config
  {
    files: ['packages/server/**/*', 'packages/cli/**/*'],
    languageOptions: {
      globals: Object.fromEntries(
        Object.entries(globals.node).map(([key, value]) => [key.trim(), value]),
      ),
    },
  },
  // Ignore patterns
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**'],
  },
];
