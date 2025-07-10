/**
 * Test the actual getCategoryColors function with real-world data
 */

// Mock the getChartColor function
function getChartColor(index, isDarkMode = false) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];
  return colors[index % colors.length];
}

// Copy the actual getCategoryColors function from chartCore.js
function getCategoryColors(categories, categoryColors = {}, isDarkMode = false) {
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

// Test with real-world category data structures
function testRealWorldScenario() {
  console.log('🌍 Testing real-world scenario...');

  // Simulate different category data structures that might exist in AppState
  const realWorldCategories = {
    'Food': '#FF6384',                           // String format
    'Transport': { color: '#36A2EB' },          // Object format
    'Entertainment': { color: '#FFCE56', subcategories: {} }, // Object with extra properties
    'Shopping': '#4BC0C0',                      // String format
    'Utilities': { color: '#9966FF' }           // Object format
  };

  const testCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Unknown'];
  const colors = getCategoryColors(testCategories, realWorldCategories, false);

  console.log('📊 Results:');
  colors.forEach((color, index) => {
    const category = testCategories[index];
    const isString = typeof color === 'string';
    const isValidColor = /^#[0-9A-F]{6}$/i.test(color);

    console.log(`  ${category}: ${color} (String: ${isString}, Valid: ${isValidColor})`);

    if (!isString || !isValidColor) {
      console.error(`❌ Invalid color for ${category}: ${color}`);
      return false;
    }
  });

  // Check that all colors are valid strings
  const allValid = colors.every(color =>
    typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color)
  );

  console.log(`\n📋 All colors valid: ${allValid ? '✅' : '❌'}`);

  return allValid;
}

// Run the test
const success = testRealWorldScenario();
console.log(`\n🎯 Test result: ${success ? 'PASSED' : 'FAILED'}`);

// Exit with appropriate code for Node.js
if (typeof process !== 'undefined' && process.exit) {
  process.exit(success ? 0 : 1);
}
