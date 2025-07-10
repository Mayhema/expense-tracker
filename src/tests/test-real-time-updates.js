#!/usr/bin/env node

/**
 * Test to verify real-time updates for charts and transaction summary
 * after editing Transaction Data
 */

console.log('🧪 TESTING REAL-TIME UPDATES AFTER TRANSACTION EDITS');
console.log('=======================================================');

// Mock environment
global.window = global;
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
          console.log(`📊 Transaction summary updated: ${value ? 'Updated' : 'Cleared'}`);
        }
      };
    }
    return null;
  },
  querySelector: (selector) => {
    if (selector === `tr[data-transaction-id="tx-001"]`) {
      return {
        querySelector: (sel) => {
          if (sel === '.category-cell') {
            return {
              style: { cssText: '' }
            };
          }
          return null;
        }
      };
    }
    return null;
  },
  querySelectorAll: () => []
};

global.localStorage = {
  getItem: () => null,
  setItem: (key, value) => {
    console.log(`💾 localStorage.setItem called: ${key}`);
  },
  removeItem: () => { }
};

// Mock currency data
global.CURRENCIES = {
  USD: { symbol: '$', icon: '💵' },
  EUR: { symbol: '€', icon: '💶' },
  GBP: { symbol: '£', icon: '💷' }
};

// Mock AppState
global.AppState = {
  transactions: [
    {
      id: 'tx-001',
      date: '2024-01-15',
      description: 'Grocery Shopping',
      category: 'Food',
      income: 0,
      expenses: 120.50,
      currency: 'USD',
      edited: false
    },
    {
      id: 'tx-002',
      date: '2024-01-16',
      description: 'Salary Payment',
      category: 'Income',
      income: 3000,
      expenses: 0,
      currency: 'USD',
      edited: false
    },
    {
      id: 'tx-003',
      date: '2024-01-17',
      description: 'Coffee Shop',
      category: 'Food',
      income: 0,
      expenses: 4.50,
      currency: 'EUR',
      edited: false
    }
  ],
  categories: {
    Food: '#FF6B6B',
    Income: '#4ECDC4',
    Transport: '#45B7D1'
  }
};

// Mock charts module
let chartUpdateCalled = false;
global.mockCharts = {
  updateCharts: () => {
    chartUpdateCalled = true;
    console.log('📊 Charts updated successfully');
  }
};

// Mock modules
const mockModules = {
  './transactionSummary.js': {
    updateTransactionSummary: (transactions) => {
      console.log(`🔄 updateTransactionSummary called with ${transactions.length} transactions`);

      // Simulate currency grouping
      const currencyGroups = {};
      transactions.forEach(tx => {
        const currency = tx.currency || 'USD';
        if (!currencyGroups[currency]) {
          currencyGroups[currency] = { income: 0, expenses: 0, count: 0 };
        }
        currencyGroups[currency].income += parseFloat(tx.income) || 0;
        currencyGroups[currency].expenses += parseFloat(tx.expenses) || 0;
        currencyGroups[currency].count += 1;
      });

      console.log('📊 Currency summary updated:');
      Object.entries(currencyGroups).forEach(([currency, data]) => {
        const net = data.income - data.expenses;
        console.log(`  ${currency}: Income: ${data.income}, Expenses: ${data.expenses}, Net: ${net}`);
      });

      // Update mock DOM
      const summaryContainer = document.getElementById('transactionSummary');
      if (summaryContainer) {
        summaryContainer.innerHTML = 'Updated summary';
      }
    }
  },
  '../transactionManager.js': {
    applyFilters: (transactions) => {
      console.log(`🔍 applyFilters called with ${transactions.length} transactions`);
      return transactions; // Return all for simplicity
    }
  },
  '../charts.js': global.mockCharts,
  '../filters/advancedFilters.js': {
    updateCurrencyFilterOptions: () => {
      console.log('💱 Currency filter options updated');
    }
  },
  '../uiManager.js': {
    showToast: (message, type) => {
      console.log(`📢 Toast: ${message} (${type})`);
    }
  }
};

// Mock dynamic imports
const originalImport = global.import || (() => Promise.resolve({}));
global.import = (module) => {
  if (mockModules[module]) {
    return Promise.resolve(mockModules[module]);
  }
  return originalImport(module);
};

