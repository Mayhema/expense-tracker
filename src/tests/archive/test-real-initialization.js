/**
 * Test to debug the real app initialization timing issue
 * Refactored to reduce cognitive complexity
 */

console.log('🚀 REAL APP INITIALIZATION DEBUG');
console.log('=================================');

// Helper function to set up DOM environment
async function setupDOMEnvironment() {
  console.log('\n🔍 Step 1: Setting up DOM environment...');

  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Expense Tracker</title>
    </head>
    <body>
        <div class="main-content">
            <!-- This will be populated by the app -->
        </div>
    </body>
    </html>
  `);

  global.document = dom.window.document;
  global.window = dom.window;

  // Mock localStorage to avoid security issues
  global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { }
  };

  console.log('✅ DOM environment set up');
}

// Helper function to initialize app state with test data
async function initializeAppState() {
  console.log('\n🔍 Step 2: Loading app state...');

  const { AppState } = await import('../core/appState.js');

  AppState.transactions = [
    { id: 1, income: 100, expenses: 0, currency: 'USD', date: '2024-01-01', category: 'Salary' },
    { id: 2, income: 0, expenses: 50, currency: 'USD', date: '2024-01-02', category: 'Food' },
    { id: 3, income: 200, expenses: 0, currency: 'USD', date: '2024-01-03', category: 'Bonus' }
  ];

  console.log('✅ App state loaded with', AppState.transactions.length, 'transactions');
}

// Helper function to initialize transaction manager
async function initializeManager() {
  console.log('\n🔍 Step 3: Initializing transaction manager...');

  const { initializeTransactionManager } = await import('../ui/transactionManager.js');

  console.log('📞 Calling initializeTransactionManager...');
  initializeTransactionManager();

  await new Promise(resolve => setTimeout(resolve, 200));
}

// Helper function to check transaction summary
function checkTransactionSummary() {
  console.log('\n🔍 Step 4: Checking transaction summary...');

  const summaryElement = document.getElementById('transactionSummary');
  
  if (!summaryElement) {
    console.error('❌ Summary element not found!');
    return false;
  }

  console.log('✅ Summary element exists');
  console.log('   - Content length:', summaryElement.innerHTML.length);
  
  const hasData = !summaryElement.innerHTML.includes('No transaction data available') && 
                  summaryElement.innerHTML.trim() !== '';
  
  console.log('   - Has meaningful content:', hasData);

  if (!hasData) {
    console.error('❌ Summary shows no data despite having transactions!');
    console.log('   - Full content:', summaryElement.innerHTML);
  } else {
    console.log('✅ Summary shows transaction data');
  }

  return hasData;
}

// Helper function to check and log filter elements
function checkFilterElements() {
  console.log('\n🔍 Step 5: Checking filter elements...');

  const filters = {
    currency: document.getElementById('currencyFilter'),
    category: document.getElementById('categoryFilter'),
    amountMin: document.getElementById('amountMin'),
    amountMax: document.getElementById('amountMax')
  };

  console.log('   - Currency filter:', !!filters.currency, 'value:', filters.currency?.value);
  console.log('   - Category filter:', !!filters.category, 'value:', filters.category?.value);
  console.log('   - Amount min filter:', !!filters.amountMin, 'value:', filters.amountMin?.value);
  console.log('   - Amount max filter:', !!filters.amountMax, 'value:', filters.amountMax?.value);

  // Check for unexpected filter values
  if (filters.currency?.value && filters.currency.value !== '') {
    console.log('⚠️ Currency filter has value:', filters.currency.value);
  }

  if (filters.category?.value && filters.category.value !== '') {
    console.log('⚠️ Category filter has value:', filters.category.value);
  }

  return filters;
}

// Helper function to clear all filter values
function clearFilterValues(filters) {
  console.log('🔧 Cleared all filter values');
  
  Object.values(filters).forEach(filter => {
    if (filter) filter.value = '';
  });
}

// Helper function to test filter logic
async function testFilterLogic(filters) {
  console.log('\n🔍 Step 6: Manually testing filter logic...');

  const { renderTransactions } = await import('../ui/transactionManager.js');
  const { AppState } = await import('../core/appState.js');

  clearFilterValues(filters);

  console.log('📞 Re-rendering with cleared filters...');
  renderTransactions(AppState.transactions, false);

  await new Promise(resolve => setTimeout(resolve, 300));

  // Check summary again
  const summaryAfterClear = document.getElementById('transactionSummary');
  if (!summaryAfterClear) return false;

  console.log('✅ Summary exists after clearing filters');
  console.log('   - Content length:', summaryAfterClear.innerHTML.length);
  
  const hasData = !summaryAfterClear.innerHTML.includes('No transaction data available') && 
                  summaryAfterClear.innerHTML.trim() !== '';
  
  console.log('   - Has meaningful content:', hasData);

  if (!hasData) {
    console.error('❌ Summary still shows no data after clearing filters!');
  } else {
    console.log('✅ Summary now shows transaction data after clearing filters');
  }

  return hasData;
}

// Helper function to display diagnosis information
function displayDiagnosis() {
  console.log('\n📊 DIAGNOSIS');
  console.log('============');
  console.log('This test helps identify if the issue is:');
  console.log('1. Filter elements having unexpected default values');
  console.log('2. Filter logic being too restrictive');
  console.log('3. Timing issues in the initialization sequence');
  console.log('4. DOM elements not being properly cleared between renders');
}

// Main test function with reduced complexity
async function testRealInitialization() {
  console.log('🏁 Starting comprehensive initialization test...');

  try {
    await setupDOMEnvironment();
    await initializeAppState();
    await initializeManager();
    
    checkTransactionSummary();
    const filters = checkFilterElements();
    await testFilterLogic(filters);
    
    displayDiagnosis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed during execution:', error);
    process.exit(1);
  }
}

// Run the test
testRealInitialization().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
