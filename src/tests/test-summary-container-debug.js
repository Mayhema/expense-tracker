/**
 * DEBUG TEST: Transaction Summary Container Issue
 *
 * This test reproduces the exact scenario from the user's console logs
 * to understand why the transactionSummary element is not found.
 */

import { AppState } from '../core/appState.js';

async function testSummaryContainerDebug() {
  console.log('\n🔍 DEBUG TEST: Transaction Summary Container Issue');
  console.log('==================================================');

  // Simulate the exact scenario from the user's console
  console.log('📋 Step 1: Setting up AppState with 127 transactions...');
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

  console.log('✅ AppState.transactions length:', AppState.transactions.length);

  // Step 2: Check if DOM is clean
  console.log('\n📋 Step 2: Checking initial DOM state...');
  const existingSection = document.getElementById('transactionsSection');
  const existingSummary = document.getElementById('transactionSummary');
  console.log('❌ Existing transactionsSection:', !!existingSection);
  console.log('❌ Existing transactionSummary:', !!existingSummary);

  // Step 3: Import and call ensureTransactionContainer
  console.log('\n📋 Step 3: Calling ensureTransactionContainer...');
  const { ensureTransactionContainer } = await import('../ui/transaction/transactionRenderer.js');

  const container = ensureTransactionContainer();
  console.log('✅ Container created:', !!container);

  // Step 4: Check if summary element exists immediately after creation
  console.log('\n📋 Step 4: Checking summary element after container creation...');
  const summaryAfterCreation = document.getElementById('transactionSummary');
  console.log('✅ Summary found immediately after creation:', !!summaryAfterCreation);

  if (summaryAfterCreation) {
    console.log('✅ Summary element ID:', summaryAfterCreation.id);
    console.log('✅ Summary element parent:', summaryAfterCreation.parentElement?.className);
    console.log('✅ Summary element innerHTML length:', summaryAfterCreation.innerHTML.length);
  } else {
    console.log('❌ Summary element not found - checking container structure...');
    if (container) {
      console.log('📋 Container innerHTML:');
      console.log(container.innerHTML);
    }
  }

  // Step 5: Try to call updateTransactionSummary
  console.log('\n📋 Step 5: Calling updateTransactionSummary...');
  const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

  // This should trigger the retry logic
  updateTransactionSummary(AppState.transactions);

  // Step 6: Wait for retries and check final state
  console.log('\n📋 Step 6: Waiting for retries to complete...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  const finalSummary = document.getElementById('transactionSummary');
  console.log('✅ Final summary found:', !!finalSummary);

  if (finalSummary) {
    console.log('✅ Final summary content length:', finalSummary.innerHTML.length);
    console.log('✅ Final summary content preview:', finalSummary.innerHTML.substring(0, 100) + '...');
  }

  console.log('\n✅ DEBUG TEST COMPLETE');
}

// Run the test
testSummaryContainerDebug().catch(error => {
  console.error('❌ TEST FAILED:', error);
});
