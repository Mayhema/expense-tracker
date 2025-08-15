/* Deprecated compatibility test file for category manager. */

module.exports = {};

if (typeof describe !== 'undefined') {
  describe('Category Manager legacy suite', () => {
    test('no-op', () => expect(true).toBe(true));
  });
}
