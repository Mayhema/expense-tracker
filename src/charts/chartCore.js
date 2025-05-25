
/**
 * Creates a chart safely with proper error handling
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} config - Chart configuration
 * @returns {Chart|null} Chart instance or null if failed
 */
export function createSafeChart(canvas, config) {
  if (!canvas) {
    console.error("Canvas element is required for chart creation");
    return null;
  }

  try {
    // Check if canvas already has a chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      console.log("Destroying existing chart on canvas");
      existingChart.destroy();
    }

    // Create new chart
    const chart = new Chart(canvas, config);
    console.log("Chart created successfully");
    return chart;
  } catch (error) {
    console.error("Error creating chart:", error);
    return null;
  }
}

/**
 * Destroys a chart instance safely
 * @param {Chart} chart - The chart instance to destroy
 */
export function destroyChart(chart) {
  if (chart && typeof chart.destroy === 'function') {
    try {
      chart.destroy();
      console.log("Chart destroyed successfully");
    } catch (error) {
      console.error("Error destroying chart:", error);
    }
  }
}

/**
 * Validates chart data before rendering
 * @param {Array} data - The data to validate
 * @param {string} chartType - The type of chart being created
 * @returns {boolean} Whether the data is valid for charting
 */
export function validateChartData(data, chartType = 'generic') {
  if (!data) {
    console.warn(`No data provided for ${chartType} chart`);
    return false;
  }

  if (!Array.isArray(data)) {
    console.warn(`Invalid data type for ${chartType} chart - expected array`);
    return false;
  }

  if (data.length === 0) {
    console.warn(`Empty data array for ${chartType} chart`);
    return false;
  }

  // Specific validations for different chart types
  switch (chartType) {
    case 'pie':
    case 'doughnut':
      return validatePieChartData(data);
    case 'line':
    case 'bar':
      return validateTimeSeriesData(data);
    default:
      return data.length > 0;
  }
}

/**
 * Validates data for pie/doughnut charts
 * @param {Array} data - The data to validate
 * @returns {boolean} Whether the data is valid
 */
function validatePieChartData(data) {
  // Check if all values are numbers and positive
  const validData = data.filter(item => {
    const value = typeof item === 'object' ? item.value || item.y : item;
    return typeof value === 'number' && value >= 0;
  });

  if (validData.length === 0) {
    console.warn("No valid numeric data found for pie chart");
    return false;
  }

  return true;
}

/**
 * Validates data for time series charts
 * @param {Array} data - The data to validate
 * @returns {boolean} Whether the data is valid
 */
function validateTimeSeriesData(data) {
  // Check if data has proper structure for time series
  const validData = data.filter(item => {
    if (typeof item === 'object') {
      return (item.x !== undefined || item.date !== undefined) &&
        (item.y !== undefined || item.value !== undefined);
    }
    return typeof item === 'number';
  });

  return validData.length > 0;
}

/**
 * Get chart period from UI selector
 */
export function getChartPeriod() {
  const periodSelect = document.getElementById('chartPeriodSelect');
  return periodSelect ? periodSelect.value : 'all';
}

/**
 * Get chart currency filter from UI selector
 */
export function getChartCurrency() {
  const currencySelect = document.getElementById('chartCurrencySelect');
  return currencySelect ? currencySelect.value : 'all';
}

/**
 * Filter transactions based on chart period and currency
 */
export function filterTransactionsForCharts(transactions) {
  if (!transactions || !Array.isArray(transactions)) return [];

  const period = getChartPeriod();
  const currency = getChartCurrency();

  let filtered = [...transactions];

  // Filter by currency
  if (currency !== 'all') {
    filtered = filtered.filter(tx => tx.currency === currency);
  }

  // Filter by time period
  if (period !== 'all') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter': {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      }
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= now;
      });
    }
  }

  return filtered;
}

/**
 * Common chart options for consistent styling
 */
export function getCommonChartOptions(isDarkMode = false) {
  const textColor = isDarkMode ? '#e0e0e0' : '#666666';
  const gridColor = isDarkMode ? '#444444' : '#dddddd';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#333' : '#fff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      },
      y: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      }
    }
  };
}

/**
 * Updates chart colors for dark/light theme
 */
export function updateChartTheme(chart, isDarkMode) {
  if (!chart) return;

  const options = getCommonChartOptions(isDarkMode);

  // Update chart options
  Object.assign(chart.options, options);

  // Update the chart
  chart.update();
}

/**
 * Prepares transaction data for charting
 * @param {Array} transactions - Raw transaction data
 * @returns {Object} Prepared data for different chart types
 */
export function prepareChartData(transactions) {
  if (!validateChartData(transactions, 'generic')) {
    return {
      incomeExpense: { labels: [], datasets: [] },
      categories: { labels: [], datasets: [] },
      timeline: { labels: [], datasets: [] }
    };
  }

  // Group data for different chart types
  const categoryData = groupTransactionsByCategory(transactions);
  const timelineData = groupTransactionsByTime(transactions);
  const incomeExpenseData = calculateIncomeExpenseTotals(transactions);

  return {
    incomeExpense: incomeExpenseData,
    categories: categoryData,
    timeline: timelineData
  };
}

/**
 * Groups transactions by category for pie charts
 */
function groupTransactionsByCategory(transactions) {
  const categoryTotals = {};

  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const amount = parseFloat(tx.expenses) || 0;

    if (amount > 0) {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: generateColors(labels.length),
      borderWidth: 1
    }]
  };
}

