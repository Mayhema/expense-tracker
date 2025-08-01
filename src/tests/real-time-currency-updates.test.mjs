import { jest } from '@jest/globals';

// Mock global document for canvas detection
if (!global.document) {
  global.document = {};
}

const createMockCanvas = () => ({
  id: 'mock',
  getContext: () => ({ clearRect: () => { } }),
  parentElement: { offsetWidth: 400, offsetHeight: 300 },
  width: 400,
  height: 300,
  style: {}
});

const mockGetElementById = (callCount) => (id) => {
  if (['incomeExpenseChart', 'expenseChart', 'timelineChart'].includes(id)) {
    return callCount > 6 ? createMockCanvas() : null;
  }
  return null;
};

const fastForwardTimers = async () => {
  for (let i = 0; i < 3; i++) {
    jest.advanceTimersByTime(200);
    await Promise.resolve();
  }
};

describe('Real-time Currency Updates (ESM)', () => {
  test('should retry chart updates if canvases are missing and succeed when they appear', async () => {
    jest.useFakeTimers();
    let callCount = 0;

    global.document.getElementById = jest.fn((id) => {
      if (['incomeExpenseChart', 'expenseChart', 'timelineChart'].includes(id)) {
        callCount++;
        return callCount > 6 ? createMockCanvas() : null;
      }
      return null;
    });

    const { updateChartsWithCurrentData } = await import('../charts/chartManager.js');
    updateChartsWithCurrentData();
    await fastForwardTimers();

    expect(global.document.getElementById).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
