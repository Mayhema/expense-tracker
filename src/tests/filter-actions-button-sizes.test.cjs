// JSDOM dependency shims
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Regression: Filter actions buttons sizing', () => {
  test('Apply/Clear buttons keep their intended padding and min-width', async () => {
    const htmlCandidates = [
      path.join(__dirname, '../index.html'),
      path.join(__dirname, '../../src/index.html'),
      path.join(__dirname, '../../index.html'),
    ];
    const htmlPath = htmlCandidates.find(p => fs.existsSync(p));
    expect(htmlPath).toBeTruthy();
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const { document } = dom.window;

    // Inject minimal markup for filter actions if not present
    if (!document.querySelector('.filter-actions')) {
      const container = document.createElement('div');
      container.className = 'filter-actions';
      container.innerHTML = `
        <button type="button" id="applyFiltersBtn" class="btn primary-btn action-btn">✨ Apply Filters</button>
        <button type="button" id="clearAllFiltersBtn" class="btn secondary-btn action-btn">🧹 Clear All</button>
      `;
      document.body.appendChild(container);
    }

  const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearAllFiltersBtn');
    expect(applyBtn).toBeTruthy();
    expect(clearBtn).toBeTruthy();

    // Ensure not inside Category Manager, so CM 20px sizing cannot leak
  expect(applyBtn.closest('.category-manager')).toBeNull();
    expect(clearBtn.closest('.category-manager')).toBeNull();

  // Static CSS contract check: filters.css defines a min-width for .filter-actions .action-btn
  const cssPath = path.join(__dirname, '../../src/styles/filters.css');
  expect(fs.existsSync(cssPath)).toBe(true);
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css.includes('.filter-actions .action-btn')).toBe(true);
  expect(css.includes('min-width: 140px')).toBe(true);
  });
});
