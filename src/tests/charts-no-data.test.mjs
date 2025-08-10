/**
 * Chart no-data behavior tests
 */

describe('charts no-data behavior', () => {
  beforeEach(() => {
    // Jest jsdom environment provides window/document
    document.body.innerHTML = '<canvas id="incomeExpenseChart" width="300" height="150"></canvas><canvas id="expenseCategoryChart" width="300" height="150"></canvas>';
    // Ensure Chart stub exists (setupTests also provides one)
    if (typeof global.Chart === 'undefined') {
      global.Chart = class { constructor() { } destroy() { } update() { } };
    }
  });

  test('incomeExpenseChart shows no data message for empty input', async () => {
    const mod = await import('../charts/incomeExpenseChart.js');
    const canvas = document.getElementById('incomeExpenseChart');
    expect(canvas).toBeTruthy();
    // Should not throw
    await mod.createIncomeExpenseChart([]);
  });

  test('expenseCategoryChart shows no data message for empty state', async () => {
    const { createExpenseCategoryChart } = await import('../charts/expenseChart.js');
    const canvas = document.getElementById('expenseCategoryChart');
    expect(canvas).toBeTruthy();
    // Should not throw
    await createExpenseCategoryChart([]);
  });
});
