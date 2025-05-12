import { createSafeChart, destroyChart, displayNoDataMessage, validateChartData } from "./chartCore.js";

// Store chart instance for proper cleanup
let pieChart = null;

/**
 * Updates the income vs expenses pie chart with the given transactions
 * @param {Array} transactions - The transactions to display
 * @returns {boolean} True if successful, false otherwise
 */
export function updateIncomeExpenseChart(transactions) {
  try {
    const canvas = document.getElementById("incomeExpenseChart");
    if (!canvas) return false;

    // Clean up existing chart
    pieChart = destroyChart(pieChart);

    // Validate data
    const validTransactions = validateChartData(transactions);
    if (!validTransactions.length) {
      displayNoDataMessage("incomeExpenseChart", "No transaction data to display");
      return false;
    }

    // Calculate total income and expenses
    const totalIncome = validTransactions
      .filter(tx => tx.income && !isNaN(parseFloat(tx.income)))
      .reduce((sum, tx) => sum + parseFloat(tx.income), 0);

    const totalExpenses = validTransactions
      .filter(tx => tx.expenses && !isNaN(parseFloat(tx.expenses)))
      .reduce((sum, tx) => sum + parseFloat(tx.expenses), 0);

    // Create chart data
    const data = {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [totalIncome, totalExpenses],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1,
        hoverOffset: 15
      }]
    };

    // Create chart
    pieChart = createSafeChart("incomeExpenseChart", {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              generateLabels: function (chart) {
                // Get the default label items
                const original = Chart.overrides.pie.plugins.legend.labels.generateLabels;
                const labelsOriginal = original.call(this, chart);

                // Add amounts to labels
                return labelsOriginal.map((label, i) => {
                  const value = chart.data.datasets[0].data[i];
                  const formattedValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2
                  }).format(value);

                  label.text = `${label.text}: ${formattedValue}`;
                  return label;
                });
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw || 0;
                return `${context.label}: $${value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`;
              }
            }
          }
        }
      }
    });

    return true;
  } catch (error) {
    console.error("Error updating income/expense chart:", error);
    displayNoDataMessage("incomeExpenseChart", "Error rendering chart");
    return false;
  }
}

/**
 * Cleans up the income vs expense chart
 */
export function cleanupIncomeExpenseChart() {
  pieChart = destroyChart(pieChart);
}
