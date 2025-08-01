const { describe, test, expect } = require('@jest/globals');

describe('quick-test-runner', () => {
  test('should pass minimal test', () => {
    expect(true).toBe(true);
  });
});
