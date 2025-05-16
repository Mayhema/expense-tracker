import { AppState } from "../core/appState.js";
import { formatCurrency } from "../constants/currencies.js";
import { destroyChart, displayNoDataMessage, validateChartData, createSafeChart } from './chartCore.js';

/**
 * Updates the timeline chart with transactions aggregated by period
 * @param {Array} transactions - The transactions to display
 * @param {string} period - The period to aggregate by (year, half, quarter, month)
 */
export function updateTimelineChart(transactions, period = 'month') {
  try {
    const canvas = document.getElementById("timelineChart");
    if (!canvas) return;

    // Clean up existing chart
    timelineChart = destroyChart(timelineChart);

    // Validate data
    const validTransactions = validateChartData(transactions);
    if (!validTransactions.length) {
      displayNoDataMessage("timelineChart", "No transaction data to display");
      return;
    }

    // Group transactions by period
    const groupedData = groupTransactionsByPeriod(validTransactions, period);

    // Sort keys chronologically
    const sortedKeys = Object.keys(groupedData).sort();

    // Extract data for chart
    const labels = sortedKeys.map(key => groupedData[key].label);
    const incomeData = sortedKeys.map(key => groupedData[key].income);
    const expensesData = sortedKeys.map(key => groupedData[key].expenses);

    // Create chart config with x-axis labels showing
    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            order: 2,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Expenses',
            data: expensesData,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            order: 2,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Balance',
            data: incomeData.map((income, i) => income - (expensesData[i] || 0)),
            borderColor: 'rgba(54, 162, 235, 1)',
            tension: 0.1,
            fill: false,
            order: 1,
            pointRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: true,
              drawOnChartArea: false
            },
            ticks: {
              display: true, // Show x-axis labels
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Income & Expenses Over Time'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += formatCurrency(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    };

    // Create or update the chart
    const chartCanvas = document.getElementById("timelineChart");
    if (chartCanvas) {
      if (window.timelineChart) {
        window.timelineChart.destroy();
      }
      window.timelineChart = createSafeChart("timelineChart", config);
    }

  } catch (error) {
    console.error("Error updating timeline chart:", error);
    displayNoDataMessage("timelineChart", "Error rendering chart");
  }
}

/**
 * Groups transactions by date with the specified granularity
 * @param {Array} transactions - The transactions to group
 * @param {string} period - The period granularity ('month', 'quarter', etc.)
 * @returns {Object} Grouped transactions
 */
function groupTransactionsByPeriod(transactions, period) {
  const grouped = {};

  transactions.forEach(tx => {
    if (!tx.date) return;

    let date = new Date(tx.date);
    let key;

    // Create the appropriate grouping key based on period
    switch (period) {
      case 'year':
        key = date.getFullYear().toString();
        break;
      case 'half': {
        const half = Math.floor(date.getMonth() / 6) + 1;
        key = `${date.getFullYear()} H${half}`;
        break;
      }
      case 'quarter': {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()} Q${quarter}`;
        break;
      }
      case 'month':
      default: {
        // Format as YYYY-MM for sorting
        const month = date.getMonth() + 1;
        key = `${date.getFullYear()}-${month.toString().padStart(2, '0')}`;
        break;
      }
    }

    if (!grouped[key]) {
      grouped[key] = {
        income: 0,
        expenses: 0,
        date: date,
        label: formatPeriodLabel(key, period)
      };
    }

    if (tx.income) grouped[key].income += parseFloat(tx.income) || 0;
    if (tx.expenses) grouped[key].expenses += parseFloat(tx.expenses) || 0;
  });

  return grouped;
}

/**
 * Formats a period key into a display label
 * @param {string} key - The period key
 * @param {string} period - The period type
 * @returns {string} Formatted label
 */
function formatPeriodLabel(key, period) {
  switch (period) {
    case 'year': {
      return key; // Already just the year
    }
    case 'half': {
      return key; // Already formatted as "YYYY HX"
    }
    case 'quarter': {
      return key; // Already formatted as "YYYY QX"
    }
    case 'month':
    default: {
      // Convert YYYY-MM to more readable format
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
  }
}

/**
 * Get chart options based on selected period
 * @param {string} period - The time period (year, half, quarter, month)
 * @returns {Object} Chart options
 */
function getTimelineOptions(period) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Income & Expenses By ${capitalize(period)}`
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw || 0;
            return context.dataset.label + ': $' + value.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            });
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    }
  };

  return baseOptions;
}

