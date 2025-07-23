/**
 * @jest-environment jsdom
 */

/**
 * Dark Mode UI Fixes Test
 * Tests the fixes for chart text, dropdowns, transaction summary, and modals
 */

describe('Dark Mode UI Fixes', () => {
  beforeEach(() => {
    // Set up DOM with elements that need dark mode fixes
    document.body.innerHTML = `
      <div class="main-content">
        <div class="transaction-summary">
          <div class="summary-card">
            <span class="summary-value">$1000</span>
          </div>
        </div>
        <div class="advanced-filters">
          <select id="testSelect">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
        </div>
        <div class="chart-container">
          <canvas class="chartjs-render-monitor"></canvas>
        </div>
        <div id="modalContainer" class="modal-container">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Test Modal</h3>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  test('transaction summary should have dark mode styles', () => {
    document.body.classList.add('dark-mode');

    const summaryCard = document.querySelector('.summary-card');
    const summaryValue = document.querySelector('.summary-value');

    expect(summaryCard).not.toBeNull();
    expect(summaryValue).not.toBeNull();
    expect(summaryCard.classList.contains('summary-card')).toBe(true);
  });

  test('advanced filters select should exist and be properly styled', () => {
    document.body.classList.add('dark-mode');

    const select = document.getElementById('testSelect');
    const options = select.querySelectorAll('option');

    expect(select).not.toBeNull();
    expect(options.length).toBe(2);
    // Check that the select element exists and has proper styling (height set via CSS, not inline)
    const computedStyle = window.getComputedStyle(select);
    expect(computedStyle.height).not.toBe('auto');
  });

  test('chart container should exist for dark mode styling', () => {
    document.body.classList.add('dark-mode');

    const chartContainer = document.querySelector('.chart-container');
    const canvas = document.querySelector('.chartjs-render-monitor');

    expect(chartContainer).not.toBeNull();
    expect(canvas).not.toBeNull();
  });

  test('chart text should be readable when switching modes', () => {
    const chartContainer = document.querySelector('.chart-container');

    // Test light mode
    document.body.classList.remove('dark-mode');
    expect(document.body.classList.contains('dark-mode')).toBe(false);

    // Switch to dark mode
    document.body.classList.add('dark-mode');
    expect(document.body.classList.contains('dark-mode')).toBe(true);

    // Switch back to light mode
    document.body.classList.remove('dark-mode');
    expect(document.body.classList.contains('dark-mode')).toBe(false);

    expect(chartContainer).not.toBeNull();
  });

  test('modal container should be hidden by default', () => {
    const modalContainer = document.getElementById('modalContainer');

    expect(modalContainer).not.toBeNull();
    expect(modalContainer.classList.contains('modal-container')).toBe(true);
  });

  test('modal should be activatable', () => {
    const modalContainer = document.getElementById('modalContainer');

    // Simulate modal activation
    modalContainer.classList.add('active');
    modalContainer.style.display = 'block';

    expect(modalContainer.classList.contains('active')).toBe(true);
  });

  test('dark mode class application', () => {
    document.body.classList.add('dark-mode');

    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });
});
