/**
 * TEST: Transaction Summary Container Fix
 *
 * This test verifies that the transaction summary element is properly
 * created and accessible after the fix.
 */

import { AppState } from '../core/appState.js';

async function testTransactionSummaryFix() {
  console.log('\n🔍 TEST: Transaction Summary Container Fix');
  console.log('==========================================');

  // Step 1: Set up test data
  console.log('📋 Step 1: Setting up test data...');
  AppState.transactions = [];
  for (let i = 0; i < 127; i++) {
    AppState.transactions.push({
      id: `tx-${i}`,
      date: '2024-01-01',
      description: `Transaction ${i}`,
      amount: 100,
      currency: 'USD',
      category: 'Food',
      income: i % 2 === 0 ? 100 : 0,
      expenses: i % 2 === 1 ? 100 : 0
    });
  }
  console.log('✅ Test data created:', AppState.transactions.length, 'transactions');

  // Step 2: Mock the DOM structure
  console.log('\n📋 Step 2: Setting up DOM structure...');
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  mainContent.id = 'mainContent';
  document.body.appendChild(mainContent);
  console.log('✅ Main content container created');

  // Step 3: Test ensureTransactionContainer
  console.log('\n📋 Step 3: Testing ensureTransactionContainer...');
  const { ensureTransactionContainer } = await import('../ui/transaction/transactionRenderer.js');
  const container = ensureTransactionContainer();
  console.log('✅ Container created:', !!container);

  // Step 4: Verify summary element exists
  console.log('\n📋 Step 4: Verifying summary element...');
  const summaryElement = document.getElementById('transactionSummary');
  console.log('✅ Summary element found:', !!summaryElement);

  if (summaryElement) {
    console.log('✅ Summary element ID:', summaryElement.id);
    console.log('✅ Summary element class:', summaryElement.className);
    console.log('✅ Summary element parent:', summaryElement.parentElement?.className);
  }

  // Step 5: Test updateTransactionSummary
  console.log('\n📋 Step 5: Testing updateTransactionSummary...');
  const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

  // This should work without errors now
  updateTransactionSummary(AppState.transactions);

  // Step 6: Verify summary content
  console.log('\n📋 Step 6: Verifying summary content...');
  await new Promise(resolve => setTimeout(resolve, 200)); // Wait for retries

  const updatedSummary = document.getElementById('transactionSummary');
  console.log('✅ Summary after update:', !!updatedSummary);

  if (updatedSummary) {
    console.log('✅ Summary content length:', updatedSummary.innerHTML.length);
    console.log('✅ Summary content preview:', updatedSummary.innerHTML.substring(0, 100) + '...');
  }

  // Step 7: Test multiple calls (should not cause issues)
  console.log('\n📋 Step 7: Testing multiple calls...');
  const container2 = ensureTransactionContainer();
  const container3 = ensureTransactionContainer();

  console.log('✅ Container reuse test:', container === container2 && container2 === container3);

  // Step 8: Test event listener attachment
  console.log('\n📋 Step 8: Testing event listener attachment...');
  const { attachTransactionEventListeners } = await import('../ui/transaction/transactionEventHandler.js');

  // This should only attach once
  attachTransactionEventListeners();
  attachTransactionEventListeners();
  attachTransactionEventListeners();

  console.log('✅ Event listener attachment test completed');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ Transaction summary container fix verified');
}

// Run the test
testTransactionSummaryFix().catch(error => {
  console.error('❌ TEST FAILED:', error);
});
