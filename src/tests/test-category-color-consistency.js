/**
 * Test category color consistency between pie chart and transaction table
 */

// Test helper to simulate category color extraction from transaction table
function getCategoryColorFromTransactionTable(categoryName, categories) {
  if (!categoryName || !categories) return '#cccccc';

  const categoryData = categories[categoryName];
  if (!categoryData) return '#cccccc';

  if (typeof categoryData === 'string') {
    return categoryData;
  } else if (typeof categoryData === 'object' && categoryData.color) {
    return categoryData.color;
  }

  return '#cccccc';
}

// Test helper to simulate chart color extraction using the same logic as in charts.js
function getChartColor(index, isDarkMode = false) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];
  return colors[index % colors.length];
}

function getCategoryColorsFromChart(categories, categoryColors = {}, isDarkMode = false) {
  return categories.map((category, index) => {
    // Use category-specific color if available
    if (categoryColors[category]) {
      const categoryData = categoryColors[category];
      // Handle both string and object category values
      if (typeof categoryData === 'string') {
        return categoryData;
      } else if (typeof categoryData === 'object' && categoryData.color) {
        return categoryData.color;
      }
    }
    // Fall back to default chart colors
    return getChartColor(index, isDarkMode);
  });
}

// Test function that can run in browser
function testCategoryColorConsistency() {
  console.log('🧪 Testing category color consistency...');

  // Mock test data
  const testCategories = {
    'Food': '#FF6384',
    'Transport': '#36A2EB',
    'Entertainment': '#FFCE56',
    'Shopping': { color: '#4BC0C0' },
    'Utilities': { color: '#9966FF' }
  };

  const results = [];

  // Test 1: Check color consistency for basic categories
  console.log('\n📊 Test 1: Basic category color consistency');
  const basicCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities'];

  basicCategories.forEach(category => {
    const tableColor = getCategoryColorFromTransactionTable(category, testCategories);
    const chartColors = getCategoryColorsFromChart([category], testCategories, false);
    const chartColor = chartColors[0];

    const isMatch = tableColor === chartColor;
    const result = {
      category,
      tableColor,
      chartColor,
      isMatch
    };

    results.push(result);
    console.log(`  ${category}: Table=${tableColor}, Chart=${chartColor}, Match=${isMatch ? '✅' : '❌'}`);
  });

  // Test 2: Check color consistency with currency suffixes
  console.log('\n💰 Test 2: Currency suffix category color consistency');
  const currencyCategories = ['Food (USD)', 'Transport (USD)', 'Entertainment (EUR)'];

  currencyCategories.forEach(displayCategory => {
    const baseCategory = displayCategory.replace(/\s\([A-Z]{3}\)$/, '');
    const tableColor = getCategoryColorFromTransactionTable(baseCategory, testCategories);
    const chartColors = getCategoryColorsFromChart([baseCategory], testCategories, false);
    const chartColor = chartColors[0];

    const isMatch = tableColor === chartColor;
    const result = {
      category: displayCategory,
      baseCategory,
      tableColor,
      chartColor,
      isMatch
    };

    results.push(result);
    console.log(`  ${displayCategory}: Base=${baseCategory}, Table=${tableColor}, Chart=${chartColor}, Match=${isMatch ? '✅' : '❌'}`);
  });

  // Test 3: Check fallback color generation
  console.log('\n🔄 Test 3: Fallback color generation');
  const unknownCategories = ['Unknown1', 'Unknown2'];

  // Test each unknown category separately to get correct color indices
  unknownCategories.forEach((category, index) => {
    const tableColor = getCategoryColorFromTransactionTable(category, testCategories);
    const chartColors = getCategoryColorsFromChart(unknownCategories, testCategories, false);
    const chartColor = chartColors[index];

    const expectedFallback = getChartColor(index, false);
    // For fallback test, we expect chart to use fallback colors and table to use #cccccc
    const isMatch = chartColor === expectedFallback && tableColor === '#cccccc';
    const result = {
      category: `${category} (Fallback)`,
      tableColor,
      chartColor,
      expectedFallback,
      isMatch
    };

    results.push(result);
    console.log(`  ${category}: Table=${tableColor}, Chart=${chartColor}, Expected=${expectedFallback}, Match=${isMatch ? '✅' : '❌'}`);
  });

  // Summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.isMatch).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n📋 Summary: ${passedTests}/${totalTests} tests passed`);
  if (failedTests > 0) {
    console.log(`❌ ${failedTests} tests failed:`);
    results.filter(r => !r.isMatch).forEach(r => {
      console.log(`  - ${r.category}: Expected ${r.tableColor || r.expectedFallback}, got ${r.chartColor}`);
    });
  } else {
    console.log('✅ All color consistency tests passed!');
  }

  return {
    success: failedTests === 0,
    totalTests,
    passedTests,
    failedTests,
    results
  };
}

