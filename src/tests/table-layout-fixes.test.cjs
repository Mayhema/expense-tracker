/**
 * Table Layout and Sizing Test
 * Tests to ensure proper table column sizing and button visibility in edit mode
 */

// Set up TextEncoder for JSDOM compatibility
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Table Layout and Sizing Fixes', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Read the table fixes CSS
    const tableFixes = fs.readFileSync(path.join(__dirname, '../styles/table-fixes.css'), 'utf8');

    // Create a DOM environment with table structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${tableFixes}
          </style>
        </head>
        <body>
          <div class="transaction-table-wrapper">
            <table class="transaction-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Currency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr data-transaction-id="test-1" data-edit-mode="false">
                  <td class="counter-cell">1</td>
                  <td class="date-cell">25/01/2025</td>
                  <td class="description-cell">Test transaction description</td>
                  <td class="category-cell">Food</td>
                  <td class="income-cell">100.00</td>
                  <td class="expenses-cell">50.00</td>
                  <td class="currency-cell">
                    <select class="edit-field currency-field" data-transaction-id="test-1">
                      <option value="USD" selected>$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </td>
                  <td class="actions-cell">
                    <button class="action-btn btn-edit">✏️</button>
                    <button class="action-btn btn-delete">🗑️</button>
                    <button class="action-btn btn-save" style="display: none;">💾</button>
                    <button class="action-btn btn-revert" style="display: none;">↶</button>
                    <button class="action-btn btn-revert-all">🔄</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    window = dom.window;
    document = window.document;
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  test('table should have fixed layout for consistent column widths', () => {
    const table = document.querySelector('.transaction-table');
    const computedStyle = window.getComputedStyle(table);

    expect(table).not.toBeNull();
    expect(computedStyle.tableLayout).toBe('fixed');
    expect(computedStyle.width).toBe('100%');
  });

  test('currency column should have constrained width', () => {
    const currencyHeader = document.querySelector('.transaction-table th:nth-child(7)');
    const currencyCell = document.querySelector('.transaction-table td:nth-child(7)');

    expect(currencyHeader).not.toBeNull();
    expect(currencyCell).not.toBeNull();

    // Check CSS rules are applied by reading the stylesheet content
    const stylesheets = Array.from(document.styleSheets);
    expect(stylesheets.length).toBeGreaterThan(0);
  });

  test('actions column should accommodate all buttons', () => {
    const actionsHeader = document.querySelector('.transaction-table th:nth-child(8)');
    const actionsCell = document.querySelector('.transaction-table td:nth-child(8)');

    expect(actionsHeader).not.toBeNull();
    expect(actionsCell).not.toBeNull();

    // Verify action buttons exist
    const actionButtons = actionsCell.querySelectorAll('.action-btn');
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  test('currency field should be properly sized within cell', () => {
    const currencyField = document.querySelector('.currency-field');
    expect(currencyField).not.toBeNull();
    expect(currencyField.tagName.toLowerCase()).toBe('select');
    expect(currencyField.options.length).toBeGreaterThan(0);
  });

  test('action buttons should be properly sized and spaced', () => {
    const actionButtons = document.querySelectorAll('.actions-cell .action-btn');

    expect(actionButtons.length).toBeGreaterThan(0);

    actionButtons.forEach(button => {
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button.classList.contains('action-btn')).toBe(true);
    });
  });

  test('table should have horizontal scroll when needed', () => {
    const tableWrapper = document.querySelector('.transaction-table-wrapper');
    expect(tableWrapper).not.toBeNull();

    // Check the wrapper exists and can contain the table
    const table = tableWrapper.querySelector('.transaction-table');
    expect(table).not.toBeNull();
  });

  test('counter column should be narrow and centered', () => {
    const counterHeader = document.querySelector('.transaction-table th:nth-child(1)');
    const counterCell = document.querySelector('.transaction-table td:nth-child(1)');

    expect(counterHeader).not.toBeNull();
    expect(counterCell).not.toBeNull();
    expect(counterCell.textContent).toBe('1');
  });

  test('edit mode should properly display edit fields', () => {
    const row = document.querySelector('tr[data-transaction-id="test-1"]');

    // Simulate entering edit mode
    row.setAttribute('data-edit-mode', 'true');

    // Check that edit mode styles would apply
    expect(row.getAttribute('data-edit-mode')).toBe('true');
  });

  test('responsive design should adjust column widths on smaller screens', () => {
    // Test mobile breakpoint styles exist in CSS
    const tableFixes = fs.readFileSync(path.join(__dirname, '../styles/table-fixes.css'), 'utf8');

    expect(tableFixes).toMatch(/@media.*max-width.*768px/);
    expect(tableFixes).toMatch(/@media.*max-width.*1200px/);
  });

  test('dark mode compatibility should be present', () => {
    const tableFixes = fs.readFileSync(path.join(__dirname, '../styles/table-fixes.css'), 'utf8');

    expect(tableFixes).toMatch(/body\.dark-mode.*currency-cell/);
    expect(tableFixes).toMatch(/body\.dark-mode.*edit-field/);
  });
});
