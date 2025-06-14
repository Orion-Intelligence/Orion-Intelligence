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
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.stylistic.rules,

      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/component-selector': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

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
