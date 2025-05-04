import { destroyChart, displayNoDataMessage, validateChartData, generateCategoryColors, createSafeChart } from './chartCore.js';

let pieChart = null;

/**
 * Updates the expense pie chart with the given transactions
 * @param {Array} transactions - The transactions to display
 * @returns {boolean} True if successful, false otherwise
 */
export function updateExpenseChart(transactions) {
  try {
    console.log("Updating expense chart with", transactions?.length || 0, "transactions");
    
    // Get the canvas
    const canvas = document.getElementById("expenseChart");
    if (!canvas) {
      console.error("Expense chart canvas not found");
      return false;
    }
    
    // Clean up existing chart
    pieChart = destroyChart(pieChart);
    
    // Validate data
    const validTransactions = validateChartData(transactions);
    
    // If no valid transactions, show a message
    if (!validTransactions.length) {
      displayNoDataMessage("expenseChart", "No expense data to display");
      return false;
    }
    
    // Group by category
    const categoryTotals = {};
    validTransactions.forEach(tx => {
      // Only consider expenses (not income)
      const amount = parseFloat(tx.expenses) || 0;
      if (!amount) return;
      
      const category = tx.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    // If no categories with expenses, show message
    const categories = Object.keys(categoryTotals);
    if (!categories.length) {
      displayNoDataMessage("expenseChart", "No categorized expenses to display");
      return false;
    }
    
    // Sort categories by amount
    categories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);
    
    // Create the chart data
    const chartData = {
      labels: categories,
      datasets: [{
        data: categories.map(cat => categoryTotals[cat]),
        backgroundColor: generateCategoryColors(categories),
        borderWidth: 1
      }]
    };
    
    // Create the chart using the safer method
    pieChart = createSafeChart("expenseChart", {
      type: 'pie',
      data: chartData,
      options: {
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                return '$' + value.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                });
              }
            }
          },
          title: {
            display: true,
            text: 'Expenses by Category'
          }
        },
        layout: {
          padding: 20
        }
      }
    });
    
    return !!pieChart;
  } catch (error) {
    console.error("Error updating expense chart:", error);
    displayNoDataMessage("expenseChart", "Error rendering chart");
    return false;
  }
}

/**
 * Cleans up the expense chart
 */
export function cleanupExpenseChart() {
  pieChart = destroyChart(pieChart);
}