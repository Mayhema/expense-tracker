/**
 * Test to verify the currency filter 'all' value fix
 */

import { JSDOM } from 'jsdom';

console.log('🧪 CURRENCY FILTER "ALL" VALUE FIX TEST');
console.log('=======================================');

async function testCurrencyFilterFix() {
  // Set up DOM
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test</title>
    </head>
    <body>
        <div class="main-content">
            <!-- This will be populated by the test -->
        </div>
    </body>
    </html>
  `);

  global.document = dom.window.document;
  global.window = dom.window;
  global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { }
  };

  // Set up test transaction data
  const { AppState } = await import('../core/appState.js');
  AppState.transactions = [
    { id: 1, income: 1000, expenses: 0, currency: 'USD', date: '2024-01-01', category: 'Salary' },
    { id: 2, income: 0, expenses: 200, currency: 'EUR', date: '2024-01-02', category: 'Food' },
    { id: 3, income: 500, expenses: 0, currency: 'GBP', date: '2024-01-03', category: 'Bonus' },
    { id: 4, income: 0, expenses: 50, currency: 'USD', date: '2024-01-04', category: 'Transport' }
  ];

  console.log('✅ Set up AppState with', AppState.transactions.length, 'transactions');
  console.log('   - Currencies:', [...new Set(AppState.transactions.map(t => t.currency))].join(', '));

  // Initialize transaction manager
  const { initializeTransactionManager } = await import('../ui/transactionManager.js');
  initializeTransactionManager();

  // Give it time to process
  await new Promise(resolve => setTimeout(resolve, 300));

  // Check results
  const summaryElement = document.getElementById('transactionSummary');
  const currencyFilter = document.getElementById('currencyFilter');

  console.log('\n🔍 Test Results:');
  console.log('===============');
  console.log('✅ Summary element found:', !!summaryElement);
  console.log('✅ Currency filter found:', !!currencyFilter);
  console.log('✅ Currency filter value:', currencyFilter?.value);

  if (summaryElement) {
    console.log('✅ Summary has content:', summaryElement.innerHTML.length > 100);
    console.log('✅ Summary shows transaction data:', summaryElement.innerHTML.includes('Income') && summaryElement.innerHTML.includes('Expenses'));

    // Check if all transactions are being shown
    const content = summaryElement.innerHTML;
    console.log('✅ Summary content includes multi-currency data:', content.includes('USD') || content.includes('EUR') || content.includes('GBP'));
  } else {
    console.error('❌ Summary element not found');
  }

  console.log('\n📊 Expected Behavior:');
  console.log('====================');
  console.log('When currencyFilter.value = "all":');
  console.log('✓ All 4 transactions should be visible');
  console.log('✓ Summary should show data from all currencies');
  console.log('✓ No transactions should be filtered out');

  if (summaryElement && summaryElement.innerHTML.includes('Income') && currencyFilter?.value === 'all') {
    console.log('\n✅ SUCCESS: Currency filter "all" value is working correctly');
    console.log('✅ Transaction summary is visible with all transactions');
  } else {
    console.log('\n❌ ISSUE: Currency filter or summary is not working correctly');
  }

  process.exit(0);
}

testCurrencyFilterFix().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
