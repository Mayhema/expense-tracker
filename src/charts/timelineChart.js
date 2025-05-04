import { destroyChart, displayNoDataMessage, validateChartData } from './chartCore.js';

let timelineChart = null;

/**
 * Samples transactions evenly to avoid overloading the timeline chart
 * @param {Array} transactions - The transactions to sample
 * @param {number} maxPoints - Maximum number of data points
 * @returns {Array} Sampled transactions
 */
function sampleTransactions(transactions, maxPoints) {
  if (!transactions || transactions.length <= maxPoints) return transactions;
  
  // Sort by date
  const sortedTx = [...transactions].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  // Take evenly spaced samples
  const result = [];
  const step = sortedTx.length / maxPoints;
  
  // Always include first and last
  result.push(sortedTx[0]);
  
  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.floor(i * step);
    if (index < sortedTx.length) {
      result.push(sortedTx[index]);
    }
  }
  
  // Add the last point
  if (sortedTx.length > 1) {
    result.push(sortedTx[sortedTx.length - 1]);
  }
  
  return result;
}

// Replace the updateTimelineChart function with this optimized version

export function updateTimelineChart(transactions) {
  try {
    console.log("Updating timeline chart with", transactions?.length || 0, "transactions");
    
    // Get the canvas
    const canvas = document.getElementById("timelineChart");
    if (!canvas) {
      console.error("Timeline chart canvas not found");
      return false;
    }
    
    // Clean up existing chart
    timelineChart = destroyChart(timelineChart);
    
    // Validate data
    const validTransactions = validateChartData(transactions);
    
    // If no valid transactions, show a message
    if (!validTransactions.length) {
      displayNoDataMessage("timelineChart", "No transaction data to display");
      return false;
    }
    
    // Sort transactions by date
    // Sample transactions if there are too many to display
    const MAX_CHART_POINTS = 100;
    const sampledTransactions = sampleTransactions(validTransactions, MAX_CHART_POINTS);
    
    // Sort transactions by date
    const sortedTransactions = [...sampledTransactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    // Determine date range for better scale configuration
    const firstDate = new Date(sortedTransactions[0].date);
    const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    const dayDiff = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    // Choose appropriate time unit based on date range
    let timeUnit = 'day';
    if (dayDiff > 60) timeUnit = 'month';
    if (dayDiff > 730) timeUnit = 'year';
    
    console.log(`Date range spans ${dayDiff} days, using ${timeUnit} as time unit`);
    
    // Group by date using a simplified approach to avoid manipulation issues
    const incomeByDate = {};
    const expensesByDate = {};
    const allDates = new Set();
    
    sortedTransactions.forEach(tx => {
      const dateStr = tx.date;
      allDates.add(dateStr);
      
      if (tx.income) {
        const amount = parseFloat(tx.income) || 0;
        incomeByDate[dateStr] = (incomeByDate[dateStr] || 0) + amount;
      }
      
      if (tx.expenses) {
        const amount = parseFloat(tx.expenses) || 0;
        expensesByDate[dateStr] = (expensesByDate[dateStr] || 0) + amount;
      }
    });
    
    // Convert to arrays for Chart.js
    const dateLabels = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
    
    // Create chart with simpler configuration
    try {
      timelineChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: dateLabels,
          datasets: [
            {
              label: 'Income',
              data: dateLabels.map(date => incomeByDate[date] || 0),
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: true,
              tension: 0.1
            },
            {
              label: 'Expenses',
              data: dateLabels.map(date => expensesByDate[date] || 0),
              borderColor: '#FF6384',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              fill: true,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timeUnit,
                displayFormats: {
                  day: 'MMM d',
                  month: 'MMM yyyy',
                  year: 'yyyy'
                }
              },
              title: {
                display: true,
                text: 'Date'
              },
              ticks: {
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: 12
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount ($)'
              },
              ticks: {
                // Use a safe formatter that won't cause range errors
                callback: function(value) {
                  return '$' + value.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  });
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y;
                  return '$' + value.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  });
                }
              },
              position: 'nearest' // Use a simpler positioning mode
            },
            legend: {
              position: 'top'
            }
          },
          // Disable animations for better performance and fewer positioning issues
          animation: {
            duration: 0
          },
          // Use simpler interaction mode to avoid positioning issues
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          // Limit events that might cause positioning issues
          events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']
        }
      });
      
      return true;
    } catch (chartError) {
      console.error("Error creating timeline chart:", chartError);
      displayNoDataMessage("timelineChart", "Error creating chart");
      return false;
    }
  } catch (error) {
    console.error("Error updating timeline chart:", error);
    displayNoDataMessage("timelineChart", "Error rendering chart");
    return false;
  }
}

/**
 * Cleans up the timeline chart
 */
export function cleanupTimelineChart() {
  timelineChart = destroyChart(timelineChart);
}