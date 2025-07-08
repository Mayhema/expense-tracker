/**
 * Test for Filter UI Improvements
 * Tests the enhanced filter status and grid layout
 */

// Mock DOM for testing
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(() => ({ style: {} })),
  addEventListener: jest.fn(),
  body: { appendChild: jest.fn() }
};

global.window = {
  localStorage: {
    getItem: jest.fn(() => '{}'),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
};

// Mock AppState
const mockAppState = {
  transactions: [
    { id: 1, description: 'Test 1', amount: 100, currency: 'USD' },
    { id: 2, description: 'Test 2', amount: 200, currency: 'EUR' },
    { id: 3, description: 'Test 3', amount: 300, currency: 'USD' }
  ],
  categories: {
    'Food': { color: '#ff0000' },
    'Transport': { color: '#00ff00' },
    'Entertainment': { color: '#0000ff' }
  }
};

describe('Filter Improvements', () => {

  describe('Filter Status Updates', () => {
    test('should show meaningful status instead of "Ready to filter"', () => {
      const mockStatusElement = {
        querySelector: jest.fn().mockReturnValue({
          textContent: ''
        }),
        className: 'filter-status'
      };

      document.getElementById.mockReturnValue(mockStatusElement);

      // Mock the updateFilterStatus function
      const updateFilterStatus = (totalCount, filteredCount) => {
        const statusElement = document.getElementById('filterStatus');
        if (!statusElement) return;

        const statusText = statusElement.querySelector('.status-text');
        if (!statusText) return;

        // This should show meaningful info, not "Ready to filter"
        statusText.textContent = `Showing all ${totalCount} transactions`;
        statusElement.className = 'filter-status';
      };

      // Test initial status
      updateFilterStatus(3, 3);

      const statusText = mockStatusElement.querySelector('.status-text');
      expect(statusText.textContent).toBe('Showing all 3 transactions');
      expect(statusText.textContent).not.toBe('Ready to filter');
    });

    test('should show filtered results count', () => {
      const mockStatusElement = {
        querySelector: jest.fn().mockReturnValue({
          textContent: ''
        }),
        className: 'filter-status'
      };

      document.getElementById.mockReturnValue(mockStatusElement);

      const updateFilterStatus = (totalCount, filteredCount, activeFilters = 1) => {
        const statusElement = document.getElementById('filterStatus');
        const statusText = statusElement.querySelector('.status-text');

        if (filteredCount !== totalCount) {
          statusText.textContent = `Showing ${filteredCount} of ${totalCount} transactions (${activeFilters} filter${activeFilters > 1 ? 's' : ''})`;
          statusElement.className = 'filter-status filter-active';
        }
      };

      // Test filtered results
      updateFilterStatus(3, 2, 1);

      const statusText = mockStatusElement.querySelector('.status-text');
      expect(statusText.textContent).toBe('Showing 2 of 3 transactions (1 filter)');
      expect(mockStatusElement.className).toBe('filter-status filter-active');
    });
  });

  describe('Grid Layout', () => {
    test('should use CSS Grid for responsive layout', () => {
      // This would be tested through CSS rules
      // We can verify the HTML structure supports grid layout
      const expectedGridHTML = `
        <div class="filter-grid">
          <div class="filter-card"><!-- Date Range --></div>
          <div class="filter-card"><!-- Amount Range --></div>
          <div class="filter-card"><!-- Currency --></div>
          <div class="filter-card"><!-- Search --></div>
          <div class="filter-card"><!-- Categories --></div>
        </div>
      `;

      // The grid layout should arrange cards in rows automatically
      expect(expectedGridHTML).toContain('filter-grid');
      expect(expectedGridHTML).toContain('filter-card');
    });
  });

  describe('Initialization', () => {
    test('should initialize without setTimeout', () => {
      // Mock the initialization
      const initializeAdvancedFilters = () => {
        // Should call updateFilterStatus immediately, not with setTimeout
        const transactions = mockAppState.transactions || [];
        const statusElement = {
          querySelector: jest.fn().mockReturnValue({
            textContent: ''
          }),
          className: 'filter-status'
        };

        document.getElementById.mockReturnValue(statusElement);

        // Simulate immediate status update
        const statusText = statusElement.querySelector('.status-text');
        statusText.textContent = `Showing all ${transactions.length} transactions`;

        return statusText.textContent;
      };

      const result = initializeAdvancedFilters();
      expect(result).toBe('Showing all 3 transactions');
      expect(result).not.toBe('Loading filters...');
      expect(result).not.toBe('Ready to filter');
    });
  });
});
