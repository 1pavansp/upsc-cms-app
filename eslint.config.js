import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ["dist/**"],
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ["functions/**"],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      globals: {
        ...globals.browser
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
    }
  },
  {
    files: ["functions/src/**/*.ts"],
    plugins: {
      '@typescript-eslint': ts,
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: 's:/Cms/upsc-cms-app/functions'
      }
    },
    rules: ts.configs.recommended.rules
  }
];
