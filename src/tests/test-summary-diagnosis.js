/**
 * COMPREHENSIVE TRANSACTION SUMMARY DIAGNOSIS
 *
 * This test checks all possible reasons why the transaction summary might not be visible:
 * 1. CSS visibility issues
 * 2. Empty transaction data
 * 3. DOM element placement issues
 * 4. Timing issues
 * 5. Filter conflicts
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('🚀 COMPREHENSIVE TRANSACTION SUMMARY DIAGNOSIS');
console.log('==============================================');

// Test 1: Check if CSS files exist and contain the right styles
function testCSSFiles() {
  console.log('\n🔍 TEST 1: CSS Files Check');
  console.log('===========================');

  const cssFiles = [
    'src/styles/main.css',
    'src/styles/transactions.css'
  ];

  for (const cssFile of cssFiles) {
    const fullPath = path.join(projectRoot, cssFile);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${cssFile} exists`);

      const content = fs.readFileSync(fullPath, 'utf8');
      const hasTransactionSummary = content.includes('.transaction-summary');
      console.log(`   - Contains .transaction-summary: ${hasTransactionSummary}`);

      if (hasTransactionSummary) {
        const summaryRules = content.match(/\.transaction-summary[^}]*{[^}]*}/g);
        if (summaryRules) {
          console.log(`   - Found ${summaryRules.length} .transaction-summary rules`);
          summaryRules.forEach((rule, index) => {
            console.log(`     Rule ${index + 1}: ${rule.substring(0, 100)}...`);
          });
        }
      }
    } else {
      console.log(`❌ ${cssFile} not found`);
    }
  }
}

// Test 2: Check if HTML structure is correct
async function testHTMLStructure() {
  console.log('\n🔍 TEST 2: HTML Structure Check');
  console.log('===============================');

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

  try {
    const { ensureTransactionContainer } = await import('../ui/transaction/transactionRenderer.js');

    const container = ensureTransactionContainer();

    if (container) {
      console.log('✅ Transaction container created');

      // Check structure
      const sectionHeader = container.querySelector('.section-header');
      const sectionContent = container.querySelector('.section-content');
      const summaryElement = container.querySelector('#transactionSummary');

      console.log('   - Has section-header:', !!sectionHeader);
      console.log('   - Has section-content:', !!sectionContent);
      console.log('   - Has #transactionSummary:', !!summaryElement);

      if (summaryElement) {
        console.log('   - Summary parent:', summaryElement.parentElement?.className);
        console.log('   - Summary class:', summaryElement.className);
        console.log('   - Summary in section-header:', summaryElement.closest('.section-header') ? 'YES' : 'NO');
      }

      // Check if summary element has any styling issues
      const summaryHTML = container.innerHTML;
      const summaryIndex = summaryHTML.indexOf('id="transactionSummary"');
      if (summaryIndex !== -1) {
        console.log('✅ Summary element found in HTML');
        const surroundingHTML = summaryHTML.substring(Math.max(0, summaryIndex - 100), summaryIndex + 200);
        console.log('   - Surrounding HTML:', surroundingHTML);
      }

    } else {
      console.error('❌ Transaction container not created');
    }
  } catch (error) {
    console.error('❌ Error creating container:', error.message);
  }
}

// Test 3: Check transaction data and summary update
async function testTransactionSummary() {
  console.log('\n🔍 TEST 3: Transaction Summary Update');
  console.log('====================================');

  try {
    const { AppState } = await import('../core/appState.js');

    // Test with no data
    console.log('📊 Testing with no transaction data...');
    AppState.transactions = [];

    const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

    const summaryElement = document.getElementById('transactionSummary');
    if (summaryElement) {
      updateTransactionSummary(AppState.transactions);

      await new Promise(resolve => setTimeout(resolve, 100));

      const content = summaryElement.innerHTML;
      console.log('   - Content length:', content.length);
      console.log('   - Has no data message:', content.includes('No transaction data available'));

      if (content.includes('No transaction data available') || content.trim() === '') {
        console.log('✅ Correctly shows no data message');
      } else {
        console.log('⚠️ Unexpected content for empty data');
      }
    }

    // Test with sample data
    console.log('\n📊 Testing with sample transaction data...');
    AppState.transactions = [
      { id: 1, income: 1000, expenses: 0, currency: 'USD', date: '2024-01-01', category: 'Salary' },
      { id: 2, income: 0, expenses: 200, currency: 'USD', date: '2024-01-02', category: 'Food' },
      { id: 3, income: 500, expenses: 0, currency: 'USD', date: '2024-01-03', category: 'Bonus' }
    ];

    if (summaryElement) {
      updateTransactionSummary(AppState.transactions);

      await new Promise(resolve => setTimeout(resolve, 100));

      const content = summaryElement.innerHTML;
      console.log('   - Content length:', content.length);
      console.log('   - Contains Income:', content.includes('Income'));
      console.log('   - Contains Expenses:', content.includes('Expenses'));
      console.log('   - Contains Net Balance:', content.includes('Net Balance'));
      console.log('   - Contains 1500.00 (total income):', content.includes('1500.00'));
      console.log('   - Contains 200.00 (total expenses):', content.includes('200.00'));

      if (content.includes('Income') && content.includes('Expenses') && content.includes('Net Balance')) {
        console.log('✅ Summary shows correct structure');
      } else {
        console.log('❌ Summary missing expected elements');
      }
    }

  } catch (error) {
    console.error('❌ Error testing summary:', error.message);
  }
}

// Test 4: Check complete initialization flow
async function testCompleteFlow() {
  console.log('\n🔍 TEST 4: Complete Initialization Flow');
  console.log('=======================================');

  try {
    const { AppState } = await import('../core/appState.js');

    // Set up realistic transaction data
    AppState.transactions = [
      { id: 1, income: 1000, expenses: 0, currency: 'USD', date: '2024-01-01', category: 'Salary' },
      { id: 2, income: 0, expenses: 200, currency: 'USD', date: '2024-01-02', category: 'Food' },
      { id: 3, income: 500, expenses: 0, currency: 'USD', date: '2024-01-03', category: 'Bonus' }
    ];

    console.log('📊 Set up AppState with', AppState.transactions.length, 'transactions');

    // Follow the exact initialization sequence from main.js
    const { initializeTransactionManager } = await import('../ui/transactionManager.js');

    console.log('🚀 Calling initializeTransactionManager...');
    initializeTransactionManager();

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check final state
    const summaryElement = document.getElementById('transactionSummary');
    if (summaryElement) {
      console.log('✅ Summary element exists after initialization');

      const content = summaryElement.innerHTML;
      console.log('   - Content length:', content.length);
      console.log('   - Visible in section-header:', summaryElement.closest('.section-header') ? 'YES' : 'NO');
      console.log('   - Has transaction data:', !content.includes('No transaction data available') && content.trim() !== '');

      if (content.includes('Income') && content.includes('Expenses') && content.includes('Net Balance')) {
        console.log('✅ Summary shows complete transaction data');
      } else {
        console.log('❌ Summary not showing transaction data properly');
        console.log('   - First 200 chars:', content.substring(0, 200));
      }
    } else {
      console.error('❌ Summary element not found after initialization');
    }

  } catch (error) {
    console.error('❌ Error in complete flow:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('Starting comprehensive diagnosis...\n');

  testCSSFiles();
  await testHTMLStructure();
  await testTransactionSummary();
  await testCompleteFlow();

  console.log('\n📊 DIAGNOSIS COMPLETE');
  console.log('=====================');
  console.log('✅ All tests completed');
  console.log('📋 If the summary is not visible in the real app, check:');
  console.log('   1. Do you have transaction data loaded?');
  console.log('   2. Are filters clearing out all transactions?');
  console.log('   3. Is the summary element hidden by CSS?');
  console.log('   4. Are there JavaScript errors in the console?');
  console.log('   5. Is the app initialization completing?');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});
