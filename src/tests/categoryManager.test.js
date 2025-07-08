// Unit tests for Category Manager functionality
// This file tests the core category management features

import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
  showCategoryManagerModal
} from '../ui/categoryManager.js';
import { AppState } from '../core/appState.js';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Mock showToast function
const mockShowToast = jest.fn();

// Setup before tests
beforeEach(() => {
  // Reset AppState
  AppState.categories = {};
  AppState.transactions = [];

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  // Mock toast notifications
  global.showToast = mockShowToast;
  mockShowToast.mockClear();

  // Clear localStorage
  mockLocalStorage.clear();
});

describe('Category Manager Core Functions', () => {

  describe('addCategory', () => {
    test('should add a new category successfully', () => {
      const result = addCategory('Food & Dining', '#e74c3c');

      expect(result).toBe(true);
      expect(AppState.categories['Food & Dining']).toEqual({
        color: '#e74c3c',
        order: 1,
        subcategories: {}
      });

      // Check localStorage was updated
      const savedCategories = JSON.parse(mockLocalStorage.getItem('categories'));
      expect(savedCategories['Food & Dining']).toBeDefined();
    });

    test('should not add category with empty name', () => {
      const result = addCategory('', '#e74c3c');

      expect(result).toBe(false);
      expect(Object.keys(AppState.categories)).toHaveLength(0);
    });

    test('should not add duplicate category', () => {
      addCategory('Food & Dining', '#e74c3c');
      const result = addCategory('Food & Dining', '#3498db');

      expect(result).toBe(false);
      expect(AppState.categories['Food & Dining'].color).toBe('#e74c3c');
    });

    test('should assign incrementing order numbers', () => {
      addCategory('Category 1', '#e74c3c');
      addCategory('Category 2', '#3498db');
      addCategory('Category 3', '#2ecc71');

      expect(AppState.categories['Category 1'].order).toBe(1);
      expect(AppState.categories['Category 2'].order).toBe(2);
      expect(AppState.categories['Category 3'].order).toBe(3);
    });
  });

  describe('updateCategory', () => {
    beforeEach(() => {
      AppState.categories = {
        'Food & Dining': {
          color: '#e74c3c',
          order: 1,
          subcategories: {}
        }
      };
    });

    test('should update category color', () => {
      const result = updateCategory('Food & Dining', 'Food & Dining', '#3498db');

      expect(result).toBe(true);
      expect(AppState.categories['Food & Dining'].color).toBe('#3498db');
    });

    test('should rename category', () => {
      const result = updateCategory('Food & Dining', 'Restaurants', '#e74c3c');

      expect(result).toBe(true);
      expect(AppState.categories['Restaurants']).toBeDefined();
      expect(AppState.categories['Food & Dining']).toBeUndefined();
    });

    test('should update transactions when category is renamed', () => {
      AppState.transactions = [
        { id: 1, category: 'Food & Dining', amount: -25.00 },
        { id: 2, category: 'Transportation', amount: -15.00 }
      ];

      updateCategory('Food & Dining', 'Restaurants', '#e74c3c');

      expect(AppState.transactions[0].category).toBe('Restaurants');
      expect(AppState.transactions[0].edited).toBe(true);
      expect(AppState.transactions[1].category).toBe('Transportation');
    });

    test('should not rename to existing category name', () => {
      AppState.categories['Transportation'] = { color: '#3498db', order: 2, subcategories: {} };

      const result = updateCategory('Food & Dining', 'Transportation', '#e74c3c');

      expect(result).toBe(false);
      expect(AppState.categories['Food & Dining']).toBeDefined();
    });
  });

  describe('deleteCategory', () => {
    beforeEach(() => {
      AppState.categories = {
        'Food & Dining': {
          color: '#e74c3c',
          order: 1,
          subcategories: {}
        },
        'Transportation': {
          color: '#3498db',
          order: 2,
          subcategories: {}
        }
      };
    });

    test('should delete category successfully', () => {
      const result = deleteCategory('Food & Dining');

      expect(result).toBe(true);
      expect(AppState.categories['Food & Dining']).toBeUndefined();
      expect(AppState.categories['Transportation']).toBeDefined();
    });

    test('should clear category from transactions', () => {
      AppState.transactions = [
        { id: 1, category: 'Food & Dining', amount: -25.00 },
        { id: 2, category: 'Transportation', amount: -15.00 }
      ];

      deleteCategory('Food & Dining');

      expect(AppState.transactions[0].category).toBe('');
      expect(AppState.transactions[1].category).toBe('Transportation');
    });

    test('should return false for non-existent category', () => {
      const result = deleteCategory('Non-existent');

      expect(result).toBe(false);
    });
  });

  describe('addSubcategory', () => {
    beforeEach(() => {
      AppState.categories = {
        'Food & Dining': {
          color: '#e74c3c',
          order: 1,
          subcategories: {}
        }
      };
    });

    test('should add subcategory to existing category', () => {
      const result = addSubcategory('Food & Dining', 'Restaurants', '#ff6b6b');

      expect(result).toBe(true);
      expect(AppState.categories['Food & Dining'].subcategories['Restaurants']).toBe('#ff6b6b');
    });

    test('should not add subcategory with empty name', () => {
      const result = addSubcategory('Food & Dining', '', '#ff6b6b');

      expect(result).toBe(false);
      expect(Object.keys(AppState.categories['Food & Dining'].subcategories)).toHaveLength(0);
    });

    test('should not add duplicate subcategory', () => {
      addSubcategory('Food & Dining', 'Restaurants', '#ff6b6b');
      const result = addSubcategory('Food & Dining', 'Restaurants', '#3498db');

      expect(result).toBe(false);
      expect(AppState.categories['Food & Dining'].subcategories['Restaurants']).toBe('#ff6b6b');
    });

    test('should convert string category to object when adding subcategory', () => {
      AppState.categories['Old Category'] = '#cccccc'; // String format

      const result = addSubcategory('Old Category', 'Sub1', '#ff6b6b');

      expect(result).toBe(true);
      expect(typeof AppState.categories['Old Category']).toBe('object');
      expect(AppState.categories['Old Category'].color).toBe('#cccccc');
      expect(AppState.categories['Old Category'].subcategories['Sub1']).toBe('#ff6b6b');
    });
  });

  describe('deleteSubcategory', () => {
    beforeEach(() => {
      AppState.categories = {
        'Food & Dining': {
          color: '#e74c3c',
          order: 1,
          subcategories: {
            'Restaurants': '#ff6b6b',
            'Groceries': '#4ecdc4'
          }
        }
      };
    });

    test('should delete subcategory successfully', () => {
      const result = deleteSubcategory('Food & Dining', 'Restaurants');

      expect(result).toBe(true);
      expect(AppState.categories['Food & Dining'].subcategories['Restaurants']).toBeUndefined();
      expect(AppState.categories['Food & Dining'].subcategories['Groceries']).toBeDefined();
    });

    test('should not delete non-existent subcategory', () => {
      const result = deleteSubcategory('Food & Dining', 'Non-existent');

      expect(result).toBe(false);
    });

    test('should not delete from non-existent category', () => {
      const result = deleteSubcategory('Non-existent', 'Restaurants');

      expect(result).toBe(false);
    });
  });
});

