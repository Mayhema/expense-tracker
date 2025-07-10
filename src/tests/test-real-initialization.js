/**
 * Test to debug the real app initialization timing issue
 */

console.log('🚀 REAL APP INITIALIZATION DEBUG');
console.log('=================================');

// This test mimics the real app initialization sequence

async function testRealInitialization() {
  console.log('\n🔍 Step 1: Setting up DOM environment...');

  // Mock DOM environment similar to real app
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

  console.log('\n🔍 Step 2: Loading app state...');

  // Mock AppState similar to real app
  const { AppState } = await import('../core/appState.js');

  // Set up some test data
  AppState.transactions = [
    { id: 1, income: 100, expenses: 0, currency: 'USD', date: '2024-01-01', category: 'Salary' },
    { id: 2, income: 0, expenses: 50, currency: 'USD', date: '2024-01-02', category: 'Food' },
    { id: 3, income: 200, expenses: 0, currency: 'USD', date: '2024-01-03', category: 'Bonus' }
  ];

  console.log('✅ App state loaded with', AppState.transactions.length, 'transactions');

  console.log('\n🔍 Step 3: Initializing transaction manager...');

  // Follow the same sequence as main.js
  const { initializeTransactionManager } = await import('../ui/transactionManager.js');

  console.log('📞 Calling initializeTransactionManager...');
  initializeTransactionManager();

  // Give it some time to process
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('\n🔍 Step 4: Checking transaction summary...');

  const summaryElement = document.getElementById('transactionSummary');
  if (summaryElement) {
    console.log('✅ Summary element exists');
    console.log('   - Content length:', summaryElement.innerHTML.length);
    console.log('   - Has meaningful content:', !summaryElement.innerHTML.includes('No transaction data available') && summaryElement.innerHTML.trim() !== '');

    if (summaryElement.innerHTML.includes('No transaction data available') || summaryElement.innerHTML.trim() === '') {
      console.error('❌ Summary shows no data despite having transactions!');
      console.log('   - Full content:', summaryElement.innerHTML);
    } else {
      console.log('✅ Summary shows transaction data');
    }
  } else {
    console.error('❌ Summary element not found!');
  }

  console.log('\n🔍 Step 5: Checking filter elements...');

  const currencyFilter = document.getElementById('currencyFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const amountMinFilter = document.getElementById('amountMin');
  const amountMaxFilter = document.getElementById('amountMax');

  console.log('   - Currency filter:', !!currencyFilter, 'value:', currencyFilter?.value);
  console.log('   - Category filter:', !!categoryFilter, 'value:', categoryFilter?.value);
  console.log('   - Amount min filter:', !!amountMinFilter, 'value:', amountMinFilter?.value);
  console.log('   - Amount max filter:', !!amountMaxFilter, 'value:', amountMaxFilter?.value);

  // Check if filters are causing the issue
  if (currencyFilter?.value && currencyFilter.value !== '') {
    console.log('⚠️ Currency filter has value:', currencyFilter.value);
  }

  if (categoryFilter?.value && categoryFilter.value !== '') {
    console.log('⚠️ Category filter has value:', categoryFilter.value);
  }

  console.log('\n🔍 Step 6: Manually testing filter logic...');

  const { renderTransactions } = await import('../ui/transactionManager.js');

  // Clear any filter values
  if (currencyFilter) currencyFilter.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (amountMinFilter) amountMinFilter.value = '';
  if (amountMaxFilter) amountMaxFilter.value = '';

  console.log('🔧 Cleared all filter values');

  // Re-render with cleared filters
  console.log('📞 Re-rendering with cleared filters...');
  renderTransactions(AppState.transactions, false);

  await new Promise(resolve => setTimeout(resolve, 300));

  // Check summary again
  const summaryAfterClear = document.getElementById('transactionSummary');
  if (summaryAfterClear) {
    console.log('✅ Summary exists after clearing filters');
    console.log('   - Content length:', summaryAfterClear.innerHTML.length);
    console.log('   - Has meaningful content:', !summaryAfterClear.innerHTML.includes('No transaction data available') && summaryAfterClear.innerHTML.trim() !== '');

    if (summaryAfterClear.innerHTML.includes('No transaction data available') || summaryAfterClear.innerHTML.trim() === '') {
      console.error('❌ Summary still shows no data after clearing filters!');
    } else {
      console.log('✅ Summary now shows transaction data after clearing filters');
    }
  }

  console.log('\n📊 DIAGNOSIS');
  console.log('============');
  console.log('This test helps identify if the issue is:');
  console.log('1. Filter elements having unexpected default values');
  console.log('2. Filter logic being too restrictive');
  console.log('3. Timing issues in the initialization sequence');
  console.log('4. DOM elements not being properly cleared between renders');

  process.exit(0);
}

// Run the test
testRealInitialization().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
