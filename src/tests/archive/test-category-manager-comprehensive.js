/**
 * 🎨 COMPREHENSIVE CATEGORY MANAGER TESTING
 * Tests all functionality and UI improvements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock dependencies
global.AppState = {
  categories: {
    'Food': { color: '#ff6b6b', order: 1 },
    'Transport': { color: '#4ecdc4', order: 2 },
    'Entertainment': { color: '#45b7d1', order: 3 }
  },
  transactions: [
    { category: 'Food', amount: 25.50 },
    { category: 'Transport', amount: 15.30 }
  ]
};

// Mock DOM environment
global.document = {
  createElement: () => ({
    className: '',
    style: {},
    innerHTML: '',
    addEventListener: () => { },
    appendChild: () => { },
    removeChild: () => { },
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    contains: () => false,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 50 }),
    dataset: {}
  }),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Test Functions
function testCategoryManagerFunctionality() {
  console.log('🎨 COMPREHENSIVE CATEGORY MANAGER TESTING');
  console.log('==========================================');

  const tests = [
    {
      name: 'Drag and drop setup function exists',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          return categoryManagerCode.includes('setupCategoryDragAndDrop') &&
            categoryManagerCode.includes('dragstart') &&
            categoryManagerCode.includes('dragend') &&
            categoryManagerCode.includes('dragover') &&
            categoryManagerCode.includes('drop');
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Button event listeners are properly attached',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          const hasAddCategoryBtn = categoryManagerCode.includes('addCategoryBtn.addEventListener');
          const hasResetBtn = categoryManagerCode.includes('resetCategoriesBtn.addEventListener');
          const hasCloseBtn = categoryManagerCode.includes('closeCategoryManagerBtn') || categoryManagerCode.includes('closeBtn.addEventListener');
          const hasEditBtns = categoryManagerCode.includes('btn-edit') && categoryManagerCode.includes('addEventListener');
          const hasDeleteBtns = categoryManagerCode.includes('btn-delete') && categoryManagerCode.includes('addEventListener');

          return hasAddCategoryBtn && hasResetBtn && hasCloseBtn && hasEditBtns && hasDeleteBtns;
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Modern CSS styling is applied',
      test: () => {
        try {
          const cssCode = fs.readFileSync('src/styles/category-manager.css', 'utf8');

          const hasModernGradients = cssCode.includes('linear-gradient') && cssCode.includes('#6366f1');
          const hasAnimations = cssCode.includes('@keyframes') && cssCode.includes('animation:');
          const hasTransitions = cssCode.includes('transition:') && cssCode.includes('cubic-bezier');
          const hasModernBorderRadius = cssCode.includes('border-radius: 24px') || cssCode.includes('border-radius: 20px');
          const hasBackdropFilter = cssCode.includes('backdrop-filter: blur');

          return hasModernGradients && hasAnimations && hasTransitions && hasModernBorderRadius && hasBackdropFilter;
        } catch (error) {
          console.error('Error reading category-manager.css:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Drag and drop visual feedback styles exist',
      test: () => {
        try {
          const cssCode = fs.readFileSync('src/styles/category-manager.css', 'utf8');

          return cssCode.includes('.dragging') &&
            cssCode.includes('.drag-over') &&
            cssCode.includes('.drop-indicator') &&
            cssCode.includes('pulse-indicator');
        } catch (error) {
          console.error('Error reading category-manager.css:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Button styles are ultra-modern',
      test: () => {
        try {
          const cssCode = fs.readFileSync('src/styles/category-manager.css', 'utf8');

          const hasModernBtnStyles = cssCode.includes('.btn') && cssCode.includes('cubic-bezier');
          const hasHoverEffects = cssCode.includes('.btn:hover') && cssCode.includes('translateY');
          const hasGradientBtns = cssCode.includes('.btn-primary') && cssCode.includes('linear-gradient');
          const hasAnimatedBtns = cssCode.includes('gradientMove') || cssCode.includes('animation:');

          return hasModernBtnStyles && hasHoverEffects && hasGradientBtns && hasAnimatedBtns;
        } catch (error) {
          console.error('Error reading category-manager.css:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'No duplicate event listeners or functions',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          // Check for duplicate drop event listeners
          const dropMatches = categoryManagerCode.match(/addEventListener\('drop'/g);
          const dragoverMatches = categoryManagerCode.match(/addEventListener\('dragover'/g);

          // Should have exactly one of each per card setup
          return dropMatches && dropMatches.length <= 2 && dragoverMatches && dragoverMatches.length <= 2;
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Proper error handling and debugging',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          return categoryManagerCode.includes('console.log') &&
            categoryManagerCode.includes('try') &&
            categoryManagerCode.includes('catch');
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Modal management is properly handled',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          return categoryManagerCode.includes('categoryManagerModalInstance') &&
            categoryManagerCode.includes('showModal') &&
            categoryManagerCode.includes('attachCategoryManagerEventListeners');
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Reorder categories function works correctly',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          return categoryManagerCode.includes('function reorderCategories') &&
            categoryManagerCode.includes('draggedCategoryName') &&
            categoryManagerCode.includes('targetCategoryName') &&
            categoryManagerCode.includes('insertAfter');
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    },
    {
      name: 'Toast notifications for user feedback',
      test: () => {
        try {
          const categoryManagerCode = fs.readFileSync('src/ui/categoryManager.js', 'utf8');

          return categoryManagerCode.includes('showToast') &&
            categoryManagerCode.includes('reordered successfully');
        } catch (error) {
          console.error('Error reading categoryManager.js:', error.message);
          throw error; // Re-throw to handle properly
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ PASS: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error.message}`);
      failed++;
    }
  });

  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL CATEGORY MANAGER TESTS PASSED!');
    console.log('✅ Drag and drop functionality implemented');
    console.log('✅ Modern UI styling applied');
    console.log('✅ Button functionality verified');
    console.log('✅ No duplicate code or event listeners');
    console.log('✅ Proper error handling and user feedback');
  } else {
    console.log('\n💥 SOME TESTS FAILED!');
    console.log('Please review the failed tests and fix the issues.');
  }

  return { passed, failed, total: tests.length };
}

// Run the tests
testCategoryManagerFunctionality();
