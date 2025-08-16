/**
 * Regression: Category Manager checkbox should not use global .category-select styles
 * and should have compact size without overlapping the color dot.
 */
const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

describe('Category Manager checkbox styling', () => {
  test('uses category-select-checkbox class and CSS contract exists', () => {
    // Verify JS uses the new class
    const file = path.resolve(__dirname, '..', 'ui', 'categoryManagerModal.js');
    const js = fs.readFileSync(file, 'utf8');
  expect(js).toMatch(/class="category-select-checkbox"/);

    // Verify CSS targets checkbox sizing in manager and not generic .category-select
    const cssFile = path.resolve(__dirname, '..', 'styles', 'category-manager.css');
    const css = fs.readFileSync(cssFile, 'utf8');
    expect(css).toMatch(/\.category-checkbox\s*\{[^}]*width:\s*20px/);
    expect(css).toMatch(/\.category-checkbox\s*input\[type="checkbox"\]/);
  });
});
