const { describe, test, expect } = require('@jest/globals');

describe('archive/direct-test-runner', () => {
  test('should pass minimal test', () => {
    expect(true).toBe(true);
  });
});
