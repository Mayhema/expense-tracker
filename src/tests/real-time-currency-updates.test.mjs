import { jest } from '@jest/globals';

// Mock global document for canvas detection
if (!global.document) {
  global.document = {};
}

describe('Real-time Currency Updates (ESM)', () => {
  test('should retry chart updates if canvases are missing and succeed when they appear', async () => {
    jest.useFakeTimers();
    let callCount = 0;
    global.document.getElementById = jest.fn((id) => {
      if ([
        'incomeExpenseChart',
        'expenseChart',
        'timelineChart',
      ].includes(id)) {
        callCount++;
        // Return null for first 2 attempts, then return a mock canvas
        return callCount > 6 ? { id, getContext: () => ({ clearRect: () => { } }), parentElement: { offsetWidth: 400, offsetHeight: 300 }, width: 400, height: 300, style: {} } : null;
      }
      return null;
    });
    // Import the ESM chartManager
    const { updateChartsWithCurrentData } = await import('../charts/chartManager.js');
    // Call updateChartsWithCurrentData and fast-forward timers for retries
    await (async () => {
      updateChartsWithCurrentData();
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
      }
    })();
    expect(global.document.getElementById).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