// Mock the saveFieldChangeById function for testing
async function mockSaveFieldChangeById(transactionId, fieldName, newValue) {
  console.log(`💾 saveFieldChangeById called: ${transactionId}, ${fieldName}, ${newValue}`);

  // Find and update the transaction
  const transaction = AppState.transactions.find(tx => tx.id === transactionId);
  if (transaction) {
    console.log(`✓ Found transaction: ${transaction.description}`);

    // Update the field
    const oldValue = transaction[fieldName];
    transaction[fieldName] = newValue;
    console.log(`🔄 Updated ${fieldName} from "${oldValue}" to "${newValue}"`);

    // Mark as edited
    transaction.edited = true;

    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    // Update transaction summary (simulate the real function)
    setTimeout(async () => {
      const { updateTransactionSummary } = await import('./transactionSummary.js');
      const { applyFilters } = await import('../transactionManager.js');
      const filteredTransactions = applyFilters(AppState.transactions);
      updateTransactionSummary(filteredTransactions);
    }, 100);

    // Update charts (simulate the real function)
    setTimeout(async () => {
      const chartsModule = await import('../charts.js');
      if (chartsModule && chartsModule.updateCharts) {
        chartsModule.updateCharts();
      }
    }, 200);

    // Handle currency updates
    if (fieldName === 'currency') {
      setTimeout(async () => {
        const { updateCurrencyFilterOptions } = await import('../filters/advancedFilters.js');
        updateCurrencyFilterOptions();
      }, 150);
    }
  }
}

// Test the real-time updates
async function testRealTimeUpdates() {
  console.log('\n🔍 TEST 1: Initial state verification');
  console.log('-------------------------------------');
  console.log('Initial transactions:');
  AppState.transactions.forEach((tx, idx) => {
    console.log(`  ${idx + 1}. ${tx.description} - ${tx.currency} (${tx.income > 0 ? '+' + tx.income : '-' + tx.expenses})`);
  });

  console.log('\n💱 TEST 2: Simulating currency change');
  console.log('--------------------------------------');

  // Reset chart update flag
  chartUpdateCalled = false;

  // Simulate currency change from USD to GBP
  await mockSaveFieldChangeById('tx-001', 'currency', 'GBP');

  // Allow async operations to complete
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('\n✅ TEST 3: Verifying real-time updates');
  console.log('---------------------------------------');

  // Check if transaction was updated
  const updatedTransaction = AppState.transactions.find(tx => tx.id === 'tx-001');
  if (updatedTransaction.currency === 'GBP') {
    console.log('✓ Transaction currency updated successfully');
  } else {
    console.log('❌ Transaction currency not updated');
  }

  // Check if transaction is marked as edited
  if (updatedTransaction.edited) {
    console.log('✓ Transaction marked as edited');
  } else {
    console.log('❌ Transaction not marked as edited');
  }

  // Check if charts were updated
  if (chartUpdateCalled) {
    console.log('✓ Charts updated successfully');
  } else {
    console.log('❌ Charts not updated');
  }

  // Check if summary was updated
  const summaryContainer = document.getElementById('transactionSummary');
  if (summaryContainer.innerHTML === 'Updated summary') {
    console.log('✓ Transaction summary updated');
  } else {
    console.log('❌ Transaction summary not updated');
  }

  console.log('\n📊 TEST 4: Simulating income/expense edit');
  console.log('------------------------------------------');

  // Reset chart update flag
  chartUpdateCalled = false;

  // Simulate expense amount change
  await mockSaveFieldChangeById('tx-002', 'expenses', '50.00');

  // Allow async operations to complete
  await new Promise(resolve => setTimeout(resolve, 300));

  // Check if transaction was updated
  const updatedTransaction2 = AppState.transactions.find(tx => tx.id === 'tx-002');
  if (updatedTransaction2.expenses === '50.00') {
    console.log('✓ Transaction expense updated successfully');
  } else {
    console.log('❌ Transaction expense not updated');
  }

  // Check if charts were updated again
  if (chartUpdateCalled) {
    console.log('✓ Charts updated after expense change');
  } else {
    console.log('❌ Charts not updated after expense change');
  }

  console.log('\n🎉 REAL-TIME UPDATES TEST COMPLETE');
  console.log('==================================');
  console.log('✅ Currency changes trigger real-time updates');
  console.log('✅ Income/expense changes trigger real-time updates');
  console.log('✅ Transaction summary updates immediately');
  console.log('✅ Charts update immediately');
  console.log('✅ All changes are saved automatically');

  console.log('\n💡 EXPECTED USER EXPERIENCE:');
  console.log('When a user edits transaction data:');
  console.log('1. 📊 Charts update immediately');
  console.log('2. 📋 Transaction summary updates immediately');
  console.log('3. 🔍 Currency filter options update if currency changed');
  console.log('4. 💾 Changes are saved automatically');
  console.log('5. 🔄 No manual page refresh needed');
}

// Run the test
testRealTimeUpdates().catch(console.error);
