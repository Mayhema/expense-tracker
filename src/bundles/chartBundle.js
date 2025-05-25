/**
 * Chart Bundle - Consolidates all chart-related functionality
 * This reduces the number of separate HTTP requests
 */

import { AppState } from '../core/appState.js';
import { showToast } from '../ui/uiManager.js';

// Re-export all chart functionality
export { updateTimelineChart } from '../charts/timelineChart.js';
export { updateIncomeExpenseChart } from '../charts/incomeExpenseChart.js';
export { updateExpenseChart, updateExpenseCategoryChart } from '../charts/expenseChart.js';

/**
 * Chart instances
 */
let incomeExpenseChart = null;
let expenseCategoryChart = null;
let timelineChart = null;

/**
 * Initialize all charts
 */
export function initializeCharts() {
  console.log("Initializing charts...");

  try {
    initializeIncomeExpenseChart();
    initializeExpenseCategoryChart();
    initializeTimelineChart();
    updateChartsWithCurrentData();
    console.log("Charts initialized successfully");
  } catch (error) {
    console.error("Error initializing charts:", error);
    showToast("Error initializing charts", "error");
  }
}

/**
 * Initialize Income vs Expense Chart
 */
function initializeIncomeExpenseChart() {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) {
    console.warn("Income/Expense chart canvas not found");
    return;
  }

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Initialize Expense Category Chart
 */
