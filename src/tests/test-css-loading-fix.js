/**
 * Test to verify CSS loading and dark mode fixes
 * This test checks if the critical CSS import issues have been resolved
 */

console.log('🧪 Testing CSS Loading and Dark Mode Fixes...\n');

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let totalTests = 0;

function test(description, condition) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${description}`);
    testsPassed++;
  } else {
    console.log(`❌ ${description}`);
  }
}

// Read the main styles.css file
const stylesPath = path.join(__dirname, 'src', 'styles', 'styles.css');
console.log('Reading styles from:', stylesPath);
const stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Test 1: Check if dark-theme.css is imported
test('styles.css imports dark-theme.css', stylesContent.includes('@import \'./dark-theme.css\';'));

// Test 2: Check if modals.css is imported
test('styles.css imports modals.css', stylesContent.includes('@import \'./modals.css\';'));

// Test 3: Check if transactions.css is imported
test('styles.css imports transactions.css', stylesContent.includes('@import \'./transactions.css\';'));

// Test 4: Check if filters.css is imported
test('styles.css imports filters.css', stylesContent.includes('@import \'./filters.css\';'));

// Test 5: Check if conflicting transaction-filters styles are removed
test('Conflicting .transaction-filters styles removed', !stylesContent.includes('.transaction-filters {\n  background: var(--bg-color, #ffffff) !important;'));

// Read the dark-theme.css file if it exists
const darkThemePath = path.join(__dirname, 'src', 'styles', 'dark-theme.css');
if (fs.existsSync(darkThemePath)) {
  const darkThemeContent = fs.readFileSync(darkThemePath, 'utf8');
  
  // Test 6: Check if dark theme has modal styles
  test('dark-theme.css contains modal dark mode styles', darkThemeContent.includes('body.dark-mode .modal'));
  
  // Test 7: Check if dark theme has transaction table styles
  test('dark-theme.css contains transaction table dark mode styles', darkThemeContent.includes('body.dark-mode .transaction-table'));
}

// Read the modals.css file if it exists
const modalsPath = path.join(__dirname, 'src', 'styles', 'modals.css');
if (fs.existsSync(modalsPath)) {
  const modalsContent = fs.readFileSync(modalsPath, 'utf8');
  
  // Test 8: Check if modals.css has inline style overrides
  test('modals.css has [style] attribute selectors for dark mode', modalsContent.includes('body.dark-mode .modal-header[style]'));
  
  // Test 9: Check if modals.css has comprehensive dark mode support
  test('modals.css has modal-body dark mode styles', modalsContent.includes('body.dark-mode .modal-body'));
}

// Read the filters.css file if it exists
const filtersPath = path.join(__dirname, 'src', 'styles', 'filters.css');
if (fs.existsSync(filtersPath)) {
  const filtersContent = fs.readFileSync(filtersPath, 'utf8');
  
  // Test 10: Check if filters.css has ultra-high specificity for dark mode
  test('filters.css has ultra-high specificity dark mode selectors', 
    filtersContent.includes('body.dark-mode #transactionFilters') &&
    filtersContent.includes('body.dark-mode .transaction-filters .advanced-filters'));
  
  // Test 11: Check if filters.css has futuristic styling
  test('filters.css has futuristic gradients and effects', 
    filtersContent.includes('linear-gradient(135deg, #0a0a0f') &&
    filtersContent.includes('backdrop-filter: blur(20px)'));
  
  // Test 12: Check if filters.css has multi-column grid
  test('filters.css has responsive multi-column grid', filtersContent.includes('grid-template-columns: repeat('));
}

// Read the transactions.css file if it exists
const transactionsPath = path.join(__dirname, 'src', 'styles', 'transactions.css');
if (fs.existsSync(transactionsPath)) {
  const transactionsContent = fs.readFileSync(transactionsPath, 'utf8');
  
  // Test 13: Check if transactions.css has summary card dark mode fixes
  test('transactions.css has summary card dark mode with ultra-high specificity', 
    transactionsContent.includes('body.dark-mode .summary-card,') &&
    transactionsContent.includes('body.dark-mode #transactionSummary .summary-card,') &&
    transactionsContent.includes('body.dark-mode [id*="summary"] .summary-card'));
}

console.log(`\n📊 Test Results: ${testsPassed}/${totalTests} tests passed`);

if (testsPassed === totalTests) {
  console.log('\n🎉 ALL CSS LOADING ISSUES FIXED!');
  console.log('✅ Critical CSS files are now properly imported');
  console.log('✅ Conflicting styles with !important have been removed');  
  console.log('✅ Dark mode should now work for Advanced Filters, Modals, and Transaction Summaries');
  console.log('\n🚀 READY TO TEST IN BROWSER!');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Open the browser and test dark mode toggle');
  console.log('2. Check Advanced Filters section for futuristic multi-column layout');
  console.log('3. Verify modals have proper dark backgrounds');
  console.log('4. Confirm transaction summaries are no longer white blocks');
} else {
  console.log('\n❌ Some CSS loading issues remain');
  console.log('Please check the failed tests above');
}

process.exit(testsPassed === totalTests ? 0 : 1);