/**
 * Groups transactions by time for timeline charts
 */
function groupTransactionsByTime(transactions) {
  const timeData = {};

  transactions.forEach(tx => {
    if (!tx.date) return;

    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!timeData[monthKey]) {
      timeData[monthKey] = { income: 0, expenses: 0 };
    }

    timeData[monthKey].income += parseFloat(tx.income) || 0;
    timeData[monthKey].expenses += parseFloat(tx.expenses) || 0;
  });

  const sortedKeys = Object.keys(timeData).sort();

  return {
    labels: sortedKeys,
    datasets: [
      {
        label: 'Income',
        data: sortedKeys.map(key => timeData[key].income),
        borderColor: '#4CAF50',
        backgroundColor: '#4CAF50',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: sortedKeys.map(key => timeData[key].expenses),
        borderColor: '#F44336',
        backgroundColor: '#F44336',
        tension: 0.1
      }
    ]
  };
}

/**
 * Calculate income and expense totals from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object with income and expenses totals
 */
export function calculateIncomeExpenseTotals(transactions) {
  if (!Array.isArray(transactions)) {
    console.warn("calculateIncomeExpenseTotals: transactions is not an array");
    return { income: 0, expenses: 0 };
  }

  const totals = transactions.reduce((acc, tx) => {
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;

    acc.income += income;
    acc.expenses += expenses;

    return acc;
  }, { income: 0, expenses: 0 });

  return totals;
}

/**
 * Calculate category totals from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object with category names as keys and totals as values
 */
export function calculateCategoryTotals(transactions) {
  if (!Array.isArray(transactions)) {
    console.warn("calculateCategoryTotals: transactions is not an array");
    return {};
  }

  const categoryTotals = {};

  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const expenses = parseFloat(tx.expenses) || 0;

    if (expenses > 0) {
      categoryTotals[category] = (categoryTotals[category] || 0) + expenses;
    }
  });

  return categoryTotals;
}

/**
 * Validate transaction data before processing
 * @param {Array} transactions - Array of transaction objects
 * @returns {boolean} Whether the data is valid for charting
 */
export function validateTransactionData(transactions) {
  if (!Array.isArray(transactions)) {
    console.warn("validateTransactionData: transactions is not an array");
    return false;
  }

  if (transactions.length === 0) {
    console.warn("validateTransactionData: no transactions to chart");
    return false;
  }

  // Check if transactions have required fields
  const hasValidData = transactions.some(tx =>
    tx.date && (parseFloat(tx.income) > 0 || parseFloat(tx.expenses) > 0)
  );

  if (!hasValidData) {
    console.warn("validateTransactionData: no valid transaction data found");
    return false;
  }

  return true;
}

/**
 * Process transactions for timeline chart
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Processed data for timeline chart
 */
export function processTimelineData(transactions) {
  if (!validateTransactionData(transactions)) {
    return { labels: [], incomeData: [], expenseData: [] };
  }

  // Group transactions by month
  const monthlyData = {};

  transactions.forEach(tx => {
    if (!tx.date) return;

    try {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      monthlyData[monthKey].income += parseFloat(tx.income) || 0;
      monthlyData[monthKey].expenses += parseFloat(tx.expenses) || 0;
    } catch (e) {
      console.warn("Error processing date for timeline:", tx.date, e);
    }
  });

  // Sort by month and convert to arrays
  const sortedMonths = Object.keys(monthlyData).sort();

  return {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(year, monthNum - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }),
    incomeData: sortedMonths.map(month => monthlyData[month].income),
    expenseData: sortedMonths.map(month => monthlyData[month].expenses)
  };
}

/**
 * Get chart colors based on theme
 */
export function getChartColors(isDarkMode = false) {
  return {
    background: isDarkMode ? '#2d3748' : '#ffffff',
    text: isDarkMode ? '#e2e8f0' : '#374151',
    grid: isDarkMode ? '#4a5568' : '#e5e7eb',
    income: '#10b981', // Green
    expenses: '#ef4444', // Red
    categories: [
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#f59e0b', // Amber
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
      '#6b7280', // Gray
      '#14b8a6', // Teal
      '#a855f7', // Violet
      '#eab308', // Yellow
      '#22c55e', // Green
      '#ef4444'  // Red
    ]
  };
}

/**
 * Default chart options for better responsive behavior
 */
export function getDefaultChartOptions(isDarkMode = false) {
  const colors = getChartColors(isDarkMode);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text,
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.grid,
        borderWidth: 1
      }
    }
  };
}

/**
 * Options specifically for pie/doughnut charts
 */
export function getPieChartOptions(isDarkMode = false) {
  const baseOptions = getDefaultChartOptions(isDarkMode);

  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins.legend,
        position: 'bottom',
        labels: {
          ...baseOptions.plugins.legend.labels,
          padding: 20,
          boxWidth: 12,
          boxHeight: 12
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    }
  };
}

/**
 * Options for line charts
 */
export function getLineChartOptions(isDarkMode = false) {
  const baseOptions = getDefaultChartOptions(isDarkMode);
  const colors = getChartColors(isDarkMode);

  return {
    ...baseOptions,
    scales: {
      x: {
        grid: {
          color: colors.grid
        },
        ticks: {
          color: colors.text
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: colors.grid
        },
        ticks: {
          color: colors.text
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };
}

/**
 * Generates colors for chart data
 */
function generateColors(count) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
  ];

  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}
