/**
 * Test to verify transaction summary DOM element exists and is accessible
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TRANSACTION SUMMARY DOM CHECK TEST');
console.log('=====================================');

// Create DOM environment
const dom = new JSDOM(
  `<!DOCTYPE html>
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
  </html>`,
  {
    url: 'http://localhost',
    contentType: 'text/html',
    includeNodeLocations: true,
    storageQuota: 10000000
  }
);

// Set up global environment
global.document = dom.window.document;
global.window = dom.window;
global.localStorage = dom.window.localStorage;

// Mock console methods to capture output
const originalLog = console.log;
const originalError = console.error;
const logs = [];
const errors = [];

console.log = (...args) => {
  logs.push(args.join(' '));
  originalLog(...args);
};

console.error = (...args) => {
  errors.push(args.join(' '));
  originalError(...args);
};

// Test 1: Check if transaction section HTML structure is correctly generated
console.log('🔍 Testing transaction section HTML generation...');

try {
  // Import the transaction renderer
  const { ensureTransactionContainer } = await import('../ui/transaction/transactionRenderer.js');

  // Create the transaction container
  const container = ensureTransactionContainer();

  if (!container) {
    console.error('❌ Transaction container was not created!');
    process.exit(1);
  }

  console.log('✅ Transaction container created successfully');

  // Check if the summary element exists
  const summaryElement = document.getElementById('transactionSummary');
  if (!summaryElement) {
    console.error('❌ transactionSummary element not found in DOM!');
    process.exit(1);
  }

  console.log('✅ transactionSummary element found in DOM');

  // Check if it's in the correct location (section-header)
  const sectionHeader = summaryElement.closest('.section-header');
  if (!sectionHeader) {
    console.error('❌ transactionSummary is not in section-header!');
    process.exit(1);
  }

  console.log('✅ transactionSummary is correctly placed in section-header');

  // Check the complete DOM structure
  console.log('🔍 DOM structure verification:');
  console.log('   - Main content:', !!document.querySelector('.main-content'));
  console.log('   - Transaction section:', !!document.querySelector('.transactions-section'));
  console.log('   - Section header:', !!document.querySelector('.section-header'));
  console.log('   - Transaction summary:', !!document.querySelector('#transactionSummary'));
  console.log('   - Section content:', !!document.querySelector('.section-content'));
  console.log('   - Transaction filters:', !!document.querySelector('#transactionFilters'));

  // Test 2: Check the updateTransactionSummary function
  console.log('\n🔍 Testing updateTransactionSummary function...');

  const { updateTransactionSummary } = await import('../ui/transaction/transactionSummary.js');

  const testTransactions = [
    { id: 1, income: 100, expenses: 0, currency: 'USD', date: '2024-01-01' },
    { id: 2, income: 0, expenses: 50, currency: 'USD', date: '2024-01-02' }
  ];

  // Clear existing logs
  logs.length = 0;
  errors.length = 0;

  // Call the function
  updateTransactionSummary(testTransactions);

  // Give it some time to process (in case of async operations)
  await new Promise(resolve => setTimeout(resolve, 200));

  // Check if summary was updated
  const summaryContent = summaryElement.innerHTML;
  if (summaryContent.includes('No transaction data available') || summaryContent.trim() === '' || summaryContent.includes('<!-- Summary will be updated dynamically -->')) {
    console.error('❌ Transaction summary was not updated properly!');
    console.error('   Summary content:', summaryContent);
    console.error('   Logs:', logs);
    console.error('   Errors:', errors);
    process.exit(1);
  }

  console.log('✅ Transaction summary updated successfully');
  console.log('   Summary content length:', summaryContent.length);

  // Test 3: Check if the summary content is correct
  console.log('\n🔍 Testing summary content correctness...');

  if (summaryContent.includes('Income') && summaryContent.includes('Expenses') && summaryContent.includes('Net Balance')) {
    console.log('✅ Summary contains all expected sections');
  } else {
    console.error('❌ Summary missing expected sections');
    console.error('   Content:', summaryContent);
    process.exit(1);
  }

  if (summaryContent.includes('100.00') && summaryContent.includes('50.00')) {
    console.log('✅ Summary contains correct values');
  } else {
    console.error('❌ Summary does not contain correct values');
    console.error('   Content:', summaryContent);
    process.exit(1);
  }

  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log('✅ All tests passed!');
  console.log('✅ Transaction summary DOM element exists and is accessible');
  console.log('✅ Transaction summary is correctly placed in section-header');
  console.log('✅ updateTransactionSummary function works correctly');
  console.log('✅ Summary content is generated properly');

  // Check for any warnings or errors in the logs
  const relevantLogs = logs.filter(log => log.includes('DEBUG') || log.includes('ERROR'));
  if (relevantLogs.length > 0) {
    console.log('\n🔍 Relevant debug logs:');
    relevantLogs.forEach(log => console.log('   ', log));
  }

  if (errors.length > 0) {
    console.log('\n⚠️ Errors found:');
    errors.forEach(error => console.log('   ', error));
  }

  process.exit(0);

} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}
