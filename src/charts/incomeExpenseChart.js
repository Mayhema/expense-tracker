import { createChart, destroyChart, getChartColors } from './chartCore.js';

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
 * Creates the income vs expense chart
 */
export async function createIncomeExpenseChart(transactions) {
  console.log('Creating income/expense chart...');

  try {
    // Dynamic import Chart.js
    const ChartJS = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js');
    const Chart = ChartJS.default || ChartJS.Chart;

    if (!Chart) {
      throw new Error('Chart.js failed to load');
    }

    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) {
      console.warn('Income expense chart canvas not found');
      return null;
    }

    // Destroy existing chart
    if (window.incomeExpenseChartInstance) {
      window.incomeExpenseChartInstance.destroy();
    }

    // Get chart data
    const data = getIncomeExpenseData(transactions);

    if (!data || (data.income === 0 && data.expenses === 0)) {
      showNoDataMessage(canvas);
      return null;
    }

    // Create the chart
    const chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{
          data: [data.income, data.expenses],
          backgroundColor: ['#4CAF50', '#f44336'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const total = data.income + data.expenses;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Store reference
    window.incomeExpenseChartInstance = chartInstance;

    console.log('✓ income/expense chart created successfully');
    return chartInstance;

  } catch (error) {
    console.error('❌ Error creating income/expense chart:', error);
    return null;
  }
}

/**
 * Update the income vs expense chart
 */
export function updateIncomeExpenseChart(transactions) {
  return createIncomeExpenseChart(transactions);
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

/**
 * Get income and expense data from transactions
 */
function getIncomeExpenseData(transactions) {
  const totals = { income: 0, expenses: 0 };

  if (!transactions || !Array.isArray(transactions)) {
    return totals;
  }

  transactions.forEach(tx => {
    totals.income += parseFloat(tx.income || 0);
    totals.expenses += parseFloat(tx.expenses || 0);
  });

  return totals;
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

/**
 * Calculate income and expense totals from transactions
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Object with income and expense totals
 */
function calculateIncomeExpenseTotals(transactions) {
  const totals = {
    income: 0,
    expenses: 0
  };

  if (!transactions || !Array.isArray(transactions)) {
    return totals;
  }

  transactions.forEach(transaction => {
    const income = parseFloat(transaction.income || 0);
    const expenses = parseFloat(transaction.expenses || 0);

    totals.income += income;
    totals.expenses += expenses;
  });

  return totals;
}
