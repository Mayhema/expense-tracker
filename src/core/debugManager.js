import { AppState } from './appState.js';
import { showToast } from '../ui/uiManager.js';

/**
 * Initialize debug mode functionality
 */
export function initializeDebugMode() {
  const debugToggle = document.getElementById('debugModeToggle');
  if (debugToggle) {
    // Load saved debug mode state
    const savedDebugMode = localStorage.getItem('debugMode') === 'true';
    debugToggle.checked = savedDebugMode;
    updateDebugMode(savedDebugMode);

    // Add event listener for debug mode toggle
    debugToggle.addEventListener('change', (e) => {
      const isDebugMode = e.target.checked;
      localStorage.setItem('debugMode', isDebugMode);
      updateDebugMode(isDebugMode);

      showToast(
        isDebugMode ? '🐛 Debug mode enabled' : '🐛 Debug mode disabled',
        'info'
      );
    });
  } else {
    console.warn("Debug toggle element not found");
  }

  console.log('✅ Debug manager initialized');
}

/**
 * Update debug mode UI and functionality
 */
function updateDebugMode(isEnabled) {
  if (isEnabled) {
    document.body.classList.add('debug-mode');
    console.log('🐛 Debug mode: ENABLED');
    console.log('📊 AppState:', AppState);
  } else {
    document.body.classList.remove('debug-mode');
    console.log('🐛 Debug mode: DISABLED');
  }
}

/**
 * Debug files information
 */
export function debugFiles() {
  try {
    const mergedFiles = AppState.mergedFiles || [];
    const debugInfo = {
      totalFiles: mergedFiles.length,
      files: mergedFiles.map(file => ({
        fileName: file.fileName,
        signature: file.signature,
        currency: file.currency,
        transactionCount: file.transactions?.length || 0,
        dateProcessed: file.dateProcessed,
        headerMapping: file.headerMapping
      }))
    };

    console.group('🗂️ Debug Files Information');
    console.log('Total Files:', debugInfo.totalFiles);
    console.table(debugInfo.files);
    console.groupEnd();

    showToast(`Debug: ${debugInfo.totalFiles} files analyzed`, 'info');
  } catch (error) {
    console.error('❌ Error in debug files:', error);
    showToast('Error debugging files', 'error');
  }
}

/**
 * Debug signatures information
 */
export function debugSignatures() {
  try {
    const mergedFiles = AppState.mergedFiles || [];
    const signatures = mergedFiles.map(file => ({
      fileName: file.fileName,
      signature: file.signature,
      columns: file.headerMapping?.length || 0
    }));

    console.group('🔍 Debug File Signatures');
    console.table(signatures);
    console.groupEnd();

    showToast(`Debug: ${signatures.length} signatures analyzed`, 'info');
  } catch (error) {
    console.error('❌ Error in debug signatures:', error);
    showToast('Error debugging signatures', 'error');
  }
}

/**
 * Debug transactions information
 */
