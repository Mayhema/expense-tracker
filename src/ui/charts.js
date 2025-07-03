import { AppState } from '../core/appState.js';
import { CURRENCIES } from '../constants/currencies.js';

let chartInstances = {
  category: null,
  monthly: null,
  trend: null
};

/**
 * Initialize charts functionality
 */
export async function initializeCharts() {
  console.log("Initializing charts...");

  try {
    // Create chart containers first
    createChartContainers();

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js not loaded, charts will not be available");
      return false;
    }

    // Initialize individual charts
    initializeIndividualCharts();

    console.log("Charts initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing charts:", error);
    return false;
  }
}

/**
 * Initialize individual chart canvases
 */
function initializeIndividualCharts() {
  const chartConfigs = [
    { id: 'categoryChart', type: 'doughnut', key: 'category' },
    { id: 'monthlyChart', type: 'bar', key: 'monthly' },
    { id: 'trendChart', type: 'line', key: 'trend' }
  ];

  chartConfigs.forEach(config => {
    const canvas = document.getElementById(config.id);
    if (canvas) {
      try {
        // Destroy existing chart if any
        if (chartInstances[config.key]) {
          chartInstances[config.key].destroy();
        }

        // Create empty chart
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, getEmptyChartConfig(config.type));
        chartInstances[config.key] = chart;

        console.log(`Initialized ${config.id}`);
      } catch (error) {
        console.error(`Error initializing ${config.id}:`, error);
      }
    }
  });

  // Initialize chart toggle buttons
  initializeChartToggleButtons();
}

/**
 * Initialize chart toggle buttons in debug mode
 */
function initializeChartToggleButtons() {
  const toggleButtons = document.querySelectorAll('.chart-toggle-btn');

  toggleButtons.forEach(button => {
    // FIXED: Remove existing listeners first
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', function () {
      const chartType = this.getAttribute('data-chart');
      toggleChart(chartType);

      // Update button state
      document.querySelectorAll('.chart-toggle-btn').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

  console.log("Chart toggle buttons initialized");
}

/**
 * Toggle chart visibility
 */
function toggleChart(chartType) {
  const chartWrappers = {
    'expense': 'expenseChartWrapper',
    'income': 'incomeExpenseChartWrapper',
    'timeline': 'timelineChartWrapper'
  };

  // Hide all charts
  Object.values(chartWrappers).forEach(wrapperId => {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
      wrapper.style.display = 'none';
    }
  });

  // Show selected chart
  const selectedWrapper = document.getElementById(chartWrappers[chartType]);
  if (selectedWrapper) {
    selectedWrapper.style.display = 'block';
    console.log(`Showing ${chartType} chart`);
  }
}

/**
 * Get empty chart configuration
 */
function getEmptyChartConfig(type) {
  const isDarkMode = document.body.classList.contains('dark-mode');

  const baseConfig = {
    type: type,
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        }
      }
    }
  };

  if (type === 'bar' || type === 'line') {
    baseConfig.options.scales = {
      x: {
        ticks: {
          color: isDarkMode ? '#e0e0e0' : '#666'
        },
        grid: {
          color: isDarkMode ? '#444' : '#e0e0e0'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: isDarkMode ? '#e0e0e0' : '#666'
        },
        grid: {
          color: isDarkMode ? '#444' : '#e0e0e0'
        }
      }
    };
  }

  return baseConfig;
}

/**
 * Create chart containers if they don't exist
 */
function createChartContainers() {
  // FIXED: Use the existing charts section from HTML instead of creating new one
  const existingChartsSection = document.querySelector('.section .charts-section');
  if (existingChartsSection) {
    console.log("Using existing charts section from HTML");
    return;
  }

  // Only create if completely missing
  let chartsSection = document.getElementById('chartsSection');
  if (!chartsSection) {
    createChartsSection();
  }
}

/**
 * Create charts section if it doesn't exist
 */
