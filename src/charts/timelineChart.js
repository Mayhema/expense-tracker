import { AppState } from "../core/appState.js";
import { destroyChart } from './chartCore.js';

/**
 * Updates the timeline chart with new data
 * @param {Array} transactions - The transaction data to display
 * @param {string} periodOption - The time period option (month, quarter, year)
 */
export function updateTimelineChart(transactions, periodOption = 'month') {
  try {
    const ctx = document.getElementById("timelineChart");
    if (!ctx) {
      console.error("Timeline chart canvas not found");
      return;
    }

    console.log("Updating timeline chart with period:", periodOption);

    // More robust chart destruction with additional checks
    if (window.timelineChart) {
      try {
        destroyChartInstance(window.timelineChart);
        window.timelineChart = null;
      } catch (err) {
        console.warn("Error destroying timeline chart:", err);
      }
    }

    // Create data for the chart
    const { labels, incomeData, expensesData } = prepareTimelineData(transactions, periodOption);

    // Check if we have valid data - IMPROVED EMPTY STATE HANDLING
    if (!labels || labels.length === 0) {
      console.log("No valid timeline data to display - showing empty state");
      // Instead of returning early, show an empty state chart
      showEmptyStateChart(ctx);
      return;
    }

    // Create chart configuration with proper number formatting
    const isDarkMode = document.body.classList.contains("dark-mode");
    const textColor = isDarkMode ? "#e0e0e0" : "#666666";
    const gridColor = isDarkMode ? "#444444" : "#dddddd";

    // Create a new chart instance with safer number formatting
    window.timelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Expenses',
            data: expensesData,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 5,
            left: 5
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              // FIX: Use safer number formatting to avoid the RangeError
              callback: function (value) {
                if (value % 1 === 0) {
                  return value.toString();
                }
                return value.toFixed(2);
              }
            },
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            titleColor: isDarkMode ? '#fff' : '#000',
            bodyColor: isDarkMode ? '#fff' : '#000',
            borderColor: gridColor,
            borderWidth: 1,
            // FIX: Use safer number formatting for tooltips
            callbacks: {
              label: function (context) {
                let value = context.raw;
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (typeof value === 'number') {
                  return label + value.toFixed(2);
                }
                return label + value;
              }
            }
          }
        }
      }
    });

    console.log("Timeline chart created successfully");
  } catch (error) {
    console.error("Error creating timeline chart:", error);
  }
}

/**
 * Updates the timeline chart with transaction data from AppState
 */
function refreshTimelineChart(period = 'month') {
  const timelineCanvas = document.getElementById('timelineChart');
  if (!timelineCanvas) return;

  // Check if we have transaction data to display
  if (!AppState.transactions || AppState.transactions.length === 0) {
    console.log("No valid timeline data to display - showing empty state");
    showEmptyStateChart(timelineCanvas);
    return;
  }

  try {
    // Group transactions by period
    const groupedData = groupTransactionsByPeriod(AppState.transactions, period);
    const chartData = formatChartData(groupedData);

    // Ensure layout padding is properly defined to prevent errors
    const config = {
      type: 'bar',
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
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          tooltip: {
            enabled: true,
            position: 'nearest',
            callbacks: {
              label: function (context) {
                let value = context.raw;
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (typeof value === 'number') {
                  return label + value.toFixed(2);
                }
                return label + value;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              color: isDarkMode ? '#e0e0e0' : '#333',
              font: {
                size: 14
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              // FIX: Use safer number formatting to avoid the RangeError
              callback: function (value) {
                if (value % 1 === 0) {
                  return value.toString();
                }
                return value.toFixed(2);
              }
            },
            beginAtZero: true
          }
        }
      }
    };

    // Destroy any existing chart instance
    if (window.timelineChart) {
      destroyChart(window.timelineChart);
      window.timelineChart = null;
    }

    // Create the new chart instance
    window.timelineChart = new Chart(timelineCanvas, config);

    console.log("Timeline chart updated successfully");
  } catch (error) {
    console.error("Error creating timeline chart:", error);
    showEmptyStateChart(timelineCanvas);
  }
}

/**
 * Shows an empty state chart when no data is available
 */
