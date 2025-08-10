import { computeWindow, getTopOffset } from '../utils/virtualize.js';

describe('virtualize utils', () => {
  test('computes a reasonable window with overscan', () => {
    const res = computeWindow({ total: 1000, containerHeight: 300, rowHeight: 30, scrollTop: 450, overscan: 2 });
    // scrollTop 450 => row 15; with overscan 2 => start ~13; visible count ~10 + overscan*2 = 14
    expect(res.start).toBeGreaterThanOrEqual(10);
    expect(res.start).toBeLessThanOrEqual(20);
    expect(res.end).toBeGreaterThan(res.start);
  });

  test('top offset is start * rowHeight', () => {
    expect(getTopOffset(10, 30)).toBe(300);
  });
});