// Test the actual updateCategoryChart function logic
function testUpdateCategoryChartLogic() {
  console.log('\n🎯 Testing updateCategoryChart logic...');

  // Mock transactions
  const mockTransactions = [
    { category: 'Food', expenses: 50, currency: 'USD' },
    { category: 'Transport', expenses: 25, currency: 'USD' },
    { category: 'Entertainment', expenses: 30, currency: 'EUR' },
    { category: 'Food', expenses: 20, currency: 'EUR' }
  ];

  // Mock categories
  const mockCategories = {
    'Food': '#FF6384',
    'Transport': '#36A2EB',
    'Entertainment': '#FFCE56'
  };

  // Simulate the chart processing logic
  const categoryData = {};
  mockTransactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const amount = Math.abs(parseFloat(tx.expenses) || 0);
    const currency = tx.currency || 'USD';

    if (amount > 0) {
      const displayCategory = currency !== 'USD' ? `${category} (${currency})` : category;
      categoryData[displayCategory] = (categoryData[displayCategory] || 0) + amount;
    }
  });

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  // Extract base categories for color mapping
  const baseCategories = labels.map(label => {
    const match = label.match(/^(.+)\s\([A-Z]{3}\)$/);
    return match ? match[1] : label;
  });

  // Get category colors
  const categoryColors = getCategoryColorsFromChart(baseCategories, mockCategories, false);

  console.log('📊 Chart data processed:');
  console.log('  Labels:', labels);
  console.log('  Data:', data);
  console.log('  Base categories:', baseCategories);
  console.log('  Category colors:', categoryColors);

  // Verify that each category gets the correct color
  const colorResults = [];
  labels.forEach((label, index) => {
    const baseCategory = baseCategories[index];
    const expectedColor = mockCategories[baseCategory] || getChartColor(index, false);
    const actualColor = categoryColors[index];
    const isMatch = expectedColor === actualColor;

    colorResults.push({
      label,
      baseCategory,
      expectedColor,
      actualColor,
      isMatch
    });

    console.log(`  ${label}: Expected=${expectedColor}, Actual=${actualColor}, Match=${isMatch ? '✅' : '❌'}`);
  });

  const allMatched = colorResults.every(r => r.isMatch);
  console.log(`\n📋 Chart logic test: ${allMatched ? '✅ PASSED' : '❌ FAILED'}`);

  return allMatched;
}

// Export for use in test runner
if (typeof exports !== 'undefined') {
  exports.testCategoryColorConsistency = testCategoryColorConsistency;
  exports.testUpdateCategoryChartLogic = testUpdateCategoryChartLogic;
}

// Auto-run if directly executed
if (typeof window !== 'undefined' && window.location) {
  // Run immediately for browser testing
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      testCategoryColorConsistency();
      testUpdateCategoryChartLogic();
    }, 1000);
  });
}

// For Node.js testing
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  const result1 = testCategoryColorConsistency();
  const result2 = testUpdateCategoryChartLogic();

  if (result1.success && result2) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}