function showEmptyStateChart(canvas) {
  console.log("Displaying empty state timeline chart");

  try {
    // Destroy existing chart if present
    if (window.timelineChart) {
      destroyChart(window.timelineChart);
      window.timelineChart = null;
    }

    // Make sure canvas styles are explicitly set
    canvas.style.height = canvas.style.height || '300px';

    // Create simple empty state with minimal configuration
    const config = {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Income',
            data: [0],
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          },
          {
            label: 'Expenses',
            data: [0],
            backgroundColor: 'rgba(255, 99, 132, 0.2)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Explicitly define layout and padding
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
            display: true
          },
          title: {
            display: true,
            text: 'No transaction data available'
          },
          // Disable tooltips completely for empty state
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              display: false
            }
          }
        },
        animation: false // Disable animations for better performance
      }
    };

    // Create chart using the safety wrapper
    window.timelineChart = createSafeChart(canvas.id, config);

  } catch (error) {
    console.error("Error creating empty state chart:", error);

    // Fall back to canvas rendering if chart fails
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#333' : '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No transaction data available', canvas.width / 2, canvas.height / 2);
      }
    } catch (fallbackError) {
      console.error("Error creating fallback display:", fallbackError);
    }
  }
}

/**
 * Helper function to safely destroy a Chart.js instance
 */
function destroyChartInstance(chart) {
  if (!chart) return;

  // First check if it's a valid Chart.js instance
  if (typeof chart.destroy === 'function') {
    chart.destroy();
  } else {
    // Fallback for invalid instance - try to access the chart's internal canvas
    try {
      const chartCanvas = chart.canvas || chart.ctx?.canvas;
      if (chartCanvas && chartCanvas.id) {
        // Try to find and destroy any Chart.js instance on this canvas
        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart && typeof existingChart.destroy === 'function') {
          existingChart.destroy();
        }
      }
    } catch (err) {
      console.warn("Failed to destroy chart via fallback method:", err);
    }
  }
}

/**
 * Safely destroys the timeline chart instance
 */
function destroyTimelineChart() {
  try {
    // Check three different possible states for the chart
    if (window.timelineChart) {
      // Check if it's a Chart.js instance with destroy method
      if (typeof window.timelineChart.destroy === 'function') {
        console.log("Destroying existing timeline chart");
        window.timelineChart.destroy();
      }
      // Check if it might have an update method (partially initialized chart)
      else if (typeof window.timelineChart.update === 'function') {
        console.log("Cleaning up chart with update method");
        window.timelineChart.data.datasets = [];
        window.timelineChart.update();
      }

      // Reset the chart variable regardless
      window.timelineChart = null;
    }

    // Additional cleanup - check for canvas and clear it manually as a last resort
    const canvas = document.getElementById("timelineChart");
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  } catch (error) {
    console.warn("Error during timeline chart cleanup:", error);
    // Final fallback - just delete the reference
    window.timelineChart = null;
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
 * Initialize period map for a given date range and period type
 * @param {Date} firstDate - Start date
 * @param {Date} lastDate - End date
 * @param {string} period - Period type
 * @returns {Object} Initialized period map
 */
function initializePeriodMap(firstDate, lastDate, period) {
  const periodMap = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let year = firstDate.getFullYear(); year <= lastDate.getFullYear(); year++) {
    if (period === "year") {
      periodMap[year] = { income: 0, expenses: 0 };
    }
    else if (period === "half") {
      periodMap[`${year}-1H`] = { income: 0, expenses: 0 };
      periodMap[`${year}-2H`] = { income: 0, expenses: 0 };
    }
    else if (period === "quarter") {
      for (let q = 1; q <= 4; q++) {
        periodMap[`${year}-Q${q}`] = { income: 0, expenses: 0 };
      }
    }
    else { // month
      for (let month = 0; month < 12; month++) {
        periodMap[`${year}-${month}`] = {
          income: 0,
          expenses: 0,
          label: `${months[month]} ${year}`
        };
      }
    }
  }

  return periodMap;
}

/**
 * Create a period key for a transaction based on its date and period type
 * @param {Date} date - Transaction date
 * @param {string} period - Period type
 * @returns {string} Period key
 */
function createPeriodKey(date, period) {
  const year = date.getFullYear();

  switch (period) {
    case "year":
      return year.toString();
    case "half":
      return `${year}-${date.getMonth() < 6 ? '1H' : '2H'}`;
    case "quarter":
      return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    default: // month
      return `${year}-${date.getMonth()}`;
  }
}

/**
 * Aggregate transaction data by the selected period
 * @param {Array} transactions - The transactions to aggregate
 * @param {string} period - The time period (year, half, quarter, month)
 * @returns {Object} Object containing labels and data arrays
 */
function aggregateByPeriod(transactions, period) {
  if (!transactions || transactions.length === 0) {
    return { labels: [], incomeData: [], expenseData: [] };
  }

  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get date range
  const firstDate = new Date(transactions[0].date);
  const lastDate = new Date(transactions[transactions.length - 1].date);

  // Initialize period map
  const periodMap = initializePeriodMap(firstDate, lastDate, period);

  // Aggregate data
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = createPeriodKey(date, period);

    if (periodMap[key]) {
      periodMap[key].income += parseFloat(tx.income || 0);
      periodMap[key].expenses += parseFloat(tx.expenses || 0);
    }
  });

  // Convert to arrays for chart
  const periods = Object.keys(periodMap).sort();
  const labels = periods.map(p => period === 'month' ? periodMap[p].label : p);
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