describe('Category Manager Modal Integration', () => {

  // Mock DOM elements for modal testing
  beforeEach(() => {
    // Setup basic DOM structure
    document.body.innerHTML = `
      <div id="modal-overlay"></div>
      <div id="transaction-table"></div>
      <select class="category-select"></select>
    `;

    // Mock modal functions
    global.showModal = jest.fn().mockReturnValue({
      close: jest.fn(),
      element: document.createElement('div')
    });
  });

  test('should create modal with correct content structure', () => {
    // Add some test categories
    AppState.categories = {
      'Food & Dining': {
        color: '#e74c3c',
        order: 1,
        subcategories: { 'Restaurants': '#ff6b6b' }
      },
      'Transportation': {
        color: '#3498db',
        order: 2,
        subcategories: {}
      }
    };

    showCategoryManagerModal();

    expect(global.showModal).toHaveBeenCalledWith({
      title: 'Category Manager',
      content: expect.any(HTMLElement),
      size: 'large',
      closeOnClickOutside: false
    });
  });

  test('should prevent multiple modal instances', () => {
    const modal1 = showCategoryManagerModal();
    const modal2 = showCategoryManagerModal();

    expect(modal1).toBe(modal2);
    expect(global.showModal).toHaveBeenCalledTimes(1);
  });
});

describe('Category Manager UI Updates', () => {

  beforeEach(() => {
    // Setup DOM with category dropdowns
    document.body.innerHTML = `
      <select data-field="category">
        <option value="">Select Category</option>
        <option value="Food & Dining">Food & Dining</option>
      </select>
      <select class="category-select">
        <option value="">Select Category</option>
        <option value="Food & Dining">Food & Dining</option>
      </select>
      <select id="bulkCategorySelect">
        <option value="">Choose Category</option>
        <option value="Food & Dining">Food & Dining</option>
      </select>
    `;

    AppState.categories = {
      'Food & Dining': {
        color: '#e74c3c',
        order: 1,
        subcategories: {}
      }
    };
  });

  test('should refresh dropdown options when category is added', () => {
    addCategory('Transportation', '#3498db');

    // Check that dropdowns now include the new category
    const categorySelects = document.querySelectorAll('select[data-field="category"], .category-select');
    categorySelects.forEach(select => {
      const options = Array.from(select.options).map(opt => opt.value);
      expect(options).toContain('Transportation');
      expect(options).toContain('Food & Dining');
    });
  });

  test('should maintain selected values when refreshing dropdowns', () => {
    const categorySelect = document.querySelector('select[data-field="category"]');
    categorySelect.value = 'Food & Dining';

    addCategory('Transportation', '#3498db');

    // Selected value should be preserved
    expect(categorySelect.value).toBe('Food & Dining');
  });
});

// Run tests with: npm test categoryManager.test.js
// Or with Jest: jest categoryManager.test.js