/**
 * Aggregate transaction data by the selected period
 * @param {Array} transactions - The transactions to aggregate
 * @param {string} period - The time period (year, half, quarter, month)
 * @returns {Object} Object containing labels and data arrays
 */
function aggregateByPeriod(transactions, period) {
  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get date range
  const firstDate = new Date(transactions[0].date);
  const lastDate = new Date(transactions[transactions.length - 1].date);

  let periodMap = {};

  // Create period labels based on selected period
  if (period === "year") {
    // Group by year
    for (let year = firstDate.getFullYear(); year <= lastDate.getFullYear(); year++) {
      periodMap[year] = { income: 0, expenses: 0 };
    }

    // Aggregate data
    transactions.forEach(tx => {
      const year = new Date(tx.date).getFullYear();
      periodMap[year].income += parseFloat(tx.income || 0);
      periodMap[year].expenses += parseFloat(tx.expenses || 0);
    });
  } else if (period === "half") {
    // Group by half-year (1H and 2H)
    for (let year = firstDate.getFullYear(); year <= lastDate.getFullYear(); year++) {
      periodMap[`${year}-1H`] = { income: 0, expenses: 0 };
      periodMap[`${year}-2H`] = { income: 0, expenses: 0 };
    }

    // Aggregate data
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const year = date.getFullYear();
      const halfYear = date.getMonth() < 6 ? '1H' : '2H';
      const key = `${year}-${halfYear}`;

      periodMap[key].income += parseFloat(tx.income || 0);
      periodMap[key].expenses += parseFloat(tx.expenses || 0);
    });
  } else if (period === "quarter") {
    // Group by quarter (Q1-Q4)
    for (let year = firstDate.getFullYear(); year <= lastDate.getFullYear(); year++) {
      for (let q = 1; q <= 4; q++) {
        periodMap[`${year}-Q${q}`] = { income: 0, expenses: 0 };
      }
    }

    // Aggregate data
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `${year}-Q${quarter}`;

      periodMap[key].income += parseFloat(tx.income || 0);
      periodMap[key].expenses += parseFloat(tx.expenses || 0);
    });
  } else {
    // Group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let year = firstDate.getFullYear(); year <= lastDate.getFullYear(); year++) {
      for (let month = 0; month < 12; month++) {
        periodMap[`${year}-${month}`] = {
          income: 0,
          expenses: 0,
          label: `${months[month]} ${year}`
        };
      }
    }

    // Aggregate data
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      periodMap[key].income += parseFloat(tx.income || 0);
      periodMap[key].expenses += parseFloat(tx.expenses || 0);
    });
  }

  // Convert to arrays for chart
  const periods = Object.keys(periodMap).sort();
  const labels = periods.map(p => {
    // Format labels based on period type
    if (period === 'month') {
      return periodMap[p].label;
    }
    return p;
  });

  const incomeData = periods.map(p => periodMap[p].income);
  const expenseData = periods.map(p => periodMap[p].expenses);

  return { labels, incomeData, expenseData };
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Cleans up the timeline chart
 */
export function cleanupTimelineChart() {
  timelineChart = destroyChart(timelineChart);
}

// Keep only one declaration of each function
function getPeriodLabel(date, period) {
  // Implementation
  const d = new Date(date);
  switch (period) {
    case 'year':
      return d.getFullYear().toString();
    case 'half':
      return `${d.getFullYear()} ${d.getMonth() < 6 ? 'H1' : 'H2'}`;
    case 'quarter':
      return `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`;
    case 'month':
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return date;
  }
}

let timelineChart;

/**
 * Renders the timeline chart
 * @param {Array} data - The transaction data to render
 */
function renderTimelineChart(data) {
  const groupedData = groupDataByPeriod(data);
  const chartData = formatChartData(groupedData);
  createChart(chartData);
}

// Initialize the timeline chart when the page loads
document.addEventListener('DOMContentLoaded', function () {
  // Set up period selector
  const periodSelect = document.getElementById('timelineChartPeriod');
  if (periodSelect) {
    periodSelect.addEventListener('change', function () {
      // Only update if we have transactions
      if (AppState.transactions && AppState.transactions.length > 0) {
        updateTimelineChart(AppState.transactions, this.value);
      }
    });
  }

  // Initial render will happen when transactions are loaded
});

// Export functions for use in other modules
export {
  renderTimelineChart,
  groupTransactionsByPeriod,
  getPeriodLabel
};