export function debugTransactions() {
  try {
    const transactions = AppState.transactions || [];
    const debugInfo = {
      totalTransactions: transactions.length,
      byFile: {},
      byCategory: {},
      dateRange: {
        earliest: null,
        latest: null
      },
      amounts: {
        totalIncome: 0,
        totalExpenses: 0
      }
    };

    // Analyze transactions
    transactions.forEach(tx => {
      // By file
      if (tx.fileName) {
        debugInfo.byFile[tx.fileName] = (debugInfo.byFile[tx.fileName] || 0) + 1;
      }

      // By category
      const category = tx.category || 'Uncategorized';
      debugInfo.byCategory[category] = (debugInfo.byCategory[category] || 0) + 1;

      // Date range - FIXED: Use formatDateToDDMMYYYY for consistent format
      if (tx.date) {
        const date = new Date(tx.date);
        if (!debugInfo.dateRange.earliest || date < debugInfo.dateRange.earliest) {
          debugInfo.dateRange.earliest = date;
        }
        if (!debugInfo.dateRange.latest || date > debugInfo.dateRange.latest) {
          debugInfo.dateRange.latest = date;
        }
      }

      // Amounts
      if (tx.income) {
        debugInfo.amounts.totalIncome += parseFloat(tx.income) || 0;
      }
      if (tx.expenses) {
        debugInfo.amounts.totalExpenses += parseFloat(tx.expenses) || 0;
      }
    });

    console.group('📊 Debug Transactions Information');
    console.log('Total Transactions:', debugInfo.totalTransactions);
    console.log('By File:', debugInfo.byFile);
    console.log('By Category:', debugInfo.byCategory);
    console.log('Date Range:', {
      earliest: debugInfo.dateRange.earliest ? formatDateToDDMMYYYY(debugInfo.dateRange.earliest) : null,
      latest: debugInfo.dateRange.latest ? formatDateToDDMMYYYY(debugInfo.dateRange.latest) : null
    });
    console.log('Amounts:', {
      totalIncome: debugInfo.amounts.totalIncome.toFixed(2),
      totalExpenses: debugInfo.amounts.totalExpenses.toFixed(2),
      balance: (debugInfo.amounts.totalIncome - debugInfo.amounts.totalExpenses).toFixed(2)
    });
    console.groupEnd();

    showToast(`Debug: ${debugInfo.totalTransactions} transactions analyzed`, 'info');
  } catch (error) {
    console.error('❌ Error in debug transactions:', error);
    showToast('Error debugging transactions', 'error');
  }
}

/**
 * Save debug log to file
 */
export function saveDebugLog() {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      appState: {
        transactions: AppState.transactions?.length || 0,
        mergedFiles: AppState.mergedFiles?.length || 0,
        categories: Object.keys(AppState.categories || {}).length
      },
      consoleHistory: window.consoleHistory || [],
      recentErrors: window.recentErrors || [],
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const debugContent = JSON.stringify(debugData, null, 2);
    const blob = new Blob([debugContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-debug-${Date.now()}.json`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast('Debug log saved successfully', 'success');
  } catch (error) {
    console.error('❌ Error saving debug log:', error);
    showToast('Error saving debug log', 'error');
  }
}

/**
 * Reset application data
 */
export function resetApplication() {
  try {
    // Clear all localStorage data
    const keysToRemove = [
      'expenseTrackerTransactions',
      'expenseTrackerMergedFiles',
      'expenseTrackerCategories',
      'categoryOrder',
      'darkMode',
      'debugMode'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear AppState
    AppState.transactions = [];
    AppState.mergedFiles = [];
    AppState.categories = {};

    // Clear UI
    const transactionContainer = document.getElementById('transactionTableContainer');
    if (transactionContainer) {
      transactionContainer.innerHTML = '<p class="no-transactions">No transactions to display</p>';
    }

    // Reset toggles
    const darkModeToggle = document.getElementById('darkModeToggle');
    const debugModeToggle = document.getElementById('debugModeToggle');

    if (darkModeToggle) darkModeToggle.checked = false;
    if (debugModeToggle) debugModeToggle.checked = false;

    // Remove body classes
    document.body.classList.remove('dark-mode', 'debug-mode');

    showToast('Application reset successfully', 'success');

    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error) {
    console.error('❌ Error resetting application:', error);
    showToast('Error resetting application', 'error');
  }
}

/**
 * Get debug information as an object
 */
export function getDebugInfo() {
  return {
    timestamp: new Date().toISOString(),
    appState: {
      transactions: AppState.transactions?.length || 0,
      mergedFiles: AppState.mergedFiles?.length || 0,
      categories: Object.keys(AppState.categories || {}).length,
      currentFileName: AppState.currentFileName || null
    },
    localStorage: {
      size: JSON.stringify(localStorage).length,
      keys: Object.keys(localStorage)
    },
    performance: {
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
      } : 'Not available'
    },
    errors: window.recentErrors || []
  };
}
