import { jest } from '@jest/globals';
import { AppState as CoreAppState } from '../core/appState.js';

// Use ESM import for the editor after globals are set up
describe('Transaction Editor Flows (API-level)', () => {
  beforeEach(() => {
    // Minimal DOM for category style update
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr data-transaction-id="tx_1">
            <td class="category-cell"></td>
            <td class="amount-cell"></td>
            <td class="amount-cell"></td>
          </tr>
        </tbody>
      </table>
    `;

    // AppState & storage mocks (mutate the module's AppState instance)
    CoreAppState.transactions = [
      {
        id: 'tx_1',
        description: 'Groceries',
        income: 0,
        expenses: 100,
        category: 'Uncategorized',
        subcategory: '',
      },
    ];
    CoreAppState.categories = { Food: { color: '#00aa00' } };

    // Robust localStorage mock bound to window and globalThis
    const storage = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => (key in store ? store[key] : '[]')),
        setItem: jest.fn((key, value) => {
          store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      };
    })();

  Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });
  });

  test('saveFieldChangeById updates category and styles category cell', async () => {
    const { saveFieldChangeById } = await import('../ui/transaction/transactionEditor.js');

    // Act
    saveFieldChangeById('tx_1', 'category', 'Food:Groceries');

    // Assert state
  const tx = CoreAppState.transactions[0];
    expect(tx.category).toBe('Food');
    expect(tx.subcategory).toBe('Groceries');
    expect(tx.editedFields?.category).toBe(true);
  expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'transactions',
      expect.any(String)
    );

    // Assert UI style updated
    const cell = document.querySelector('tr[data-transaction-id="tx_1"] .category-cell');
    expect(cell.style.cssText).toContain('background-color');
  });

  test('saveFieldChangeById updates currency and marks editedFields', async () => {
    jest.useFakeTimers();
    const { saveFieldChangeById } = await import('../ui/transaction/transactionEditor.js');

    // Return null canvases to skip chart updates cleanly
    document.getElementById = jest.fn(() => null);

    saveFieldChangeById('tx_1', 'currency', 'EUR');

  const tx = CoreAppState.transactions[0];
    expect(tx.currency).toBe('EUR');
    expect(tx.editedFields?.currency).toBe(true);

    // Advance timers so currency update timeouts run without throwing
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});
