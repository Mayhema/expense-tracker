// Legacy CommonJS test file – superseded by utils-core.test.mjs (ESM)
// Keeping as a no-op to avoid ES module import errors in Jest

describe.skip('utils core (CJS legacy)', () => {
  test('skipped in favor of ESM test suite', () => {
    expect(true).toBe(true);
  });
});