function createChartsSection() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) {
    console.error('Main content not found for charts section');
    return null;
  }

  // FIXED: Don't create new section if charts already exist in HTML
  const existingCharts = document.querySelector('.charts-section');
  if (existingCharts) {
    console.log("Charts section already exists in HTML");
    return existingCharts.closest('.section');
  }

  // If no existing section found, create new one
  const section = document.createElement('div');
  section.id = 'chartsSection';
  section.className = 'section charts-section';
  section.innerHTML = `
    <div class="section-header">
      <h2>📊 Charts & Analytics</h2>
    </div>
    <div class="section-content">
      <!-- Chart containers will be added here -->
    </div>
  `;

  // Insert after the first section (Financial Overview)
  const firstSection = mainContent.querySelector('.section');
  if (firstSection && firstSection.nextSibling) {
    mainContent.insertBefore(section, firstSection.nextSibling);
  } else {
    mainContent.appendChild(section);
  }

  return section;
}

/**
 * Update all charts
 */
export function updateCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not available, skipping chart updates");
    return;
  }

  const transactions = AppState.transactions || [];
  console.log(`Updating charts with ${transactions.length} transactions`);

  if (transactions.length === 0) {
    console.log("No transactions available for charts");
    clearAllCharts();
    return;
  }

  // FIXED: Update all charts with actual data and ensure they stay visible
  updateCategoryChart(transactions);
  updateMonthlyChart(transactions);
  updateTrendChart(transactions);

  // CRITICAL FIX: Ensure all chart wrappers are visible after update
  setTimeout(() => {
    const chartWrappers = document.querySelectorAll('.chart-wrapper');
    chartWrappers.forEach(wrapper => {
      wrapper.style.display = 'block';
      wrapper.style.visibility = 'visible';
    });

    // CRITICAL FIX: Make sure the first chart (category) is always visible after upload
    const expenseWrapper = document.getElementById('expenseChartWrapper');
    if (expenseWrapper) {
      expenseWrapper.style.display = 'block';
    }

    console.log("All chart containers forced to visible state");
  }, 50);

  console.log("All charts updated successfully");
}

/**
 * FIXED: Update charts with filtered data specifically
 */
export function updateChartsWithFilteredData(filteredTransactions) {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not available, skipping chart updates");
    return;
  }

  console.log(`Updating charts with ${filteredTransactions.length} filtered transactions`);

  if (filteredTransactions.length === 0) {
    console.log("No filtered transactions available for charts");
    clearAllCharts();
    return;
  }

  // Update all charts with filtered data
  updateCategoryChart(filteredTransactions);
  updateMonthlyChart(filteredTransactions);
  updateTrendChart(filteredTransactions);

  // CRITICAL FIX: Ensure all chart wrappers are visible when we have data
  setTimeout(() => {
    const chartWrappers = document.querySelectorAll('.chart-wrapper');
    chartWrappers.forEach(wrapper => {
      wrapper.style.display = 'block';
      wrapper.style.visibility = 'visible';
    });

    // Make sure the first chart is visible
    const expenseWrapper = document.getElementById('expenseChartWrapper');
    if (expenseWrapper) {
      expenseWrapper.style.display = 'block';
    }

    console.log("All chart containers forced to visible state after filter");
  }, 50);

  console.log("All charts updated with filtered data successfully");
}

/**
 * Update category chart
 */
