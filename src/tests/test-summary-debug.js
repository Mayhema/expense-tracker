#!/usr/bin/env node

/**
 * Test to debug transaction summary visibility issues
 */

console.log('🧪 STARTING TRANSACTION SUMMARY DEBUG TEST');
console.log('==========================================');

// Mock DOM with proper structure
let mockElements = {};

global.document = {
  getElementById: (id) => {
    console.log(`🔍 DOM: getElementById('${id}') called`);
    if (id === 'transactionSummary') {
      const element = {
        _innerHTML: '',
        get innerHTML() {
          return this._innerHTML;
        },
        set innerHTML(value) {
          console.log(`📝 DOM: Setting innerHTML for transactionSummary:`, value.substring(0, 100) + '...');
          this._innerHTML = value;
        }
      };
      mockElements[id] = element;
      return element;
    }
    if (id === 'mainContent') {
      return {
        appendChild: (child) => {
          console.log('📝 DOM: Appending child to mainContent');
        },
        querySelector: () => null,
        querySelectorAll: () => []
      };
    }
    return null;
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    className: '',
    id: '',
    innerHTML: '',
    appendChild: () => { }
  })
};

// Mock currency data
global.CURRENCIES = {
  USD: { symbol: '$', icon: '💵' },
  EUR: { symbol: '€', icon: '💶' },
  GBP: { symbol: '£', icon: '💷' }
};

try {
  console.log('🔍 Testing transaction summary rendering...');

  // Test 1: Can we create the transaction container?
  console.log('\n📋 TEST 1: Creating transaction container');
  const { ensureTransactionContainer } = await import('../ui/transaction/transactionRenderer.js');
  ensureTransactionContainer();
  console.log('✅ Container creation completed');

  // Test 2: Check if summary element exists after container creation
  console.log('\n📋 TEST 2: Checking for summary element');
  const summaryElement = document.getElementById('transactionSummary');
  if (summaryElement) {
    console.log('✅ transactionSummary element found after container creation');
  } else {
    console.log('❌ transactionSummary element NOT found after container creation');
  }

  // Test 3: Try to update the summary
  console.log('\n📋 TEST 3: Testing summary update');
  const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

  const testTransactions = [
    { id: 'tx1', currency: 'USD', income: 1000, expenses: 0 },
    { id: 'tx2', currency: 'USD', income: 0, expenses: 100 },
    { id: 'tx3', currency: 'EUR', income: 500, expenses: 0 }
  ];

  updateTransactionSummary(testTransactions);

  // Test 4: Check if content was set
  console.log('\n📋 TEST 4: Checking summary content');
  const finalElement = document.getElementById('transactionSummary');
  if (finalElement && finalElement.innerHTML) {
    console.log('✅ Summary content was set successfully');
    console.log('📄 Content preview:', finalElement.innerHTML.substring(0, 200) + '...');
  } else {
    console.log('❌ Summary content was NOT set');
  }

  console.log('\n🎉 DEBUG TEST COMPLETE');
  console.log('======================');

  // Summary of findings
  console.log('\n📊 FINDINGS:');
  console.log('- DOM createElement works:', typeof document.createElement === 'function');
  console.log('- getElementById works:', typeof document.getElementById === 'function');
  console.log('- mockElements created:', Object.keys(mockElements));

} catch (error) {
  console.error('❌ Error during debug test:', error);
  process.exit(1);
}
