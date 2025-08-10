// These imports use the ES module exports under src/charts
import { groupTransactionsByPeriod } from '../charts/timelineChart.js';

describe('Timeline period grouping', () => {
  test('groups by month correctly and formats keys as YYYY-MM', () => {
    const txs = [
      { date: '2024-01-15', income: 100, expenses: 0 },
      { date: '2024-01-20', income: 50, expenses: 10 },
      { date: '2024-02-01', income: 0, expenses: 25 },
    ];

    const grouped = groupTransactionsByPeriod(txs, 'month');

    // Keys are YYYY-MM order-agnostic in object; validate key presence and sums
    expect(grouped['2024-01']).toBeDefined();
    expect(grouped['2024-02']).toBeDefined();

    expect(grouped['2024-01'].income).toBe(150);
    expect(grouped['2024-01'].expenses).toBe(10);
    expect(grouped['2024-02'].income).toBe(0);
    expect(grouped['2024-02'].expenses).toBe(25);
  });
});
