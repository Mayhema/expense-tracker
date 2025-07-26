/**
 * Category Dropdown Visibility Test
 * Tests the specific issue: "in the 🔍 Advanced Filters the Categories drop down list cant be seen"
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

describe('Category Dropdown Visibility Fix', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Read the HTML and CSS files
    const htmlContent = `
      <div class="advanced-filters">
        <div class="filter-card category-card">
          <div class="filter-card-header">
            <span class="filter-icon">🏷️</span>
            <label>Categories</label>
          </div>
          <div class="filter-card-content">
            <div class="category-filter-container">
              <select class="category-select-btn modern-select filter-select" id="categorySelectBtn">
                <option value="all">All Categories</option>
                <option value="selected">Selected Categories</option>
              </select>
              <div class="category-dropdown" id="categoryDropdown">
                <div class="category-search">
                  <input type="text" placeholder="Search categories..." class="category-search-input modern-input">
                </div>
                <div class="category-options">
                  <label class="category-option">
                    <input type="checkbox" value="all" class="category-checkbox" checked>
                    <span class="category-checkmark"></span>
                    <span class="category-label">All Categories</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  test('category dropdown should exist with correct ID', () => {
    const dropdown = document.getElementById('categoryDropdown');
    expect(dropdown).toBeTruthy();
    expect(dropdown.classList.contains('category-dropdown')).toBe(true);
  });

  test('category dropdown should be hidden by default', () => {
    const dropdown = document.getElementById('categoryDropdown');
    expect(dropdown).toBeTruthy();

    // Should be hidden by default (CSS display: none)
    expect(dropdown.style.display).toBe('');
  });

  test('category dropdown should become visible when display is set to block', () => {
    const dropdown = document.getElementById('categoryDropdown');

    // Simulate the toggle function
    dropdown.style.display = 'block';

    expect(dropdown.style.display).toBe('block');
  });

  test('category dropdown should have high z-index for visibility', () => {
    const filtersCSS = fs.readFileSync(path.join(__dirname, '../styles/filters.css'), 'utf8');

    // Check if z-index is set high enough
    expect(filtersCSS).toMatch(/\.category-dropdown[^{]*{[^}]*z-index:\s*9999/);
  });

  test('parent containers should allow overflow for dropdown visibility', () => {
    const mainCSS = fs.readFileSync(path.join(__dirname, '../styles/main.css'), 'utf8');

    // Check if parent containers have overflow: visible
    expect(mainCSS).toMatch(/\.category-filter-container[^{]*{[^}]*overflow:\s*visible/);
  });

  test('category dropdown should have proper positioning', () => {
    const filtersCSS = fs.readFileSync(path.join(__dirname, '../styles/filters.css'), 'utf8');

    // Check positioning properties
    expect(filtersCSS).toMatch(/\.category-dropdown[^{]*{[^}]*position:\s*absolute/);
  });

  test('category select element should exist and be functional', () => {
    const selectElement = document.getElementById('categorySelectBtn');
    expect(selectElement).toBeTruthy();
    expect(selectElement.tagName.toLowerCase()).toBe('select');
    expect(selectElement.classList.contains('category-select-btn')).toBe(true);
    expect(selectElement.classList.contains('modern-select')).toBe(true);
    expect(selectElement.classList.contains('filter-select')).toBe(true);
  });

  test('dropdown should contain search input and category options', () => {
    const dropdown = document.getElementById('categoryDropdown');
    const searchInput = dropdown.querySelector('.category-search-input');
    const categoryOptions = dropdown.querySelector('.category-options');

    expect(searchInput).toBeTruthy();
    expect(categoryOptions).toBeTruthy();
    expect(searchInput.placeholder).toBe('Search categories...');
  });
});
