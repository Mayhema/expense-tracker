import { createChart, destroyChart, updateChartData, getCategoryColors } from './chartCore.js';
import { AppState } from '../core/appState.js';

let pieChart = null;
let showSubcategories = false;

// Store chart instance
let expenseCategoryChart = null;

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

/**
 * Helper function to clear canvas
 * @param {HTMLCanvasElement} canvas - The canvas to clear
 */
function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return false;
}

/**
 * Helper function to handle error display
 * @param {Error} error - The error that occurred
 */
function handleChartError(error) {
  console.error("Error creating expense chart:", error);

  // Fall back to canvas rendering
  const canvas = document.getElementById('expenseChart');
  if (!canvas) return;

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

/**
 * Initialize expense chart with proper error handling
 */
export function initializeExpenseChart() {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) {
    console.warn("Expense chart canvas not found - charts section may not be loaded yet");

    // Try again after a delay to allow DOM to load
    setTimeout(() => {
      const retryCanvas = document.getElementById('expenseChart');
      if (retryCanvas) {
        console.log("Found expense chart canvas on retry, initializing...");
        initializeExpenseChartWithCanvas(retryCanvas);
      } else {
        console.error("Expense chart canvas still not found after retry. Check if charts section exists in HTML.");
      }
    }, 1000);
    return;
  }

  initializeExpenseChartWithCanvas(canvas);
}

/**
 * Initialize chart with canvas element
 */
function initializeExpenseChartWithCanvas(canvas) {
  const config = {
    type: 'doughnut',
    data: {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e0e0e0'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false // Title is handled by HTML h3
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        }
      }
    }
  };

  createChart(canvas, 'doughnut', config.data, config.options);
  console.log("Expense chart initialized successfully");
}

/**
 * Update expense chart with transaction data
 */
export function updateExpenseChart(transactions) {
  if (!transactions || transactions.length === 0) {
    console.log("No transactions for expense chart");
    return;
  }

  // Group expenses by category
  const categoryTotals = {};
  transactions.forEach(tx => {
    const expense = parseFloat(tx.expenses) || 0;
    if (expense > 0) {
      const category = tx.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense;
    }
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  if (categories.length === 0) {
    console.log("No expense categories found");
    return;
  }

  // Get category colors from AppState or use chart colors
  import('../core/appState.js').then(module => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const colors = getCategoryColors(categories, module.AppState.categories, isDarkMode);

    const chartData = {
      labels: categories,
      datasets: [{
        data: amounts,
        backgroundColor: colors,
        borderWidth: 1
      }]
    };

    updateChartData('expenseChart', chartData);
    console.log(`Updated expense chart with ${categories.length} categories`);
  });
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

/**
 * Shows empty state for expense chart with improved aesthetics
 */
function showEmptyStateChart() {
  const ctx = document.getElementById("expenseChart");
  if (!ctx) return;

  // Use createSafeChart to create a blank chart without any "No data" text
  if (window.expenseChart) {
    window.expenseChart.destroy();
  }

  window.expenseChart = createSafeChart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        // Remove the "No data" text entirely
        title: { display: false }
      }
    }
  });
}

/**
 * Destroy existing expense category chart instance
 */
export function destroyExpenseChart() {
  if (expenseCategoryChart) {
    expenseCategoryChart.destroy();
    expenseCategoryChart = null;
    console.log("Expense category chart destroyed");
  }
}

/**
 * Create expense category chart using the new registration system
 */
export function createExpenseCategoryChart(transactions, createChartFn) {
  try {
    console.log("Creating expense category chart...");

    if (!transactions || transactions.length === 0) {
      return null;
    }

    const categoryTotals = calculateCategoryTotals(transactions);
    const colors = getChartColors(document.body.classList.contains('dark-mode'));

    if (Object.keys(categoryTotals).length === 0) {
      return null;
    }

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const config = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.categories.slice(0, labels.length),
          borderWidth: 2,
          borderColor: colors.background
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: colors.text,
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    return createChartFn('expenseCategoryChart', config);
  } catch (error) {
    console.error("Error creating expense category chart:", error);
    return null;
  }
}

// Keep the old function for backwards compatibility
export function updateExpenseCategoryChart(transactions) {
  return createExpenseCategoryChart(transactions, (canvasId, config) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, config);
  });
}

/**
 * Clear the expense category chart
 */
export function clearExpenseCategoryChart() {
  if (expenseCategoryChart) {
    try {
      expenseCategoryChart.destroy();
      expenseCategoryChart = null;
      console.log("Expense category chart cleared");
    } catch (error) {
      console.error("Error clearing expense category chart:", error);
    }
  }
}

// Helper function to display no data message
function displayNoDataMessage(canvas, message) {
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '14px Arial';

  // Determine text color based on theme
  const isDarkMode = document.body.classList.contains('dark-mode');
  ctx.fillStyle = isDarkMode ? '#aaaaaa' : '#666666';

  // Draw message in center of canvas
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}
