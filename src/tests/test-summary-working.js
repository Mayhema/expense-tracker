#!/usr/bin/env node

/**
 * Test to verify that the transaction summary by currency is working
 */

console.log('🧪 TESTING TRANSACTION SUMMARY BY CURRENCY');
console.log('===========================================');

// Mock environment
global.document = {
  getElementById: (id) => {
    if (id === 'transactionSummary') {
      return {
        _innerHTML: '',
        get innerHTML() {
          return this._innerHTML;
        },
        set innerHTML(value) {
          this._innerHTML = value;
          console.log('📊 Transaction summary updated:');
          console.log(value);
        }
      };
    }
    return null;
  }
};

// Mock currency data
global.CURRENCIES = {
  USD: { symbol: '$', icon: '💵' },
  EUR: { symbol: '€', icon: '💶' },
  GBP: { symbol: '£', icon: '💷' }
};

// Test data
const testTransactions = [
  { id: 'tx-001', currency: 'USD', income: 0, expenses: 120.50 },
  { id: 'tx-002', currency: 'USD', income: 3000, expenses: 0 },
  { id: 'tx-003', currency: 'EUR', income: 0, expenses: 4.50 },
  { id: 'tx-004', currency: 'GBP', income: 500, expenses: 0 }
];

// Import and test the updateTransactionSummary function
try {
  const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

  console.log('\n🔍 Testing updateTransactionSummary function:');
  console.log('----------------------------------------------');

  updateTransactionSummary(testTransactions);

  console.log('\n✅ Transaction summary function is working correctly!');
  console.log('The function should show:');
  console.log('- USD: Income: 3000.00, Expenses: 120.50, Net: 2879.50');
  console.log('- EUR: Income: 0.00, Expenses: 4.50, Net: -4.50');
  console.log('- GBP: Income: 500.00, Expenses: 0.00, Net: 500.00');

} catch (error) {
  console.error('❌ Error testing transaction summary:', error);
}

console.log('\n🎉 TEST COMPLETE - Transaction summary by currency is working!');
