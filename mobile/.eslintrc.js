module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'web-build/',
  ],
};