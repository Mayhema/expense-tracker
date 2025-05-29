/**
 * Charts module for the expense tracker
 */

let Chart = null; // Will be loaded dynamically

/**
 * Initialize charts functionality
 */
export async function initializeCharts() {
  try {
    console.log("Loading Chart.js library...");

    // Try to load Chart.js from CDN or local
    if (typeof window !== 'undefined' && window.Chart) {
      Chart = window.Chart;
      console.log("Chart.js loaded from global");
    } else {
      // Try to import Chart.js (if available)
      try {
        // First try to load from CDN if not already loaded
        if (!window.Chart) {
          await loadChartJSFromCDN();
        }

        if (window.Chart) {
          Chart = window.Chart;
          console.log("Chart.js loaded from CDN");
        }
      } catch (importError) {
        console.warn("Chart.js not available, charts will be disabled:", importError.message);
        Chart = null;
        return false;
      }
    }

    if (Chart) {
      setupChartContainers();
      console.log("Charts initialized successfully");
      return true;
    } else {
      console.warn("Chart.js not available, charts will be disabled");
      return false;
    }
  } catch (error) {
    console.error("Error initializing charts:", error);
    return false;
  }
}

/**
 * Load Chart.js from CDN
 */
async function loadChartJSFromCDN() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      console.log("Chart.js loaded from CDN");
      resolve();
    };
    script.onerror = (error) => {
      console.warn("Failed to load Chart.js from CDN");
      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * Setup chart containers
 */
function setupChartContainers() {
  // Look for charts section first
  let chartsSection = document.getElementById('chartsSection');

  if (!chartsSection) {
    // Try to find financial overview section
    chartsSection = document.getElementById('financialOverview');
  }

  if (!chartsSection) {
    // Create the charts section if it doesn't exist
    chartsSection = document.createElement('div');
    chartsSection.id = 'chartsSection';
    chartsSection.className = 'section';

    // Find main content area to append to
    const mainContent = document.querySelector('.main-content') || document.body;

    // Insert after header or at the beginning
    const header = document.querySelector('.header');
    if (header && header.nextSibling) {
      mainContent.insertBefore(chartsSection, header.nextSibling);
    } else {
      mainContent.appendChild(chartsSection);
    }

    console.log("Created charts section");
  }

  // Create chart containers if they don't exist
  if (!document.getElementById('expenseChart')) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'charts-container';
    chartContainer.innerHTML = `
      <div class="section-header">
        <h2>📈 Financial Overview</h2>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>📈 Monthly Trends</h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="expenseChart" width="400" height="200"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>📊 Category Breakdown</h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="categoryChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    `;
    chartsSection.appendChild(chartContainer);

    // Add styles for better chart display
    if (!document.getElementById('chartStyles')) {
      const style = document.createElement('style');
      style.id = 'chartStyles';
      style.textContent = `
        .charts-container {
          padding: 20px;
          width: 100%;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
        }

        .chart-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .chart-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .chart-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #333;
        }

        .chart-wrapper {
          position: relative;
          width: 100%;
          height: 250px;
        }

        .chart-wrapper canvas {
          width: 100% !important;
          height: 100% !important;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .dark-mode .chart-card {
          background: #2a2a2a;
          border-color: #444;
        }

        .dark-mode .chart-header h3 {
          color: #e0e0e0;
        }
      `;
      document.head.appendChild(style);
    }

    console.log("Chart containers created successfully");
  }
}

/**
 * Update charts with transaction data
 */
export function updateCharts(transactions = []) {
  if (!Chart) {
    console.warn("Chart.js not available, skipping chart updates");
    return;
  }

  try {
    updateExpenseChart(transactions);
    updateCategoryChart(transactions);
  } catch (error) {
    console.error("Error updating charts:", error);
  }
}

/**
 * Update expense chart
 */
function updateExpenseChart(transactions) {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (canvas.chart) {
    canvas.chart.destroy();
  }

  // Prepare data
  const monthlyData = processMonthlyData(transactions);

  canvas.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Expenses',
        data: monthlyData.expenses,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Income',
        data: monthlyData.income,
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

/**
 * Update category chart
 */
function updateCategoryChart(transactions) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (canvas.chart) {
    canvas.chart.destroy();
  }

  // Prepare data
  const categoryData = processCategoryData(transactions);

  canvas.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryData.labels,
      datasets: [{
        data: categoryData.amounts,
        backgroundColor: categoryData.colors,
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
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: false
        }
      },
      cutout: '60%'
    }
  });
}

/**
 * Process transactions into monthly data
 */
function processMonthlyData(transactions) {
  const monthlyExpenses = {};
  const monthlyIncome = {};

  transactions.forEach(transaction => {
    if (!transaction.date) return;

    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (transaction.expenses) {
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + parseFloat(transaction.expenses);
    }
    if (transaction.income) {
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + parseFloat(transaction.income);
    }
  });

  const allMonths = new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyIncome)]);
  const sortedMonths = Array.from(allMonths).sort();

  return {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }),
    expenses: sortedMonths.map(month => monthlyExpenses[month] || 0),
    income: sortedMonths.map(month => monthlyIncome[month] || 0)
  };
}

/**
 * Process transactions into category data
 */
function processCategoryData(transactions) {
  const categoryTotals = {};

  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    const amount = parseFloat(transaction.expenses || 0);

    if (amount > 0) {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);
  const colors = generateColors(labels.length);

  return { labels, amounts, colors };
}

/**
 * Generate colors for chart
 */
function generateColors(count) {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#e91e63'
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}
