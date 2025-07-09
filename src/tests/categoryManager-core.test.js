// Unit tests for Category Manager functionality
// This file tests the core category management features

import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory
} from '../ui/categoryManager.js';
import { AppState } from '../core/appState.js';

// Mock DOM environment
globalThis.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    appendChild: () => { },
    setAttribute: () => { },
    style: {}
  }),
  getElementById: () => null
};

globalThis.window = {
  localStorage: (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })()
};

// Mock showToast function
globalThis.showToast = () => { };

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function test(description, testFunction) {
  try {
    testFunction();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    testsFailed++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain: (substring) => {
      if (!actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${actual}`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected falsy value, got ${actual}`);
      }
    }
  };
}

// Setup before each test
function setupTest() {
  // Reset AppState
  AppState.categories = {};
  AppState.transactions = [];

  // Mock localStorage is already set up globally
  globalThis.localStorage = globalThis.window.localStorage;

  // Clear localStorage
  globalThis.window.localStorage.clear();
}

console.log('🧪 CATEGORY MANAGER CORE FUNCTIONS TEST');
console.log('========================================');

// Test addCategory function
test('addCategory - should add a new category', () => {
  setupTest();
  const result = addCategory('Test Category', '#ff0000');
  expect(result).toBe(true);
  expect(AppState.categories['Test Category']).toBeTruthy();
});

test('addCategory - should not add empty category', () => {
  setupTest();
  const result = addCategory('', '#ff0000');
  expect(result).toBe(false);
});

test('addCategory - should not add duplicate category', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  const result = addCategory('Test Category', '#00ff00');
  expect(result).toBe(false);
});

// Test updateCategory function
test('updateCategory - should update existing category', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  const result = updateCategory('Test Category', 'Updated Category', '#00ff00');
  expect(result).toBe(true);
  expect(AppState.categories['Updated Category']).toBeTruthy();
});

test('updateCategory - should not update non-existent category', () => {
  setupTest();
  const result = updateCategory('Non-existent', 'Updated', '#00ff00');
  expect(result).toBe(false);
});

// Test deleteCategory function
test('deleteCategory - should delete existing category', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  const result = deleteCategory('Test Category');
  expect(result).toBe(true);
  expect(AppState.categories['Test Category']).toBeFalsy();
});

test('deleteCategory - should not delete non-existent category', () => {
  setupTest();
  const result = deleteCategory('Non-existent');
  expect(result).toBe(false);
});

// Test addSubcategory function
test('addSubcategory - should add subcategory to existing category', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  const result = addSubcategory('Test Category', 'Test Subcategory', '#00ff00');
  expect(result).toBe(true);
  expect(AppState.categories['Test Category'].subcategories['Test Subcategory']).toBeTruthy();
});

test('addSubcategory - should not add subcategory to non-existent category', () => {
  setupTest();
  const result = addSubcategory('Non-existent', 'Test Subcategory', '#00ff00');
  expect(result).toBe(false);
});

// Test deleteSubcategory function
test('deleteSubcategory - should delete existing subcategory', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  addSubcategory('Test Category', 'Test Subcategory', '#00ff00');
  const result = deleteSubcategory('Test Category', 'Test Subcategory');
  expect(result).toBe(true);
  expect(AppState.categories['Test Category'].subcategories['Test Subcategory']).toBeFalsy();
});

test('deleteSubcategory - should not delete non-existent subcategory', () => {
  setupTest();
  addCategory('Test Category', '#ff0000');
  const result = deleteSubcategory('Test Category', 'Non-existent');
  expect(result).toBe(false);
});

// Print results
console.log('\n📊 TEST RESULTS');
console.log('===============');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n💥 SOME TESTS FAILED!');
  process.exit(1);
}
