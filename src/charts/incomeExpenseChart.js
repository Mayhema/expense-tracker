import { createChart, destroyChart, updateChartData, getChartColors } from './chartCore.js';

// Store chart instance
let incomeExpenseChart = null;

/**
 * Destroy existing income/expense chart instance
 */
export function destroyIncomeExpenseChart() {
  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
    incomeExpenseChart = null;
    console.log("Income/Expense chart destroyed");
  }
}

/**
 * Create income vs expense chart using the new registration system
 */
export function createIncomeExpenseChart(transactions, createChartFn) {
  try {
    console.log("Creating income/expense chart...");

    if (!transactions || transactions.length === 0) {
      return null;
    }

    const totals = calculateIncomeExpenseTotals(transactions);
    const colors = getChartColors(document.body.classList.contains('dark-mode'));

    if (totals.income === 0 && totals.expenses === 0) {
      return null;
    }

    const config = {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{
          data: [totals.income, totals.expenses],
          backgroundColor: [colors.income, colors.expenses],
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
            position: 'bottom',
            labels: {
              color: colors.text,
              padding: 20
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

    return createChartFn('incomeExpenseChart', config);
  } catch (error) {
    console.error("Error creating income/expense chart:", error);
    return null;
  }
}

/**
 * Update the income vs expense chart
 */
export function updateIncomeExpenseChart(transactions) {
  return createIncomeExpenseChart(transactions, (canvasId, config) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, config);
  });
}

/**
 * Clear the income vs expense chart
 */
export function clearIncomeExpenseChart() {
  if (incomeExpenseChart) {
    try {
      incomeExpenseChart.destroy();
      incomeExpenseChart = null;
      console.log("Income/expense chart cleared");
    } catch (error) {
      console.error("Error clearing income/expense chart:", error);
    }
  }
}

// Helper function to display no data message - renamed to avoid conflict
function showNoDataMessage(canvas, message) {
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

/**
 * Cleans up the income vs expense chart
 */
export function cleanupIncomeExpenseChart() {
  incomeExpenseChart = destroyChart(incomeExpenseChart);
}

/**
 * Initialize income vs expense chart with error handling
 */
export function initializeIncomeExpenseChart() {
  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas) {
    console.warn("Income expense chart canvas not found - charts section may not be loaded yet");

    // Try again after a delay
    setTimeout(() => {
      const retryCanvas = document.getElementById('incomeExpenseChart');
      if (retryCanvas) {
        console.log("Found income expense chart canvas on retry, initializing...");
        initializeIncomeExpenseChartWithCanvas(retryCanvas);
      } else {
        console.error("Income expense chart canvas still not found after retry. Check if charts section exists in HTML.");
      }
    }, 1000);
    return;
  }

  initializeIncomeExpenseChartWithCanvas(canvas);
}

/**
 * Initialize chart with canvas element
 */
function initializeIncomeExpenseChartWithCanvas(canvas) {
  // Get colors for income and expense
  const isDarkMode = document.body.classList.contains('dark-mode');
  const colors = getChartColors(2, isDarkMode);

  const config = {
    type: 'bar',
    data: {
      labels: ['Total'],
      datasets: [{
        label: 'Income',
        data: [0],
        backgroundColor: colors[0],
        borderColor: colors[0],
        borderWidth: 1
      }, {
        label: 'Expenses',
        data: [0],
        backgroundColor: colors[1],
        borderColor: colors[1],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false // Title handled by HTML h3
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  createChart(canvas, 'bar', config.data, config.options);
  console.log("Income expense chart initialized successfully");
}
