module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true,
  },
  globals: {
    // Provided by CDN in browser, stubbed in tests
    Chart: 'readonly',
    XLSX: 'readonly',
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules/',
    'src/tests/archive/**',
    'dist/',
  ],
  rules: {
    // Prevent duplicate exports
    'no-dupe-class-members': 'error',

    // Additional helpful rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
