// Jest setup file for Category Manager tests
// This file runs before each test to set up the testing environment

// Mock DOM environment
import 'jest-environment-jsdom';

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock browser APIs that might not be available in Node.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock common UI functions
global.showToast = jest.fn();
global.showModal = jest.fn().mockReturnValue({
  close: jest.fn(),
  element: document.createElement('div')
});

// Mock import statements for dynamic imports
global.importMock = (modulePath) => {
  return Promise.resolve({
    showToast: global.showToast,
    renderTransactions: jest.fn(),
    refreshAdvancedFilters: jest.fn()
  });
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
  localStorageMock.clear();
});

console.log('Jest setup complete for Category Manager tests');
