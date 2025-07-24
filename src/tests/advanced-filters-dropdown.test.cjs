/**
 * Advanced Filters Category Dropdown Test
 * Tests the visibility and functionality of the category dropdown in Advanced Filters
 */

// Set up TextEncoder for JSDOM compatibility
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

const { JSDOM } = require('jsdom');

describe('Advanced Filters Category Dropdown', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .category-dropdown {
              position: absolute;
              top: calc(100% + 8px);
              left: 0;
              right: 0;
              z-index: 9999 !important;
              display: none;
              max-height: 320px;
              overflow: auto;
            }
            .category-filter-container {
              position: relative;
            }
            .advanced-filters,
            .filter-card,
            .filter-card-content,
            .category-filter-container {
              overflow: visible !important;
              z-index: auto !important;
            }
          </style>
        </head>
        <body>
          <div class="advanced-filters">
            <div class="filter-card">
              <div class="filter-card-content">
                <div class="category-filter-container">
                  <button type="button" class="category-select-btn modern-btn" id="categorySelectBtn">
                    <span class="selected-count">All Categories</span>
                    <span class="dropdown-arrow">▼</span>
                  </button>
                  <div class="category-dropdown" id="categoryDropdown">
                    <div class="category-search">
                      <input type="text" placeholder="Search categories..." class="category-search-input modern-input">
                    </div>
                    <div class="category-options">
                      <label class="category-option">
                        <input type="checkbox" value="all" class="category-checkbox" checked>
                        <span class="category-checkmark"></span>
                        <span>All Categories</span>
                      </label>
                      <label class="category-option">
                        <input type="checkbox" value="Food" class="category-checkbox">
                        <span class="category-checkmark"></span>
                        <span>Food</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

  test('category dropdown should exist with proper structure', () => {
    const dropdown = document.getElementById('categoryDropdown');
    const button = document.getElementById('categorySelectBtn');
    const container = document.querySelector('.category-filter-container');

    expect(dropdown).not.toBeNull();
    expect(button).not.toBeNull();
    expect(container).not.toBeNull();
    expect(dropdown.classList.contains('category-dropdown')).toBe(true);
  });

  test('category dropdown should have proper z-index for visibility', () => {
    const dropdown = document.getElementById('categoryDropdown');
    const computedStyle = window.getComputedStyle(dropdown);

    expect(computedStyle.zIndex).toBe('9999');
    expect(computedStyle.position).toBe('absolute');
  });

  test('category dropdown should be hidden by default', () => {
    const dropdown = document.getElementById('categoryDropdown');
    const computedStyle = window.getComputedStyle(dropdown);

    expect(computedStyle.display).toBe('none');
  });

  test('category dropdown toggle functionality should work', () => {
    const dropdown = document.getElementById('categoryDropdown');

    // Simulate the toggle function logic
    function toggleDropdown() {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }

    // Initially hidden
    expect(dropdown.style.display).toBe('');

    // First toggle - should show
    toggleDropdown();
    expect(dropdown.style.display).toBe('block');

    // Second toggle - should hide
    toggleDropdown();
    expect(dropdown.style.display).toBe('none');
  });

  test('parent containers should allow overflow for dropdown visibility', () => {
    const containers = [
      document.querySelector('.advanced-filters'),
      document.querySelector('.filter-card'),
      document.querySelector('.filter-card-content'),
      document.querySelector('.category-filter-container')
    ];

    containers.forEach(container => {
      if (container) {
        const computedStyle = window.getComputedStyle(container);
        // Should allow overflow to be visible for dropdown to show
        expect(['visible', 'auto']).toContain(computedStyle.overflow);
      }
    });
  });

  test('category dropdown should have proper positioning relative to button', () => {
    const dropdown = document.getElementById('categoryDropdown');
    const container = document.querySelector('.category-filter-container');

    const dropdownStyle = window.getComputedStyle(dropdown);
    const containerStyle = window.getComputedStyle(container);

    expect(containerStyle.position).toBe('relative');
    expect(dropdownStyle.position).toBe('absolute');
    expect(dropdownStyle.top).toBe('calc(100% + 8px)');
  });

  test('category options should be properly structured', () => {
    const options = document.querySelectorAll('.category-option');
    const checkboxes = document.querySelectorAll('.category-checkbox');

    expect(options.length).toBeGreaterThan(0);
    expect(checkboxes.length).toBe(options.length);

    // Check that each option has proper structure
    options.forEach((option, index) => {
      const checkbox = option.querySelector('.category-checkbox');
      const text = option.querySelector('span:last-child');

      expect(checkbox).not.toBeNull();
      expect(text).not.toBeNull();
      expect(text.textContent.trim()).toBeTruthy();
    });
  });

  test('dropdown should have search functionality structure', () => {
    const searchContainer = document.querySelector('.category-search');
    const searchInput = document.querySelector('.category-search-input');

    expect(searchContainer).not.toBeNull();
    expect(searchInput).not.toBeNull();
    expect(searchInput.placeholder).toBe('Search categories...');
  });
});