function initializeExpenseCategoryChart() {
  const ctx = document.getElementById('expenseCategoryChart');
  if (!ctx) {
    console.warn("Expense category chart canvas not found");
    return;
  }

  if (expenseCategoryChart) {
    expenseCategoryChart.destroy();
  }

  expenseCategoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Initialize Timeline Chart
 */
function initializeTimelineChart() {
  const ctx = document.getElementById('timelineChart');
  if (!ctx) {
    console.warn("Timeline chart canvas not found");
    return;
  }

  if (timelineChart) {
    timelineChart.destroy();
  }

  timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Income',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false
      }, {
        label: 'Expenses',
        data: [],
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

/**
 * Initialize all chart components in one go
 */
export async function initializeAllCharts() {
  const { initializeCharts } = await import('../charts/chartManager.js');

  // Initialize chart components
  initializeCharts();

  // Set up chart theme based on current mode
  const isDarkMode = document.body.classList.contains('dark-mode');
  updateChartTheme(isDarkMode);

  console.log("All chart components initialized");
}

/**
 * Updates chart theme colors based on dark mode state
 */
export function updateChartTheme(isDarkMode) {
  // Default colors for charts
  const textColor = isDarkMode ? '#e0e0e0' : '#666666';
  const gridColor = isDarkMode ? '#444444' : '#dddddd';

  // Apply to Chart.js defaults
  if (window.Chart && window.Chart.defaults) {
    // Update global chart options
    window.Chart.defaults.color = textColor;
    window.Chart.defaults.borderColor = gridColor;

    // Update scales
    if (window.Chart.defaults.scales) {
      window.Chart.defaults.scales.x = window.Chart.defaults.scales.x || {};
      window.Chart.defaults.scales.y = window.Chart.defaults.scales.y || {};

      window.Chart.defaults.scales.x.grid = {
        color: gridColor,
        borderColor: gridColor
      };
      window.Chart.defaults.scales.y.grid = {
        color: gridColor,
        borderColor: gridColor
      };
    }
  }
}

/**
 * Update all charts with current transaction data
 */
export function updateChartsWithCurrentData() {
  console.log("Updating charts with current data...");

  if (!AppState.transactions || AppState.transactions.length === 0) {
    console.log("No transactions to display in charts");
    clearAllCharts();
    return;
  }

  try {
    updateIncomeExpenseChart();
    updateExpenseCategoryChart();
    updateTimelineChart();
    updateSummary();
  } catch (error) {
    console.error("Error updating charts:", error);
    showToast("Error updating charts", "error");
  }
}

/**
 * Update Income vs Expense Chart
 */
function updateIncomeExpenseChart() {
  if (!incomeExpenseChart) return;

  const totals = calculateTotals();

  incomeExpenseChart.data.datasets[0].data = [totals.income, totals.expenses];
  incomeExpenseChart.update();
}

/**
 * Update Expense Category Chart
 */
function updateExpenseCategoryChart() {
  if (!expenseCategoryChart) return;

  const categoryTotals = calculateCategoryTotals();
  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const colors = generateCategoryColors(categories);

  expenseCategoryChart.data.labels = categories;
  expenseCategoryChart.data.datasets[0].data = values;
  expenseCategoryChart.data.datasets[0].backgroundColor = colors;
  expenseCategoryChart.update();
}

/**
 * Update Timeline Chart
 */
function updateTimelineChart() {
  if (!timelineChart) return;

  const timelineData = calculateTimelineData();

  timelineChart.data.labels = timelineData.labels;
  timelineChart.data.datasets[0].data = timelineData.income;
  timelineChart.data.datasets[1].data = timelineData.expenses;
  timelineChart.update();
}

/**
 * Update financial summary
 */
function updateSummary() {
  const summaryContainer = document.getElementById('summary');
  if (!summaryContainer) return;

  const totals = calculateTotals();
  const balance = totals.income - totals.expenses;

  summaryContainer.innerHTML = `
    <div class="summary-item">
      <h3>Total Income</h3>
      <p class="amount">$${totals.income.toFixed(2)}</p>
    </div>
    <div class="summary-item">
      <h3>Total Expenses</h3>
      <p class="amount">$${totals.expenses.toFixed(2)}</p>
    </div>
    <div class="summary-item">
      <h3>Balance</h3>
      <p class="amount" style="color: ${balance >= 0 ? '#4CAF50' : '#F44336'}">
        $${balance.toFixed(2)}
      </p>
    </div>
    <div class="summary-item">
      <h3>Transactions</h3>
      <p class="amount">${AppState.transactions.length}</p>
    </div>
  `;
}

/**
 * Calculate income and expense totals
 */
function calculateTotals() {
  let income = 0;
  let expenses = 0;

  AppState.transactions.forEach(tx => {
    const incomeValue = parseFloat(tx.income) || 0;
    const expenseValue = parseFloat(tx.expenses) || 0;

    income += incomeValue;
    expenses += expenseValue;
  });

  return { income, expenses };
}

/**
 * Calculate totals by category
 */
function calculateCategoryTotals() {
  const categoryTotals = {};

  AppState.transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const expenseValue = parseFloat(tx.expenses) || 0;

    if (expenseValue > 0) {
      categoryTotals[category] = (categoryTotals[category] || 0) + expenseValue;
    }
  });

  return categoryTotals;
}

/**
 * Calculate timeline data by month
 */
function calculateTimelineData() {
  const monthlyData = {};

  AppState.transactions.forEach(tx => {
    if (!tx.date) return;

    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    monthlyData[monthKey].income += parseFloat(tx.income) || 0;
    monthlyData[monthKey].expenses += parseFloat(tx.expenses) || 0;
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  return {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    income: sortedMonths.map(month => monthlyData[month].income),
    expenses: sortedMonths.map(month => monthlyData[month].expenses)
  };
}

/**
 * Generate colors for categories
 */
function generateCategoryColors(categories) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  return categories.map((_, index) => colors[index % colors.length]);
}

/**
 * Clear all chart data
 */
function clearAllCharts() {
  if (incomeExpenseChart) {
    incomeExpenseChart.data.datasets[0].data = [0, 0];
    incomeExpenseChart.update();
  }

  if (expenseCategoryChart) {
    expenseCategoryChart.data.labels = [];
    expenseCategoryChart.data.datasets[0].data = [];
    expenseCategoryChart.update();
  }

  if (timelineChart) {
    timelineChart.data.labels = [];
    timelineChart.data.datasets[0].data = [];
    timelineChart.data.datasets[1].data = [];
    timelineChart.update();
  }
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other initialization to complete
  setTimeout(initializeCharts, 1000);
});
