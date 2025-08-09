module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/src/tests/**/*.test.cjs', '**/src/tests/**/*.test.mjs'],
  testPathIgnorePatterns: ['/node_modules/', '/src/tests/archive/'],
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.cjs'],
};
