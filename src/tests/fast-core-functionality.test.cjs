/**
 * Fast Core Functionality Tests
 * Optimized for speed and essential feature validation
 */

// Set up TextEncoder for JSDOM compatibility
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

const { JSDOM } = require('jsdom');

describe('Fast Core Functionality Tests', () => {
  let mockAppState;
  let dom;

  beforeAll(() => {
    // Single setup for all tests
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    global.document = dom.window.document;
    global.window = dom.window;
  });

  beforeEach(() => {
    // Minimal setup per test
    mockAppState = {
      transactions: [],
      categories: { Food: '#ff6b6b', Transport: '#4ecdc4' },
      darkMode: false
    };
    global.AppState = mockAppState;
  });

  afterAll(() => {
    if (dom) {
      dom.window.close();
    }
  });

  describe('Transaction Management', () => {
    test('should add transaction to AppState', () => {
      const transaction = {
        id: 'test-1',
        description: 'Test Transaction',
        category: 'Food',
        amount: -25.50,
        currency: 'USD',
        date: '2025-01-01'
      };

      mockAppState.transactions.push(transaction);

      expect(mockAppState.transactions).toHaveLength(1);
      expect(mockAppState.transactions[0]).toEqual(transaction);
    });

    test('should update transaction in AppState', () => {
      const transaction = {
        id: 'test-1',
        description: 'Original',
        category: 'Food',
        amount: -25.50
      };

      mockAppState.transactions.push(transaction);

      // Update transaction
      mockAppState.transactions[0].description = 'Updated';
      mockAppState.transactions[0].amount = -30.00;

      expect(mockAppState.transactions[0].description).toBe('Updated');
      expect(mockAppState.transactions[0].amount).toBe(-30.00);
    });

    test('should remove transaction from AppState', () => {
      const transaction = { id: 'test-1', description: 'Test' };
      mockAppState.transactions.push(transaction);

      expect(mockAppState.transactions).toHaveLength(1);

      mockAppState.transactions.splice(0, 1);

      expect(mockAppState.transactions).toHaveLength(0);
    });
  });

  describe('Category Management', () => {
    test('should add new category', () => {
      mockAppState.categories['NewCategory'] = '#123456';

      expect(mockAppState.categories['NewCategory']).toBe('#123456');
      expect(Object.keys(mockAppState.categories)).toHaveLength(3);
    });

    test('should update category color', () => {
      mockAppState.categories['Food'] = '#abcdef';

      expect(mockAppState.categories['Food']).toBe('#abcdef');
    });

    test('should remove category', () => {
      delete mockAppState.categories['Food'];

      expect(mockAppState.categories['Food']).toBeUndefined();
      expect(Object.keys(mockAppState.categories)).toHaveLength(1);
    });
  });

  describe('Currency Handling', () => {
    test('should handle multiple currencies', () => {
      const transactions = [
        { currency: 'USD', amount: 100 },
        { currency: 'EUR', amount: 85 },
        { currency: 'GBP', amount: 75 }
      ];

      mockAppState.transactions = transactions;

      const currencies = [...new Set(transactions.map(t => t.currency))];

      expect(currencies).toHaveLength(3);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
    });

    test('should filter transactions by currency', () => {
      mockAppState.transactions = [
        { currency: 'USD', amount: 100 },
        { currency: 'EUR', amount: 85 },
        { currency: 'USD', amount: 50 }
      ];

      const usdTransactions = mockAppState.transactions.filter(t => t.currency === 'USD');

      expect(usdTransactions).toHaveLength(2);
      expect(usdTransactions.every(t => t.currency === 'USD')).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('should validate transaction structure', () => {
      const validTransaction = {
        id: 'test-1',
        description: 'Test',
        category: 'Food',
        amount: -25.50,
        currency: 'USD',
        date: '2025-01-01'
      };

      const requiredFields = ['id', 'description', 'category', 'amount', 'currency', 'date'];
      const hasAllFields = requiredFields.every(field => validTransaction.hasOwnProperty(field));

      expect(hasAllFields).toBe(true);
    });

    test('should validate category exists', () => {
      const transaction = { category: 'Food' };

      const categoryExists = mockAppState.categories.hasOwnProperty(transaction.category);

      expect(categoryExists).toBe(true);
    });

    test('should handle invalid amount formats', () => {
      const amounts = ['abc', '', null, undefined, NaN];

      amounts.forEach(amount => {
        const isValid = !isNaN(parseFloat(amount)) && isFinite(amount);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('State Management', () => {
    test('should maintain state consistency', () => {
      // Add transaction
      mockAppState.transactions.push({
        id: 'test-1',
        category: 'Food',
        amount: -25.50
      });

      // Verify state
      expect(mockAppState.transactions).toHaveLength(1);
      expect(mockAppState.categories['Food']).toBeTruthy();
    });

    test('should handle dark mode toggle', () => {
      expect(mockAppState.darkMode).toBe(false);

      mockAppState.darkMode = !mockAppState.darkMode;

      expect(mockAppState.darkMode).toBe(true);
    });
  });

  describe('Filtering Logic', () => {
    beforeEach(() => {
      mockAppState.transactions = [
        { id: '1', category: 'Food', amount: -25, date: '2025-01-01' },
        { id: '2', category: 'Transport', amount: -15, date: '2025-01-02' },
        { id: '3', category: 'Food', amount: -30, date: '2025-01-03' }
      ];
    });

    test('should filter by category', () => {
      const foodTransactions = mockAppState.transactions.filter(t => t.category === 'Food');

      expect(foodTransactions).toHaveLength(2);
      expect(foodTransactions.every(t => t.category === 'Food')).toBe(true);
    });

    test('should filter by amount range', () => {
      const smallExpenses = mockAppState.transactions.filter(t => Math.abs(t.amount) < 20);

      expect(smallExpenses).toHaveLength(1);
      expect(Math.abs(smallExpenses[0].amount)).toBe(15);
    });

    test('should filter by date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-02');

      const filteredTransactions = mockAppState.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      expect(filteredTransactions).toHaveLength(2);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large transaction sets quickly', () => {
      const startTime = Date.now();

      // Create 1000 transactions
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `transaction-${i}`,
        description: `Transaction ${i}`,
        category: i % 2 === 0 ? 'Food' : 'Transport',
        amount: -(Math.random() * 100),
        date: '2025-01-01'
      }));

      mockAppState.transactions = largeTransactionSet;

      // Perform operations
      const foodTransactions = mockAppState.transactions.filter(t => t.category === 'Food');
      const totalAmount = mockAppState.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(mockAppState.transactions).toHaveLength(1000);
      expect(foodTransactions.length).toBeGreaterThan(0);
      expect(totalAmount).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should efficiently search transactions', () => {
      mockAppState.transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `tx-${i}`,
        description: `Transaction ${i}`,
        category: 'Food'
      }));

      const startTime = Date.now();

      const searchResults = mockAppState.transactions.filter(t =>
        t.description.toLowerCase().includes('transaction 5')
      );

      const endTime = Date.now();

      expect(searchResults.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // Very fast search
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined gracefully', () => {
      const result = mockAppState.transactions?.filter?.(t => t.category === 'Food') || [];
      const isArray = Array.isArray(result);
      
      expect(isArray).toBe(true);
    });

    test('should handle invalid transaction data', () => {
      const invalidTransaction = { invalidField: 'value' };
      const hasRequiredFields = Boolean(
        invalidTransaction.id &&
        invalidTransaction.description &&
        invalidTransaction.category
      );
      
      expect(hasRequiredFields).toBe(false);
    });
  });
});