function updateCategoryChart(transactions) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.category) {
    chartInstances.category.destroy();
  }

  // FIXED: Process data for category chart - handle multiple currencies
  const categoryData = {};
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const amount = Math.abs(parseFloat(tx.expenses) || 0);
    const currency = tx.currency || 'USD';

    if (amount > 0) {
      // Create category key with currency info for display
      const displayCategory = currency !== 'USD' ? `${category} (${currency})` : category;
      categoryData[displayCategory] = (categoryData[displayCategory] || 0) + amount;
    }
  });

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  if (labels.length === 0) {
    console.log("No expense data for category chart");
    return;
  }

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: generateColors(labels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const label = context.label;
              // Extract currency from label if present
              const currencyMatch = label.match(/\(([A-Z]{3})\)$/);
              const currency = currencyMatch ? currencyMatch[1] : 'USD';
              const symbol = CURRENCIES[currency]?.symbol || '$';
              return `${label}: ${symbol}${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });

  console.log(`Category chart updated with ${labels.length} categories`);
}

/**
 * Update monthly chart
 */
function updateMonthlyChart(transactions) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.monthly) {
    chartInstances.monthly.destroy();
  }

  // FIXED: Process data for monthly chart - group by currency and month
  const monthlyData = {};
  const currencies = new Set();

  transactions.forEach(tx => {
    if (!tx.date) return;

    const date = new Date(tx.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const currency = tx.currency || 'USD';

    currencies.add(currency);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {};
    }
    if (!monthlyData[monthKey][currency]) {
      monthlyData[monthKey][currency] = { income: 0, expenses: 0 };
    }

    monthlyData[monthKey][currency].income += parseFloat(tx.income) || 0;
    monthlyData[monthKey][currency].expenses += parseFloat(tx.expenses) || 0;
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  if (sortedMonths.length === 0) {
    console.log("No date data for monthly chart");
    return;
  }

  // Format labels for display
  const labels = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-');
    const date = new Date(year, monthNum - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Create datasets for each currency
  const datasets = [];
  const currencyArray = Array.from(currencies).sort();

  currencyArray.forEach((currency, index) => {
    const incomeData = sortedMonths.map(month =>
      monthlyData[month][currency]?.income || 0
    );
    const expenseData = sortedMonths.map(month =>
      monthlyData[month][currency]?.expenses || 0
    );

    // Add income dataset for this currency
    datasets.push({
      label: `Income (${currency})`,
      data: incomeData,
      backgroundColor: `rgba(40, 167, 69, ${0.8 - (index * 0.2)})`,
      borderColor: `rgba(40, 167, 69, 1)`,
      borderWidth: 1
    });

    // Add expense dataset for this currency
    datasets.push({
      label: `Expenses (${currency})`,
      data: expenseData,
      backgroundColor: `rgba(220, 53, 69, ${0.8 - (index * 0.2)})`,
      borderColor: `rgba(220, 53, 69, 1)`,
      borderWidth: 1
    });
  });

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              const label = context.dataset.label;
              // Extract currency from label
              const currencyMatch = label.match(/\(([A-Z]{3})\)$/);
              const currency = currencyMatch ? currencyMatch[1] : 'USD';
              const symbol = CURRENCIES[currency]?.symbol || '$';
              return `${label}: ${symbol}${value.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666',
            callback: function (value) {
              // Show values with appropriate currency symbol
              return value.toFixed(0);
            }
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        }
      }
    }
  });

  console.log(`Monthly chart updated with ${sortedMonths.length} months and ${currencyArray.length} currencies`);
}

/**
 * Update trend chart
 */
function updateTrendChart(transactions) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.trend) {
    chartInstances.trend.destroy();
  }

  // FIXED: Process data for trend chart - handle multiple currencies
  const dailyData = {};
  const currencies = new Set();

  transactions.forEach(tx => {
    if (!tx.date) return;

    const dateKey = tx.date.split('T')[0]; // Get just the date part
    const currency = tx.currency || 'USD';

    currencies.add(currency);

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {};
    }
    if (!dailyData[dateKey][currency]) {
      dailyData[dateKey][currency] = 0;
    }

    dailyData[dateKey][currency] += parseFloat(tx.expenses) || 0;
  });

  const sortedDates = Object.keys(dailyData).sort();

  if (sortedDates.length === 0) {
    console.log("No date data for trend chart");
    return;
  }

  // Create datasets for each currency
  const datasets = [];
  const currencyArray = Array.from(currencies).sort();
  const colors = ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'];

  currencyArray.forEach((currency, index) => {
    const expenseData = sortedDates.map(date => dailyData[date][currency] || 0);

    datasets.push({
      label: `Daily Expenses (${currency})`,
      data: expenseData,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('1)', '0.2)'),
      fill: false,
      tension: 0.1
    });
  });

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              const label = context.dataset.label;
              // Extract currency from label
              const currencyMatch = label.match(/\(([A-Z]{3})\)$/);
              const currency = currencyMatch ? currencyMatch[1] : 'USD';
              const symbol = CURRENCIES[currency]?.symbol || '$';
              return `${label}: ${symbol}${value.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        }
      }
    }
  });

  console.log(`Trend chart updated with ${sortedDates.length} days and ${currencyArray.length} currencies`);
}

/**
 * Generate colors for charts
 */
function generateColors(count) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

/**
 * Clear all charts
 */
function clearAllCharts() {
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      try {
        chartInstances[key].data.labels = [];
        chartInstances[key].data.datasets = [];
        chartInstances[key].update('none');
      } catch (error) {
        console.error(`Error clearing chart ${key}:`, error);
      }
    }
  });
}
