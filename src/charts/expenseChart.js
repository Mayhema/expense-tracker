import { destroyChart, validateChartData, createSafeChart } from './chartCore.js';
import { AppState } from '../core/appState.js';

let pieChart = null;
let showSubcategories = false;

/**
 * Groups transactions by category or subcategory
 * @param {Array} transactions - The transactions to process
 * @returns {Object} Object containing category totals
 */
function groupTransactionsByCategory(transactions) {
  const categoryTotals = {};

  transactions.forEach(tx => {
    // Only consider expenses (not income)
    const amount = parseFloat(tx.expenses) || 0;
    if (!amount) return;

    if (showSubcategories && tx.category && tx.subcategory) {
      // Use subcategory as the key when showing subcategories
      const key = `${tx.category}:${tx.subcategory}`;
      categoryTotals[key] = (categoryTotals[key] || 0) + amount;
    } else {
      // Just use main category
      const category = tx.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });

  return categoryTotals;
}

/**
 * Updates the expense pie chart with the given transactions
 * @param {Array} transactions - The transactions to display
 * @returns {boolean} True if successful, false otherwise
 */
/**
 * Creates chart configuration based on categories and totals
 * @param {Array} categories - List of categories
 * @param {Object} categoryTotals - Category totals
 * @returns {Object} Chart configuration
 */
function createChartConfig(categories, categoryTotals) {
  // Create colors array based on categories or subcategories
  const colors = categories.map(category => {
    if (showSubcategories && category.includes(':')) {
      // Extract subcategory color
      const [mainCat, subCat] = category.split(':');
      const mainCategory = AppState.categories[mainCat];
      if (mainCategory && typeof mainCategory === 'object' &&
        mainCategory.subcategories && mainCategory.subcategories[subCat]) {
        return mainCategory.subcategories[subCat];
      }
    }

    // Default to category color or generate based on name
    const mainCatName = category.includes(':') ? category.split(':')[0] : category;
    return generateCategoryColor(mainCatName);
  });

  // Create display labels (format subcategory labels)
  const displayLabels = categories.map(category => {
    if (category.includes(':')) {
      const [mainCat, subCat] = category.split(':');
      return `${mainCat}: ${subCat}`;
    }
    return category;
  });

  // Create the chart data
  const chartData = {
    labels: displayLabels,
    datasets: [{
      data: categories.map(cat => categoryTotals[cat]),
      backgroundColor: colors,
      borderWidth: 1
    }]
  };

  return {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw || 0;
              return '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              });
            }
          }
        },
        title: {
          display: true,
          text: showSubcategories ? 'Expenses by Subcategory' : 'Expenses by Category'
        }
      }
    }
  };
}

export function updateExpenseChart(transactions) {
  console.log(`Updating expense chart with ${transactions.length} transactions`);

  try {
    // Get the canvas
    const canvas = document.getElementById("expenseChart");
    if (!canvas) {
      console.error("Expense chart canvas not found");
      return false;
    }

    // Clean up existing chart
    pieChart = destroyChart(pieChart);

    // Validate data
    const validTransactions = validateChartData(transactions);

    // If no valid transactions, show no message (just empty chart)
    if (!validTransactions.length) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return false;
    }

    // Group by category or subcategory based on toggle
    const categoryTotals = groupTransactionsByCategory(validTransactions);

    // If no categories with expenses, show empty chart
    const categories = Object.keys(categoryTotals);
    if (!categories.length) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return false;
    }

    // Sort categories by amount
    categories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);

    // Create chart configuration
    const config = createChartConfig(categories, categoryTotals);

    // Ensure layout properties are properly defined
    const finalConfig = {
      type: 'pie',
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw || 0;
                return '$' + value.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                });
              }
            }
          },
          title: {
            display: true,
            text: showSubcategories ? 'Expenses by Subcategory' : 'Expenses by Category'
          }
        }
      }
    };

    // Use createSafeChart for reliable chart creation
    window.expenseChart = createSafeChart('expenseChart', finalConfig);

  } catch (error) {
    console.error("Error creating expense chart:", error);

    // Fall back to canvas rendering
    const canvas = document.getElementById('expenseChart');
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#333' : '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error creating expense chart', canvas.width / 2, canvas.height / 2);
      } catch (fallbackError) {
        console.error("Error creating fallback display:", fallbackError);
      }
    }
  }
}

/**
 * Adds a toggle button for subcategory breakdown
 */
function addToggleSubcategoriesButton() {
  // Check if button already exists
  let toggleBtn = document.getElementById('toggleSubcategoriesBtn');

  if (!toggleBtn) {
    // Create button
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggleSubcategoriesBtn';
    toggleBtn.className = 'toggle-subcategories-btn';
    toggleBtn.title = showSubcategories ? 'Show Main Categories' : 'Show Subcategories';
    toggleBtn.innerHTML = showSubcategories ? '📊 Main Categories' : '🔍 Show Subcategories';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.top = '10px';
    toggleBtn.style.right = '10px';
    toggleBtn.style.zIndex = '10';
    toggleBtn.style.padding = '5px 10px';
    toggleBtn.style.fontSize = '12px';
    toggleBtn.style.backgroundColor = '#f0f0f0';
    toggleBtn.style.border = '1px solid #ddd';
    toggleBtn.style.borderRadius = '4px';
    toggleBtn.style.cursor = 'pointer';

    // Find the chart wrapper to append
    const chartWrapper = document.getElementById('expenseChart').closest('.chart-wrapper');
    if (chartWrapper) {
      chartWrapper.style.position = 'relative';
      chartWrapper.appendChild(toggleBtn);
    }

    // Add event listener
    toggleBtn.addEventListener('click', () => {
      showSubcategories = !showSubcategories;
      toggleBtn.title = showSubcategories ? 'Show Main Categories' : 'Show Subcategories';
      toggleBtn.innerHTML = showSubcategories ? '📊 Main Categories' : '🔍 Show Subcategories';

      // Update chart with current transactions
      import('../core/appState.js').then(module => {
        updateExpenseChart(module.AppState.transactions);
      });
    });
  } else {
    // Just update existing button text
    toggleBtn.title = showSubcategories ? 'Show Main Categories' : 'Show Subcategories';
    toggleBtn.innerHTML = showSubcategories ? '📊 Main Categories' : '🔍 Show Subcategories';
  }
}

/**
 * Helper function to get or generate category color
 * @param {string} categoryName - Category name
 * @returns {string} Category color
 */
function generateCategoryColor(categoryName) {
  if (AppState.categories[categoryName]) {
    const catValue = AppState.categories[categoryName];
    if (typeof catValue === 'string') {
      return catValue;
    } else if (catValue && catValue.color) {
      return catValue.color;
    }
  }

  // Fallback to a stable generated color
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
    hash = hash & hash;
  }
  return `#${Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0')}`;
}

/**
 * Cleans up the expense chart
 */
export function cleanupExpenseChart() {
  pieChart = destroyChart(pieChart);
}
