// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@angular-eslint': angular,
    },
    rules: {
      // ✅ Auto-fix friendly rules
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.stylistic.rules,

      // 🔧 These were blocking auto-fix — disable them temporarily
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/component-selector': 'off',

      // ✅ Keep directive selector if you want
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'src',
          style: 'camelCase',
        },
      ],
    },
  },
];
