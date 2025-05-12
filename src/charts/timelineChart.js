let timelineChart = null;

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

    // Aggregate data by period
    const { labels, incomeData, expenseData } = aggregateByPeriod(validTransactions, period);

    // Create chart data
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          // Change to line for income
          type: 'line',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          // Keep as bar for expenses
          type: 'bar'
        }
      ]
    };

    // Create chart with options based on period - using mixed chart type
    const options = {
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
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };

    // Use mixed chart type (bar and line)
    timelineChart = createSafeChart("timelineChart", {
      type: 'bar', // Default type for datasets without a specified type
      data: data,
      options: options
    });

  } catch (error) {
    console.error("Error updating timeline chart:", error);
    displayNoDataMessage("timelineChart", "Error rendering chart");
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
  switch (period) {
    case 'year':
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
      break;

    case 'half':
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
      break;

    case 'quarter':
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
      break;

    case 'month':
    default:
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
      break;
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
