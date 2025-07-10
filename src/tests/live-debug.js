/**
 * LIVE TRANSACTION SUMMARY DEBUGGER
 *
 * This script can be run in the browser console to debug the transaction summary issue.
 * It checks the current state of the DOM and AppState to identify why the summary isn't visible.
 */

console.log('🔍 LIVE TRANSACTION SUMMARY DEBUGGER');
console.log('====================================');

// Check if we're in the right environment
if (typeof window === 'undefined' || typeof document === 'undefined') {
  console.error('❌ This script must be run in a browser environment');
} else {

  // Step 1: Check if AppState exists and has data
  console.log('\n📊 Step 1: Checking AppState...');
  if (typeof AppState !== 'undefined') {
    console.log('✅ AppState found');
    console.log('   - Transactions:', AppState.transactions?.length || 0);
    console.log('   - Categories:', Object.keys(AppState.categories || {}).length);
    console.log('   - Initialized:', AppState.initialized);

    if (AppState.transactions && AppState.transactions.length > 0) {
      console.log('   - Sample transaction:', AppState.transactions[0]);
    } else {
      console.log('⚠️ No transactions found in AppState');
    }
  } else {
    console.error('❌ AppState not found - app might not be initialized');
  }

  // Step 2: Check if transaction summary element exists
  console.log('\n🔍 Step 2: Checking DOM elements...');
  const summaryElement = document.getElementById('transactionSummary');
  if (summaryElement) {
    console.log('✅ Transaction summary element found');
    console.log('   - Element ID:', summaryElement.id);
    console.log('   - Element class:', summaryElement.className);
    console.log('   - Parent element:', summaryElement.parentElement?.tagName);
    console.log('   - Parent class:', summaryElement.parentElement?.className);
    console.log('   - In section-header:', summaryElement.closest('.section-header') ? 'YES' : 'NO');
    console.log('   - Content length:', summaryElement.innerHTML.length);
    console.log('   - Has content:', summaryElement.innerHTML.trim() !== '');

    // Check visibility
    const style = window.getComputedStyle(summaryElement);
    console.log('   - Display:', style.display);
    console.log('   - Visibility:', style.visibility);
    console.log('   - Opacity:', style.opacity);
    console.log('   - Position:', style.position);
    console.log('   - Z-index:', style.zIndex);

    if (summaryElement.innerHTML.trim() === '') {
      console.log('⚠️ Summary element is empty');
    } else {
      console.log('   - Content preview:', summaryElement.innerHTML.substring(0, 100) + '...');
    }
  } else {
    console.error('❌ Transaction summary element not found');
  }

  // Step 3: Check transaction section
  console.log('\n🏗️ Step 3: Checking transaction section...');
  const transactionSection = document.querySelector('.transactions-section');
  if (transactionSection) {
    console.log('✅ Transaction section found');

    const sectionHeader = transactionSection.querySelector('.section-header');
    const sectionContent = transactionSection.querySelector('.section-content');

    console.log('   - Has section-header:', !!sectionHeader);
    console.log('   - Has section-content:', !!sectionContent);

    if (sectionHeader) {
      console.log('   - Section header HTML:', sectionHeader.innerHTML.substring(0, 200) + '...');
    }
  } else {
    console.error('❌ Transaction section not found');
  }

  // Step 4: Check filters
  console.log('\n🔍 Step 4: Checking filters...');
  const filters = [
    { id: 'currencyFilter', name: 'Currency Filter' },
    { id: 'categoryFilter', name: 'Category Filter' },
    { id: 'amountMin', name: 'Amount Min Filter' },
    { id: 'amountMax', name: 'Amount Max Filter' }
  ];

  filters.forEach(filter => {
    const element = document.getElementById(filter.id);
    if (element) {
      console.log(`   - ${filter.name}:`, element.value || 'empty');
    } else {
      console.log(`   - ${filter.name}: not found`);
    }
  });

  // Step 5: Try to manually trigger summary update
  console.log('\n🔧 Step 5: Attempting manual summary update...');

  if (typeof AppState !== 'undefined' && AppState.transactions && summaryElement) {
    console.log('📞 Calling updateTransactionSummary manually...');

    // Try to call the function directly
    try {
      // This assumes the function is available globally or can be imported
      import('./ui/transaction/transactionSummary.js').then(module => {
        module.updateTransactionSummary(AppState.transactions);
        console.log('✅ Manual update called successfully');

        setTimeout(() => {
          console.log('📊 Summary after manual update:');
          console.log('   - Content length:', summaryElement.innerHTML.length);
          console.log('   - Has content:', summaryElement.innerHTML.trim() !== '');
          console.log('   - Content preview:', summaryElement.innerHTML.substring(0, 100) + '...');
        }, 200);
      }).catch(error => {
        console.error('❌ Could not import updateTransactionSummary:', error);
      });
    } catch (error) {
      console.error('❌ Error calling manual update:', error);
    }
  } else {
    console.log('⚠️ Cannot perform manual update - missing AppState or summary element');
  }

  // Step 6: Recommendations
  console.log('\n💡 Step 6: Recommendations...');
  console.log('=============================');

  if (typeof AppState === 'undefined') {
    console.log('🔧 Fix: AppState not found - check if app is initialized');
  } else if (!AppState.transactions || AppState.transactions.length === 0) {
    console.log('🔧 Fix: No transactions - upload some transaction files');
  } else if (!summaryElement) {
    console.log('🔧 Fix: Summary element not found - check if transaction manager is initialized');
  } else if (summaryElement.innerHTML.trim() === '') {
    console.log('🔧 Fix: Summary is empty - check if updateTransactionSummary is being called');
  } else {
    console.log('🔧 Fix: Summary appears to be working - check CSS visibility');
  }

  console.log('\n📋 Next steps:');
  console.log('1. Check browser console for errors');
  console.log('2. Verify transaction data is loaded');
  console.log('3. Check if filters are excluding transactions');
  console.log('4. Inspect element to see if it\'s hidden by CSS');
  console.log('5. Run the unified test runner to check for regressions');

  console.log('\n✅ Debug complete');
}
