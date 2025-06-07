import { AppState } from '../core/appState.js';
import { showModal } from '../ui/modalManager.js';

/**
 * Enhanced debug function for transaction data with detailed analysis
 */
export function inspectTransactionData() {
  const modalContent = document.createElement('div');
  const transactions = AppState.transactions || [];
  const transactionCount = transactions.length;

  if (transactionCount === 0) {
    modalContent.innerHTML = '<p>No transaction data available to inspect.</p>';
    showModal({
      title: "Transaction Debug Analysis",
      content: modalContent,
      size: "medium"
    });
    return;
  }

  // Comprehensive analysis
  const analysis = analyzeTransactions(transactions);

  modalContent.innerHTML = `
    <div class="debug-info" style="max-height: 500px; overflow-y: auto;">
      <div class="debug-section">
        <h3>Transaction Summary</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p><strong>Total Transactions:</strong> ${analysis.total}</p>
            <p><strong>Date Range:</strong> ${analysis.dateRange}</p>
            <p><strong>Total Income:</strong> ${analysis.totalIncome}</p>
            <p><strong>Total Expenses:</strong> ${analysis.totalExpenses}</p>
            <p><strong>Net Balance:</strong> ${analysis.netBalance}</p>
          </div>
          <div>
            <p><strong>Currencies:</strong> ${analysis.currencies.join(', ')}</p>
            <p><strong>Categories:</strong> ${analysis.categoryCount} unique</p>
            <p><strong>Uncategorized:</strong> ${analysis.uncategorized}</p>
            <p><strong>Average Transaction:</strong> ${analysis.avgAmount}</p>
            <p><strong>Source Files:</strong> ${analysis.sourceFiles.length}</p>
          </div>
        </div>
      </div>

      <div class="debug-section">
        <h3>Category Breakdown</h3>
        <div style="max-height: 150px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 5px; border: 1px solid #ddd;">Category</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Count</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(analysis.categoryBreakdown).map(([cat, data]) => `
                <tr>
                  <td style="padding: 5px; border: 1px solid #ddd;">${cat}</td>
                  <td style="padding: 5px; border: 1px solid #ddd;">${data.count}</td>
                  <td style="padding: 5px; border: 1px solid #ddd;">${data.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="debug-section">
        <h3>Data Quality Issues</h3>
        <ul>
          ${analysis.issues.map(issue => `<li style="color: #dc3545;">${issue}</li>`).join('')}
          ${analysis.issues.length === 0 ? '<li style="color: #28a745;">No data quality issues found</li>' : ''}
        </ul>
      </div>

      <div class="debug-section">
        <h3>Sample Transactions (First 10)</h3>
        <div style="max-height: 200px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 4px; border: 1px solid #ddd;">Date</th>
                <th style="padding: 4px; border: 1px solid #ddd;">Description</th>
                <th style="padding: 4px; border: 1px solid #ddd;">Amount</th>
                <th style="padding: 4px; border: 1px solid #ddd;">Category</th>
                <th style="padding: 4px; border: 1px solid #ddd;">Currency</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.slice(0, 10).map(tx => `
                <tr>
                  <td style="padding: 4px; border: 1px solid #ddd;">${tx.date || 'N/A'}</td>
                  <td style="padding: 4px; border: 1px solid #ddd; max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${tx.description || ''}">${tx.description || 'N/A'}</td>
                  <td style="padding: 4px; border: 1px solid #ddd;">${(parseFloat(tx.income) || 0) - (parseFloat(tx.expenses) || 0)}</td>
                  <td style="padding: 4px; border: 1px solid #ddd;">${tx.category || 'Uncategorized'}</td>
                  <td style="padding: 4px; border: 1px solid #ddd;">${tx.currency || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  showModal({
    title: "Transaction Debug Analysis",
    content: modalContent,
    size: "large"
  });
}

/**
 * Comprehensive transaction analysis
 */
function analyzeTransactions(transactions) {
  const analysis = {
    total: transactions.length,
    totalIncome: 0,
    totalExpenses: 0,
    currencies: new Set(),
    categories: new Set(),
    sourceFiles: new Set(),
    uncategorized: 0,
    categoryBreakdown: {},
    issues: [],
    dates: [],
    idAnalysis: {
      withIds: 0,
      withoutIds: 0,
      duplicateIds: 0,
      uniqueIds: new Set()
    }
  };

  const seenIds = new Set();

  transactions.forEach((tx, index) => {
    // Enhanced ID analysis
    if (tx.id) {
      analysis.idAnalysis.withIds++;
      analysis.idAnalysis.uniqueIds.add(tx.id);

      if (seenIds.has(tx.id)) {
        analysis.idAnalysis.duplicateIds++;
        analysis.issues.push(`Transaction ${index + 1}: Duplicate ID ${tx.id}`);
      } else {
        seenIds.add(tx.id);
      }
    } else {
      analysis.idAnalysis.withoutIds++;
      analysis.issues.push(`Transaction ${index + 1}: Missing ID`);
    }

    // Analyze income/expenses
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;
    analysis.totalIncome += income;
    analysis.totalExpenses += expenses;

    // Analyze currencies
    if (tx.currency) {
      analysis.currencies.add(tx.currency);
    }

    // Analyze categories
    const category = tx.category || 'Uncategorized';
    analysis.categories.add(category);

    if (!tx.category) {
      analysis.uncategorized++;
    }

    // Category breakdown
    if (!analysis.categoryBreakdown[category]) {
      analysis.categoryBreakdown[category] = { count: 0, amount: 0 };
    }
    analysis.categoryBreakdown[category].count++;
    analysis.categoryBreakdown[category].amount += (income + expenses);

    // Source files
    if (tx.fileName) {
      analysis.sourceFiles.add(tx.fileName);
    }

    // Dates
    if (tx.date) {
      analysis.dates.push(new Date(tx.date));
    }

    // Data quality checks
    if (!tx.date) {
      analysis.issues.push(`Transaction ${index + 1}: Missing date`);
    }
    if (!tx.description) {
      analysis.issues.push(`Transaction ${index + 1}: Missing description`);
    }
    if (income === 0 && expenses === 0) {
      analysis.issues.push(`Transaction ${index + 1}: Zero amount`);
    }
  });

  // Finalize analysis
  analysis.currencies = Array.from(analysis.currencies);
  analysis.sourceFiles = Array.from(analysis.sourceFiles);
  analysis.categoryCount = analysis.categories.size;
  analysis.netBalance = (analysis.totalIncome - analysis.totalExpenses).toFixed(2);
  analysis.avgAmount = transactions.length > 0 ?
    ((analysis.totalIncome + analysis.totalExpenses) / transactions.length).toFixed(2) : '0.00';

  // Add ID consistency check
  analysis.idConsistency = {
    hasAllIds: analysis.idAnalysis.withoutIds === 0,
    hasNoDuplicates: analysis.idAnalysis.duplicateIds === 0,
    uniqueIdCount: analysis.idAnalysis.uniqueIds.size,
    totalTransactions: analysis.total
  };

  return analysis;
}

/**
 * Debug function for merged files
 */
export function debugMergedFiles() {
  console.log("Debug merged files triggered", AppState.mergedFiles);

  const modalContent = document.createElement('div');

  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    modalContent.innerHTML = '<p>No merged files available to debug.</p>';
  } else {
    const filesInfo = AppState.mergedFiles.map((file, index) => {
      return `
        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
          <h4>File ${index + 1}: ${file.fileName || 'Unknown'}</h4>
          <p><strong>Signature:</strong> ${file.signature || 'None'}</p>
          <p><strong>Data rows:</strong> ${file.data ? file.data.length : 0}</p>
          <p><strong>Header row:</strong> ${file.headerRowIndex || 0}</p>
          <p><strong>Data start row:</strong> ${file.dataRowIndex || 1}</p>
          <p><strong>Currency:</strong> ${file.currency || 'USD'}</p>
        </div>
      `;
    }).join('');

    modalContent.innerHTML = `
      <h3>Merged Files Debug (${AppState.mergedFiles.length} files)</h3>
      ${filesInfo}
    `;
  }

  showModal({
    title: "Merged Files Debug",
    content: modalContent,
    size: "large"
  });
}

/**
 * Debug function for signatures
 */
export function debugSignatures() {
  const modalContent = document.createElement('div');

  // Current file signature section
  let currentFileSection = '<h3>Current File Signature</h3>';
  if (AppState.currentFileSignature && AppState.currentFileName) {
    currentFileSection += `
      <p><strong>File:</strong> ${AppState.currentFileName}</p>
      <p><strong>Signature:</strong> ${AppState.currentFileSignature}</p>
    `;
  } else {
    currentFileSection += '<p>No current file signature available.</p>';
  }

  // FIXED: Get saved mappings from localStorage
  const mappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '[]');
  let mappingsSection = '<h3>Saved Format Mappings</h3>';

  if (mappings.length > 0) {
    mappingsSection += mappings.map((mapping, index) => {
      const fields = mapping.mapping ? mapping.mapping.filter(m => m !== '–').join(', ') : 'No mapping';
      const created = mapping.created ? new Date(mapping.created).toLocaleString() : 'Unknown';

      return `
        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
          <strong>Mapping ${index + 1}:</strong> ${mapping.signature || 'Unknown signature'}<br>
          <strong>File:</strong> ${mapping.fileName || 'Unknown'}<br>
          <strong>Fields:</strong> ${fields}<br>
          <strong>Created:</strong> ${created}
        </div>
      `;
    }).join('');
  } else {
    mappingsSection += '<p>No saved mappings found.</p>';
  }

  // Merged files signatures section
  let filesSection = '<h3>Merged Files Signatures</h3>';
  if (AppState.mergedFiles?.length > 0) {
    filesSection += AppState.mergedFiles.map((file, index) => `
      <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
        <strong>${file.fileName}:</strong> ${file.signature || 'No signature'}<br>
        <strong>Mapping:</strong> ${file.headerMapping ? file.headerMapping.filter(m => m !== '–').join(', ') : 'No mapping'}<br>
        <strong>Transactions:</strong> ${file.transactions ? file.transactions.length : 0}
      </div>
    `).join('');
  } else {
    filesSection += '<p>No merged files available.</p>';
  }

  // Combine all sections
  modalContent.innerHTML = currentFileSection + mappingsSection + filesSection;

  showModal({
    title: "🔍 Debug: File Signatures & Mappings",
    content: modalContent,
    size: "large"
  });
}

/**
 * Check if debug mode is active
 */
function isDebugModeActive() {
  return localStorage.getItem('debugMode') === 'true' &&
    document.body.classList.contains('debug-mode');
}

/**
 * Make sure debug functions are attached to window
 */
export function attachDebugFunctions() {
  // Only attach debug functions once
  if (window.debugFunctionsAttached) return;

  // Ensure these functions are available globally
  window.inspectTransactionData = inspectTransactionData;
  window.debugMergedFiles = debugMergedFiles;
  window.debugSignatures = debugSignatures;
  window.resetApplication = resetApplication;

  console.log("Debug functions attached to window");

  window.debugFunctionsAttached = true;

  // Add event listeners to debug buttons if DOM is ready, otherwise wait
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachDebugButtonListeners);
  } else {
    attachDebugButtonListeners();
  }
}

/**
 * Update the attachDebugButtonListeners function
 */
function attachDebugButtonListeners() {
  // Only attach once
  if (window.debugButtonsAttached) return;

  console.log("Attaching debug button listeners...");

  // Check if debug mode is active before attaching
  if (!isDebugModeActive()) {
    console.log("Debug mode not active, skipping button listener attachment");
    return;
  }

  // Use a more reliable method to attach listeners
  setTimeout(() => {
    const debugButtons = [
      { id: 'debugFilesBtn', handler: debugMergedFiles },
      { id: 'debugSignaturesBtn', handler: debugSignatures },
      { id: 'debugTransactionsBtn', handler: inspectTransactionData },
      { id: 'resetAppBtn', handler: resetApplication }
    ];

    debugButtons.forEach(({ id, handler }) => {
      const button = document.getElementById(id);
      if (button && !button.dataset.listenerAttached) {
        button.addEventListener('click', handler);
        button.dataset.listenerAttached = 'true';
        console.log(`Attached listener to ${id}`);
      }
    });

    window.debugButtonsAttached = true;
    console.log("Debug button listeners attached successfully");
  }, 500);
}

/**
 * Reset application function with improved error handling
 */
export function resetApplication() {
  console.log("Reset application triggered");

  if (confirm('Are you sure you want to reset the application? This will clear all data and reload the page.')) {
    try {
      // Clear all localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Show confirmation
      alert('Application reset complete. The page will now reload.');

      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Error during reset:', error);
      alert('Error occurred during reset. Please refresh the page manually.');
    }
  }
}

// Call attachDebugFunctions immediately when module loads
attachDebugFunctions();
