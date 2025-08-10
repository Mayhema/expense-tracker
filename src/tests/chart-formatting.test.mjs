import { groupTransactionsByPeriod, formatChartData } from '../charts/timelineChart.js';

const t = (date, amount, type = 'expense') => ({ date: new Date(date), amount, type, category: 'Misc' });

describe('timeline chart helpers', () => {
  it('groups by month and formats labels/datasets', () => {
    const tx = [
      t('2024-01-01', 10),
      t('2024-01-15', 20),
      t('2024-02-01', 5),
      t('2024-02-10', 15),
    ];

    const grouped = groupTransactionsByPeriod(tx, 'month');
    expect(grouped.size || Object.keys(grouped).length).toBeTruthy();

    const { labels, datasets } = formatChartData(grouped, 'month');
    expect(labels.length).toBeGreaterThan(0);
    expect(Array.isArray(datasets)).toBe(true);
  });
});
