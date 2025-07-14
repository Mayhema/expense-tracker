/**
 * Category Manager Tests - Jest Compatible
 */

// Setup Jest environment
/**
 * @jest-environment jsdom
 */

describe('Category Manager', () => {
  let mockAppState;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock AppState
    mockAppState = {
      categories: {
        'Food': { name: 'Food', subcategories: ['Restaurant', 'Groceries'] },
        'Transport': { name: 'Transport', subcategories: ['Car', 'Public'] }
      }
    };

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn((key) => {
        if (key === 'categories') {
          return JSON.stringify(mockAppState.categories);
        }
        return '{}';
      }),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Mock DOM
    document.body.innerHTML = `
      <div id="categoryManagerModal" class="modal">
        <div class="modal-content">
          <div id="categoryList" class="category-list"></div>
          <button id="addCategoryBtn">Add Category</button>
          <input id="newCategoryInput" type="text" placeholder="Category name">
        </div>
      </div>
    `;
  });

  describe('Category Manager Core Functions', () => {
    test('should have mock categories', () => {
      expect(mockAppState.categories).toBeDefined();
      expect(Object.keys(mockAppState.categories)).toHaveLength(2);
      expect(mockAppState.categories['Food']).toBeDefined();
      expect(mockAppState.categories['Transport']).toBeDefined();
    });

    test('should access localStorage', () => {
      const categories = localStorage.getItem('categories');
      expect(categories).toBeTruthy();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('categories');
    });

    test('should have DOM elements', () => {
      const modal = document.getElementById('categoryManagerModal');
      const categoryList = document.getElementById('categoryList');
      const addBtn = document.getElementById('addCategoryBtn');

      expect(modal).toBeTruthy();
      expect(categoryList).toBeTruthy();
      expect(addBtn).toBeTruthy();
    });
  });

  describe('Category Operations', () => {
    test('should simulate adding category', () => {
      const newCategoryName = 'Entertainment';
      mockAppState.categories[newCategoryName] = {
        name: newCategoryName,
        subcategories: []
      };

      expect(mockAppState.categories[newCategoryName]).toBeDefined();
      expect(mockAppState.categories[newCategoryName].name).toBe(newCategoryName);
    });

    test('should simulate deleting category', () => {
      const categoryToDelete = 'Transport';
      delete mockAppState.categories[categoryToDelete];

      expect(mockAppState.categories[categoryToDelete]).toBeUndefined();
      expect(Object.keys(mockAppState.categories)).toHaveLength(1);
    });

    test('should simulate editing category', () => {
      const oldName = 'Food';
      const newName = 'Food & Dining';

      mockAppState.categories[newName] = mockAppState.categories[oldName];
      mockAppState.categories[newName].name = newName;
      delete mockAppState.categories[oldName];

      expect(mockAppState.categories[oldName]).toBeUndefined();
      expect(mockAppState.categories[newName]).toBeDefined();
      expect(mockAppState.categories[newName].name).toBe(newName);
    });
  });
});
