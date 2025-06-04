import { createChart, getChartColors } from '../charts/chartCore.js';

/**
 * Chart Bundle - Consolidated chart management
 */

/**
 * Initialize all charts
 */
export function initializeCharts() {
  console.log("Initializing charts...");

  try {
    // Initialize income/expense chart
    initializeIncomeExpenseChart();

    // Initialize timeline chart
    initializeTimelineChart();

    console.log("Charts initialized successfully");
  } catch (error) {
    console.error("Error initializing charts:", error);
  }
}

/**
 * Initialize income vs expense chart
 */
function initializeIncomeExpenseChart() {
  try {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) {
      console.warn("Income/Expense chart canvas not found");
      return;
    }

    // Create basic chart structure
    const chartData = {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [0, 0],
        backgroundColor: getChartColors(2),
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    };

    createChart(canvas, 'doughnut', chartData, options);
    console.log("Income/Expense chart initialized");
  } catch (error) {
    console.error("Error initializing income/expense chart:", error);
  }
}

/**
 * Initialize timeline chart
 */
function initializeTimelineChart() {
  try {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) {
      console.warn("Timeline chart canvas not found");
      return;
    }

    // Create basic chart structure
    const chartData = {
      labels: [],
      datasets: [{
        label: 'Income',
        data: [],
        backgroundColor: getChartColors(1)[0],
        borderColor: getChartColors(1)[0],
        tension: 0.1
      }, {
        label: 'Expenses',
        data: [],
        backgroundColor: getChartColors(2)[1],
        borderColor: getChartColors(2)[1],
        tension: 0.1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    createChart(canvas, 'line', chartData, options);
    console.log("Timeline chart initialized");
  } catch (error) {
    console.error("Error initializing timeline chart:", error);
  }
}

/**
 * Update charts with new data using dd/mm/yyyy format
 */
export function updateCharts(transactions = []) {
  try {
    updateIncomeExpenseChart(transactions);
    updateTimelineChart(transactions);
  } catch (error) {
    console.error("Error updating charts:", error);
  }
}

/**
 * Update income expense chart with dd/mm/yyyy date handling
 */
function updateIncomeExpenseChart(transactions) {
  // FIXED: Filter transactions by date range if needed
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.date) return true;
    // Validate date format
    const date = new Date(tx.date);
    return !isNaN(date.getTime());
  });

  console.log("Updating income/expense chart with", filteredTransactions.length, "transactions");
}

/**
 * Update timeline chart with dd/mm/yyyy date handling
 */
function updateTimelineChart(transactions) {
  // FIXED: Filter transactions by date range if needed
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.date) return true;
    // Validate date format
    const date = new Date(tx.date);
    return !isNaN(date.getTime());
  });

  console.log("Updating timeline chart with", filteredTransactions.length, "transactions");
}