/**
 * Prepares transaction data for timeline visualization
 * @param {Array} transactions - The transaction data to display
 * @param {string} periodOption - The time period option (month, quarter, year)
 * @returns {Object} Object with labels, incomeData, and expensesData arrays
 */
function prepareTimelineData(transactions, periodOption = 'month') {
  // Default empty results
  const result = {
    labels: [],
    incomeData: [],
    expensesData: []
  };

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    // Use info level logging instead of warning for expected empty state
    console.log("No valid transaction data for timeline");
    return result;
  }

  try {
    // Group transactions by period
    const periodData = {};

    // Process each transaction
    transactions.forEach(tx => {
      if (!tx.date) return;

      // Parse the transaction date
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return;

      // Get period key based on selected periodOption
      const periodKey = getPeriodKey(txDate, periodOption);

      // Initialize period if it doesn't exist
      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          income: 0,
          expenses: 0
        };
      }

      // Add income and expenses
      if (tx.income && !isNaN(parseFloat(tx.income))) {
        periodData[periodKey].income += parseFloat(tx.income);
      }

      if (tx.expenses && !isNaN(parseFloat(tx.expenses))) {
        periodData[periodKey].expenses += parseFloat(tx.expenses);
      }
    });

    // Sort periods chronologically
    const sortedPeriods = Object.keys(periodData).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Generate final data arrays
    result.labels = sortedPeriods.map(period => formatPeriodDisplayLabel(period, periodOption));
    result.incomeData = sortedPeriods.map(period => periodData[period].income);
    result.expensesData = sortedPeriods.map(period => periodData[period].expenses);

    return result;
  } catch (error) {
    console.error("Error preparing timeline data:", error);
    return result;
  }
}

/**
 * Gets period key for grouping transactions
 * @param {Date} date - The transaction date
 * @param {string} periodOption - The selected period (month, quarter, year)
 * @returns {string} The period key
 */
function getPeriodKey(date, periodOption) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based month

  switch (periodOption) {
    case 'year':
      return `${year}`;

    case 'quarter': {
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    }

    case 'half': {
      const half = month <= 6 ? 1 : 2;
      return `${year}-H${half}`;
    }

    case 'month':
    default:
      return `${year}-${month.toString().padStart(2, '0')}`;
  }
}

/**
 * Formats period key into readable label
 * @param {string} periodKey - The period key
 * @param {string} periodOption - The selected period option
 * @returns {string} Formatted label
 */
function formatPeriodDisplayLabel(periodKey, periodOption) {
  if (periodOption === 'year') {
    return periodKey;
  }

  if (periodOption === 'quarter') {
    const [year, quarter] = periodKey.split('-');
    return `${quarter} ${year}`;
  }

  if (periodOption === 'half') {
    const [year, half] = periodKey.split('-');
    return `${half === 'H1' ? 'Jan-Jun' : 'Jul-Dec'} ${year}`;
  }

  // Default: month
  const [year, month] = periodKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);

  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// Initialize the timeline chart when the page loads
document.addEventListener('DOMContentLoaded', function () {
  // Set up period selector
  const periodSelect = document.getElementById('timelineChartPeriod');
  if (periodSelect) {
    periodSelect.addEventListener('change', function () {
      // Only update if we have transactions
      if (AppState.transactions && AppState.transactions.length > 0) {
        refreshTimelineChart(this.value);
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

/**
 * Format numbers safely for chart labels
 * @param {number} value - The value to format
 * @returns {string} Formatted value
 */
function safeFormatNumber(value) {
  if (typeof value !== 'number') return value;

  try {
    // Use simple toFixed for formatting to avoid locale issues
    return value.toFixed(2);
  } catch (err) {
    // Log the error and provide context for debugging
    console.warn("Error formatting number value:", err, value);
    // Fallback to basic string conversion
    return String(value);
  }
}
