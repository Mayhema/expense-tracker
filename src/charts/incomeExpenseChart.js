import { destroyChart, calculateIncomeExpenseTotals, getChartColors } from './chartCore.js';

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
