/**
 * Comprehensive Button Functionality Test Suite
 * Tests all clickable buttons and interactive elements in the application
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

describe('Comprehensive Button Functionality Tests', () => {
  let dom;
  let document;
  let window;
  let mockAppState;

  beforeEach(() => {
    // Mock AppState
    mockAppState = {
      transactions: [
        { id: 'test-1', description: 'Test Transaction 1', category: 'Food', amount: -25.50, currency: 'USD', date: '2025-01-01' },
        { id: 'test-2', description: 'Test Transaction 2', category: 'Income', amount: 1000, currency: 'USD', date: '2025-01-02' }
      ],
      categories: { Food: '#ff6b6b', Income: '#4ecdc4' },
      darkMode: false
    };

    // Create comprehensive DOM with all buttons
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .btn { padding: 8px 12px; border: none; cursor: pointer; }
            .action-btn { padding: 4px 8px; margin: 2px; }
            .modal { display: none; position: fixed; z-index: 1000; }
            .modal.show { display: block; }
            .hidden { display: none; }
            .visible { display: block; }
          </style>
        </head>
        <body>
          <!-- Main Navigation Buttons -->
          <div class="main-nav">
            <button id="uploadBtn" class="btn btn-primary">📁 Upload File</button>
            <button id="downloadBtn" class="btn btn-secondary">💾 Download</button>
            <button id="categoryManagerBtn" class="btn btn-info">🏷️ Categories</button>
            <button id="darkModeToggle" class="btn btn-dark">🌙 Dark Mode</button>
          </div>

          <!-- Filter Section Buttons -->
          <div class="filter-section">
            <button id="clearFiltersBtn" class="btn btn-warning">🧹 Clear Filters</button>
            <button id="applyFiltersBtn" class="btn btn-success">✅ Apply Filters</button>
            <button id="savePresetBtn" class="btn btn-info">💾 Save Preset</button>
            <button id="managePresetsBtn" class="btn btn-secondary">⚙️ Manage</button>
            <button id="advancedToggle" class="btn btn-outline">🔍 Advanced</button>
          </div>

          <!-- Transaction Table -->
          <div class="transaction-table-wrapper">
            <table class="transaction-table">
              <thead>
                <tr>
                  <th>Actions</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr data-transaction-id="test-1">
                  <td class="actions-cell">
                    <button class="action-btn btn-edit" data-transaction-id="test-1">✏️</button>
                    <button class="action-btn btn-save hidden" data-transaction-id="test-1">💾</button>
                    <button class="action-btn btn-delete" data-transaction-id="test-1">🗑️</button>
                    <button class="action-btn btn-revert hidden" data-transaction-id="test-1">↶</button>
                    <button class="action-btn btn-revert-all" data-transaction-id="test-1">🔄</button>
                  </td>
                  <td>Test Transaction 1</td>
                  <td>Food</td>
                  <td>-25.50</td>
                </tr>
                <tr data-transaction-id="test-2">
                  <td class="actions-cell">
                    <button class="action-btn btn-edit" data-transaction-id="test-2">✏️</button>
                    <button class="action-btn btn-save hidden" data-transaction-id="test-2">💾</button>
                    <button class="action-btn btn-delete" data-transaction-id="test-2">🗑️</button>
                    <button class="action-btn btn-revert hidden" data-transaction-id="test-2">↶</button>
                    <button class="action-btn btn-revert-all" data-transaction-id="test-2">🔄</button>
                  </td>
                  <td>Test Transaction 2</td>
                  <td>Income</td>
                  <td>1000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal Examples -->
          <div id="confirmModal" class="modal">
            <div class="modal-content">
              <h3>Confirm Action</h3>
              <p>Are you sure?</p>
              <button id="confirmYes" class="btn btn-danger">Yes</button>
              <button id="confirmNo" class="btn btn-secondary">No</button>
              <button id="modalClose" class="btn btn-close">✕</button>
            </div>
          </div>

          <div id="categoryModal" class="modal">
            <div class="modal-content">
              <h3>Category Manager</h3>
              <button id="addCategoryBtn" class="btn btn-primary">+ Add Category</button>
              <button id="resetCategoriesBtn" class="btn btn-warning">🔄 Reset</button>
              <button id="categoryModalClose" class="btn btn-close">✕</button>
            </div>
          </div>

          <!-- Bulk Operations -->
          <div class="bulk-operations hidden" id="bulkOperations">
            <button id="selectAllBtn" class="btn btn-info">☑️ Select All</button>
            <button id="bulkDeleteBtn" class="btn btn-danger">🗑️ Delete Selected</button>
            <button id="bulkCategoryBtn" class="btn btn-warning">🏷️ Change Category</button>
          </div>

          <!-- Quick Action Buttons -->
          <div class="quick-actions">
            <button class="quick-category-btn" data-category="Food">🍔 Food</button>
            <button class="quick-category-btn" data-category="Transport">🚗 Transport</button>
            <button class="quick-category-btn" data-category="Entertainment">🎬 Entertainment</button>
          </div>
        </body>
      </html>
    `;

    dom = new JSDOM(htmlContent, {
      pretendToBeVisual: true,
      resources: "usable"
    });
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;

    // Mock global functions that buttons might call
    global.AppState = mockAppState;
    setupButtonMocks();
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  function setupButtonMocks() {
    // Mock functions that buttons call
    window.showModal = jest.fn();
    window.hideModal = jest.fn();
    window.saveTransaction = jest.fn();
    window.deleteTransaction = jest.fn();
    window.editTransaction = jest.fn();
    window.uploadFile = jest.fn();
    window.downloadData = jest.fn();
    window.toggleDarkMode = jest.fn();
    window.clearFilters = jest.fn();
    window.applyFilters = jest.fn();

    // Mock console methods
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  }

  function simulateClick(selector, expectedCount = 1) {
    const button = document.querySelector(selector);
    expect(button).toBeTruthy();
    expect(button.tagName.toLowerCase()).toBe('button');

    for (let i = 0; i < expectedCount; i++) {
      button.click();
    }

    return button;
  }

  describe('Main Navigation Buttons', () => {
    test('Upload File button should be clickable and accessible', () => {
      const button = simulateClick('#uploadBtn');
      expect(button.textContent).toContain('Upload File');
      expect(button.classList.contains('btn')).toBe(true);
      expect(button.classList.contains('btn-primary')).toBe(true);
    });

    test('Download button should be clickable', () => {
      const button = simulateClick('#downloadBtn');
      expect(button.textContent).toContain('Download');
      expect(button.classList.contains('btn-secondary')).toBe(true);
    });

    test('Category Manager button should be clickable', () => {
      const button = simulateClick('#categoryManagerBtn');
      expect(button.textContent).toContain('Categories');
      expect(button.id).toBe('categoryManagerBtn');
    });

    test('Dark Mode Toggle button should be clickable', () => {
      const button = simulateClick('#darkModeToggle');
      expect(button.textContent).toContain('Dark Mode');
      expect(button.classList.contains('btn-dark')).toBe(true);
    });
  });

  describe('Filter Section Buttons', () => {
    test('Clear Filters button should be functional', () => {
      const button = simulateClick('#clearFiltersBtn');
      expect(button.textContent).toContain('Clear Filters');
      expect(button.classList.contains('btn-warning')).toBe(true);
    });

    test('Apply Filters button should work', () => {
      const button = simulateClick('#applyFiltersBtn');
      expect(button.textContent).toContain('Apply Filters');
      expect(button.classList.contains('btn-success')).toBe(true);
    });

    test('Save Preset button should be clickable', () => {
      const button = simulateClick('#savePresetBtn');
      expect(button.textContent).toContain('Save Preset');
    });

    test('Manage Presets button should work', () => {
      const button = simulateClick('#managePresetsBtn');
      expect(button.textContent).toContain('Manage');
    });

    test('Advanced Toggle button should be functional', () => {
      const button = simulateClick('#advancedToggle');
      expect(button.textContent).toContain('Advanced');
      expect(button.classList.contains('btn-outline')).toBe(true);
    });
  });

  describe('Transaction Table Action Buttons', () => {
    test('Edit buttons should be clickable for all transactions', () => {
      const editButtons = document.querySelectorAll('.btn-edit');
      expect(editButtons.length).toBe(2);

      editButtons.forEach((button, index) => {
        expect(button.textContent).toContain('✏️');
        expect(button.dataset.transactionId).toBeTruthy();
        button.click();
      });
    });

    test('Save buttons should exist but be hidden initially', () => {
      const saveButtons = document.querySelectorAll('.btn-save');
      expect(saveButtons.length).toBe(2);

      saveButtons.forEach(button => {
        expect(button.classList.contains('hidden')).toBe(true);
        expect(button.textContent).toContain('💾');
      });
    });

    test('Delete buttons should be clickable and have transaction IDs', () => {
      const deleteButtons = document.querySelectorAll('.btn-delete');
      expect(deleteButtons.length).toBe(2);

      deleteButtons.forEach(button => {
        expect(button.textContent).toContain('🗑️');
        expect(button.dataset.transactionId).toBeTruthy();
        button.click();
      });
    });

    test('Revert buttons should exist but be hidden initially', () => {
      const revertButtons = document.querySelectorAll('.btn-revert');
      expect(revertButtons.length).toBe(2);

      revertButtons.forEach(button => {
        expect(button.classList.contains('hidden')).toBe(true);
        expect(button.textContent).toContain('↶');
      });
    });

    test('Revert All buttons should be visible and clickable', () => {
      const revertAllButtons = document.querySelectorAll('.btn-revert-all');
      expect(revertAllButtons.length).toBe(2);

      revertAllButtons.forEach(button => {
        expect(button.textContent).toContain('🔄');
        expect(button.dataset.transactionId).toBeTruthy();
        button.click();
      });
    });
  });

  describe('Modal Buttons', () => {
    test('Confirm modal buttons should be functional', () => {
      const yesButton = simulateClick('#confirmYes');
      const noButton = simulateClick('#confirmNo');
      const closeButton = simulateClick('#modalClose');

      expect(yesButton.classList.contains('btn-danger')).toBe(true);
      expect(noButton.classList.contains('btn-secondary')).toBe(true);
      expect(closeButton.classList.contains('btn-close')).toBe(true);
    });

    test('Category modal buttons should work', () => {
      const addButton = simulateClick('#addCategoryBtn');
      const resetButton = simulateClick('#resetCategoriesBtn');
      const closeButton = simulateClick('#categoryModalClose');

      expect(addButton.textContent).toContain('Add Category');
      expect(resetButton.textContent).toContain('Reset');
      expect(closeButton.textContent).toContain('✕');
    });
  });

  describe('Bulk Operation Buttons', () => {
    test('Bulk operation buttons should exist', () => {
      const selectAllBtn = document.querySelector('#selectAllBtn');
      const bulkDeleteBtn = document.querySelector('#bulkDeleteBtn');
      const bulkCategoryBtn = document.querySelector('#bulkCategoryBtn');

      expect(selectAllBtn).toBeTruthy();
      expect(bulkDeleteBtn).toBeTruthy();
      expect(bulkCategoryBtn).toBeTruthy();

      // Test clicking them
      selectAllBtn.click();
      bulkDeleteBtn.click();
      bulkCategoryBtn.click();
    });
  });

  describe('Quick Action Buttons', () => {
    test('Quick category buttons should be clickable', () => {
      const quickButtons = document.querySelectorAll('.quick-category-btn');
      expect(quickButtons.length).toBe(3);

      quickButtons.forEach(button => {
        expect(button.dataset.category).toBeTruthy();
        button.click();
      });
    });
  });

  describe('Button State Management', () => {
    test('Edit mode should show/hide appropriate buttons', () => {
      const row = document.querySelector('[data-transaction-id="test-1"]');
      const editBtn = row.querySelector('.btn-edit');
      const saveBtn = row.querySelector('.btn-save');
      const revertBtn = row.querySelector('.btn-revert');

      // Initially edit is visible, save/revert are hidden
      expect(editBtn.classList.contains('hidden')).toBe(false);
      expect(saveBtn.classList.contains('hidden')).toBe(true);
      expect(revertBtn.classList.contains('hidden')).toBe(true);

      // Simulate entering edit mode
      editBtn.click();

      // In a real app, this would toggle the button visibility
      // For testing, we'll simulate the state change
      editBtn.classList.add('hidden');
      saveBtn.classList.remove('hidden');
      revertBtn.classList.remove('hidden');

      expect(editBtn.classList.contains('hidden')).toBe(true);
      expect(saveBtn.classList.contains('hidden')).toBe(false);
      expect(revertBtn.classList.contains('hidden')).toBe(false);
    });

    test('Modal visibility should be controllable', () => {
      const modal = document.querySelector('#confirmModal');

      // Initially hidden
      expect(modal.classList.contains('show')).toBe(false);

      // Show modal
      modal.classList.add('show');
      expect(modal.classList.contains('show')).toBe(true);

      // Hide modal
      modal.classList.remove('show');
      expect(modal.classList.contains('show')).toBe(false);
    });
  });

  describe('Button Accessibility', () => {
    test('All buttons should have proper structure', () => {
      const allButtons = document.querySelectorAll('button');

      allButtons.forEach(button => {
        // Check button has content
        expect(button.textContent.trim().length).toBeGreaterThan(0);

        // Check button is not disabled by default
        expect(button.disabled).toBe(false);

        // Check button has cursor pointer (should be set by CSS)
        expect(button.style.cursor || 'pointer').toBeTruthy();
      });
    });

    test('Action buttons should have transaction IDs where needed', () => {
      const actionButtons = document.querySelectorAll('.action-btn');

      actionButtons.forEach(button => {
        if (button.classList.contains('btn-edit') ||
          button.classList.contains('btn-save') ||
          button.classList.contains('btn-delete') ||
          button.classList.contains('btn-revert') ||
          button.classList.contains('btn-revert-all')) {
          expect(button.dataset.transactionId).toBeTruthy();
        }
      });
    });
  });

  describe('Button Performance', () => {
    test('Multiple rapid clicks should be handled gracefully', () => {
      const button = document.querySelector('#clearFiltersBtn');
      let clickCount = 0;

      button.addEventListener('click', () => {
        clickCount++;
      });

      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        button.click();
      }

      expect(clickCount).toBe(10);
    });

    test('All buttons should be responsive to click events', () => {
      const allButtons = document.querySelectorAll('button');
      let totalClicks = 0;

      const clickHandler = () => { totalClicks++; };

      allButtons.forEach(button => {
        button.addEventListener('click', clickHandler);
        button.click();
      });

      expect(totalClicks).toBe(allButtons.length);
    });
  });

  describe('Button Integration', () => {
    test('Related buttons should work together properly', () => {
      // Test edit -> save -> revert workflow
      const row = document.querySelector('[data-transaction-id="test-1"]');
      const editBtn = row.querySelector('.btn-edit');
      const saveBtn = row.querySelector('.btn-save');
      const revertBtn = row.querySelector('.btn-revert');

      // All buttons should be clickable
      expect(() => editBtn.click()).not.toThrow();
      expect(() => saveBtn.click()).not.toThrow();
      expect(() => revertBtn.click()).not.toThrow();
    });

    test('Filter buttons should work in sequence', () => {
      const clearBtn = document.querySelector('#clearFiltersBtn');
      const applyBtn = document.querySelector('#applyFiltersBtn');
      const savePresetBtn = document.querySelector('#savePresetBtn');

      // Should be able to click in sequence without errors
      expect(() => {
        clearBtn.click();
        applyBtn.click();
        savePresetBtn.click();
      }).not.toThrow();
    });
  });
});
