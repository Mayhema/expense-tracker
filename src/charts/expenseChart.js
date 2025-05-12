import { destroyChart, displayNoDataMessage, validateChartData, generateCategoryColors, createSafeChart } from './chartCore.js';
import { AppState } from '../core/appState.js';

let pieChart = null;
let showSubcategories = false;

/**
 * Updates the expense pie chart with the given transactions
 * @param {Array} transactions - The transactions to display
 * @returns {boolean} True if successful, false otherwise
 */
export function updateExpenseChart(transactions) {
  try {
    console.log("Updating expense chart with", transactions?.length || 0, "transactions");

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
    const categoryTotals = {};

    validTransactions.forEach(tx => {
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

    // If no categories with expenses, show empty chart
    const categories = Object.keys(categoryTotals);
    if (!categories.length) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return false;
    }

    // Sort categories by amount
    categories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);

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

    // Create the chart using the safer method
    pieChart = createSafeChart("expenseChart", {
      type: 'pie',
      data: chartData,
      options: {
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
        },
        layout: {
          padding: 20
        }
      }
    });

    // Add toggle button for subcategories
    addToggleSubcategoriesButton();

    return !!pieChart;
  } catch (error) {
    console.error("Error updating expense chart:", error);
    return false;
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
