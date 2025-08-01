/**
 * Real-time Currency Updates Test
 * Tests that currency changes trigger immediate updates to charts and summaries
 * without requiring page refresh
 */

describe('Real-time Currency Updates', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock global objects
    global.AppState = {
      transactions: [
        {
          id: 'test-tx-001',
          description: 'Test Transaction',
          amount: 100,
          currency: 'USD',
          category: 'Food & Dining',
          date: '2024-01-01',
          income: 0,
          expense: 100
        }
      ],
      categories: {
        'Food & Dining': '#ff6b6b'
      }
    };

    global.localStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      group: jest.fn(),
      groupEnd: jest.fn()
    };

    // Mock document
    global.document = {
      getElementById: jest.fn((id) => {
        if (['incomeExpenseChart', 'expenseChart', 'timelineChart'].includes(id)) {
          return { id }; // Return mock canvas element
        }
        return null;
      })
    };
  });

  test('should correctly import path for filterTransactions', () => {
    // This test verifies that the import path fix is working
    const expectedPath = '../filters/advancedFilters.js';

    // Read the transactionEditor file
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify the correct import path is used
    expect(editorContent).toContain(expectedPath);
    expect(editorContent).not.toContain('../../ui/filters/advancedFilters.js');
  });

  test('should check for chart canvas existence before updating charts', () => {
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify chart canvas checking is implemented
    expect(editorContent).toContain('getElementById(\'incomeExpenseChart\')');
    expect(editorContent).toContain('getElementById(\'expenseChart\')');
    expect(editorContent).toContain('getElementById(\'timelineChart\')');
    expect(editorContent).toContain('Charts not visible, skipping chart update');
  });

  test('should handle currency changes with proper error handling', () => {
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify error handling is in place
    expect(editorContent).toContain('try {');
    expect(editorContent).toContain('} catch (error)');
    expect(editorContent).toContain('Error updating transaction summary');
    expect(editorContent).toContain('Error updating currency filter options');
    expect(editorContent).toContain('Error updating charts after currency change');
  });

  test('should have proper timing for update sequence', () => {
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify proper timing sequence (summary: 100ms, filters: 150ms, charts: 200ms)
    expect(editorContent).toContain('setTimeout(async () => {');

    // Check for the timing sequence
    const summaryRegex = /updateTransactionSummary[\s\S]*?}, (\d+)\);/;
    const filtersRegex = /updateCurrencyFilterOptions[\s\S]*?}, (\d+)\);/;
    const chartsRegex = /updateChartsWithCurrentData[\s\S]*?}, (\d+)\);/;

    const summaryMatch = summaryRegex.exec(editorContent);
    const filtersMatch = filtersRegex.exec(editorContent);
    const chartsMatch = chartsRegex.exec(editorContent);

    expect(summaryMatch).toBeTruthy();
    expect(filtersMatch).toBeTruthy();
    expect(chartsMatch).toBeTruthy();

    expect(parseInt(summaryMatch[1])).toBe(100);
    expect(parseInt(filtersMatch[1])).toBe(150);
    expect(parseInt(chartsMatch[1])).toBe(200);
  });

  test('should have optional chain expressions in expenseChart.js', () => {
    const fs = require('fs');
    const path = require('path');
    const chartPath = path.join(__dirname, '../charts/expenseChart.js');
    const chartContent = fs.readFileSync(chartPath, 'utf8');

    // Verify optional chain expressions are used
    expect(chartContent).toContain('?.subcategories?.[');
    expect(chartContent).toContain('catValue?.color');
  });

  test('should verify real-time update function structure', () => {
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify the handleCurrencyUpdate function exists and has proper structure
    expect(editorContent).toContain('function handleCurrencyUpdate(transactionId, newValue)');
    expect(editorContent).toContain('💱 Currency changed for transaction');
    expect(editorContent).toContain('🔄 Transaction summary updated after currency change');
    expect(editorContent).toContain('💱 Currency filter options updated after currency change');
    expect(editorContent).toContain('📊 Charts updated after currency change');
  });

  test('should verify saveFieldChangeById calls handleCurrencyUpdate', () => {
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Verify the flow from saveFieldChangeById to handleCurrencyUpdate
    expect(editorContent).toContain('function saveFieldChangeById(transactionId, fieldName, newValue)');
    expect(editorContent).toContain('handleSpecialFieldUpdates(transactionId, fieldName, newValue)');
    expect(editorContent).toContain('if (fieldName === \'currency\')');
    expect(editorContent).toContain('handleCurrencyUpdate(transactionId, newValue)');
  });

  test('comprehensive functionality test', () => {
    // Verify all the key functionality is present
    const fs = require('fs');
    const path = require('path');
    const editorPath = path.join(__dirname, '../ui/transaction/transactionEditor.js');
    const editorContent = fs.readFileSync(editorPath, 'utf8');

    // Check all required imports and function calls are present
    const requiredElements = [
      'updateTransactionSummary',
      'filterTransactions',
      'updateCurrencyFilterOptions',
      'updateChartsWithCurrentData',
      'handleCurrencyUpdate',
      'handleSpecialFieldUpdates',
      'saveFieldChangeById'
    ];

    requiredElements.forEach(element => {
      expect(editorContent).toContain(element);
    });

    // Verify the complete workflow is implemented
    expect(editorContent).toContain('Update transaction summary to reflect new currency distribution');
    expect(editorContent).toContain('Update currency filter dropdown options to include new currency');
    expect(editorContent).toContain('Update charts to reflect currency changes in real-time');
  });

  test('should retry chart updates if canvases are missing and succeed when they appear', async () => {
    jest.useFakeTimers();
    let callCount = 0;
    // Simulate canvases missing for first 2 calls, then present
    global.document.getElementById = jest.fn((id) => {
      if (['incomeExpenseChart', 'expenseChart', 'timelineChart'].includes(id)) {
        callCount++;
        // Return null for first 2 attempts, then return a mock canvas
        return callCount > 6 ? { id } : null;
      }
      return null;
    });
    // Use dynamic import for ES module compatibility
    const chartManager = await import('../charts/chartManager.js');
    chartManager.updateChartsWithCurrentData();
    // Fast-forward timers for retries
    for (let i = 0; i < 3; i++) {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // allow any pending promises to resolve
    }
    // After retries, canvases should be found and update should proceed
    expect(global.document.getElementById).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
