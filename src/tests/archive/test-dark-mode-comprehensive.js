/**
 * Comprehensive Dark Mode Test
 * Tests all dark mode styling issues mentioned by user
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌙 COMPREHENSIVE DARK MODE TEST');
console.log('=====================================\n');

// Load CSS content to verify selectors
const filtersCSS = readFileSync(join(__dirname, '../styles/filters.css'), 'utf8');
const modalsCSS = readFileSync(join(__dirname, '../styles/modals.css'), 'utf8');
const chartsCSS = readFileSync(join(__dirname, '../styles/charts.css'), 'utf8');
const transactionsCSS = readFileSync(join(__dirname, '../styles/transactions.css'), 'utf8');

let testsPassed = 0;
let totalTests = 0;

function test(description, testFunction) {
  totalTests++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ ${description}`);
      testsPassed++;
    } else {
      console.log(`❌ ${description}`);
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
  }
}

// Test 1: Check if Advanced Filters dark mode selectors are correct
test('Advanced Filters uses body.dark-mode selector', () => {
  return filtersCSS.includes('body.dark-mode .advanced-filters') &&
    !filtersCSS.includes('.dark-mode .advanced-filters {');
});

// Test 2: Check if Advanced Filters has multi-column grid layout
test('Advanced Filters has responsive grid layout', () => {
  return filtersCSS.includes('grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))') ||
    filtersCSS.includes('grid-template-columns: repeat(3, 1fr)') ||
    filtersCSS.includes('grid-template-columns: repeat(4, 1fr)');
});

// Test 3: Check if Advanced Filters has futuristic styling
test('Advanced Filters has futuristic dark mode styling', () => {
  return filtersCSS.includes('linear-gradient(135deg, #0a0a0f') &&
    filtersCSS.includes('backdrop-filter: blur(20px)') &&
    filtersCSS.includes('neonPulse') &&
    filtersCSS.includes('box-shadow:');
});

// Test 4: Check if modals use correct dark mode selectors
test('Modals use body.dark-mode selector', () => {
  return modalsCSS.includes('body.dark-mode .modal-') &&
    !modalsCSS.includes('.dark-mode .modal-header {');
});

// Test 5: Check if charts have enhanced text readability
test('Charts have enhanced text readability in dark mode', () => {
  return chartsCSS.includes('body.dark-mode .chart-container *') &&
    chartsCSS.includes('color: #e0e0e0 !important') &&
    chartsCSS.includes('filter: brightness(1.1) contrast(1.2)');
});

// Test 6: Check if transaction summaries use correct selectors
test('Transaction summaries use body.dark-mode selector', () => {
  return transactionsCSS.includes('body.dark-mode .summary-card') &&
    !transactionsCSS.includes('.dark-mode .summary-card {');
});

// Test 7: Check that HTML lang attribute is present
test('HTML files have lang attribute', () => {
  const reportHTML = readFileSync(join(__dirname, 'automated-test-report.html'), 'utf8');
  return reportHTML.includes('<html lang="en">');
});

// Test 8: Simulate dark mode class structure test
test('Dark mode CSS selector structure', () => {
  // Test that all major dark mode selectors follow body.dark-mode pattern
  const filtersHasCorrectSelectors = filtersCSS.includes('body.dark-mode .advanced-filters');
  const modalsHasCorrectSelectors = modalsCSS.includes('body.dark-mode .modal-');
  const chartsHasCorrectSelectors = chartsCSS.includes('body.dark-mode .chart-');
  const transactionsHasCorrectSelectors = transactionsCSS.includes('body.dark-mode .summary-');

  return filtersHasCorrectSelectors && modalsHasCorrectSelectors &&
    chartsHasCorrectSelectors && transactionsHasCorrectSelectors;
});

// Test 9: Check CSS specificity and !important usage
test('Dark mode styles have appropriate specificity', () => {
  const hasImportantRules = filtersCSS.includes('!important') &&
    modalsCSS.includes('!important') &&
    chartsCSS.includes('!important') &&
    transactionsCSS.includes('!important');
  return hasImportantRules;
});

// Test 10: Verify no conflicting .dark-mode selectors remain
test('No conflicting .dark-mode selectors without body prefix', () => {
  const filtersConflict = filtersCSS.match(/^\.dark-mode /gm);
  const modalsConflict = modalsCSS.match(/^\.dark-mode /gm);
  const chartsConflict = chartsCSS.match(/^\.dark-mode /gm);
  const transactionsConflict = transactionsCSS.match(/^\.dark-mode /gm);

  return !filtersConflict && !modalsConflict && !chartsConflict && !transactionsConflict;
});

console.log('\n📊 Test Results:');
console.log(`Passed: ${testsPassed}/${totalTests}`);
console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);

if (testsPassed === totalTests) {
  console.log('\n🎉 ALL DARK MODE TESTS PASSED!');
  console.log('✅ Advanced Filters: Futuristic multi-column layout');
  console.log('✅ Modals: Proper dark mode styling');
  console.log('✅ Charts: Enhanced text readability');
  console.log('✅ Summaries: No white blocks in dark mode');
  console.log('✅ CSS Selectors: All use body.dark-mode pattern');
  console.log('✅ HTML: Proper lang attributes');
} else {
  console.log('\n❌ Some dark mode tests failed!');
  console.log('Please check the CSS files and selectors.');
}

// Export for automated test runner (ES module syntax)
export default {
  testName: 'Comprehensive Dark Mode Test',
  testsPassed,
  totalTests,
  success: testsPassed === totalTests
};
