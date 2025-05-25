import { AppState } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from "../core/constants.js";
// FIXED: Removed unused imports
import { showToast } from "../ui/uiManager.js";
import { showModal } from "../ui/modalManager.js";

/**
 * Enhanced debug function for transaction data with detailed analysis
 */
export function inspectTransactionData() {
  const modalContent = document.createElement('div');
  const transactions = AppState.transactions || [];
  const transactionCount = transactions.length;

  if (transactionCount === 0) {
    modalContent.innerHTML = '<p>No transactions found to analyze.</p>';
    showModal({
      title: "Transaction Debug - No Data",
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
    dates: []
  };

  transactions.forEach((tx, index) => {
    // Financial totals
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;
    analysis.totalIncome += income;
    analysis.totalExpenses += expenses;

    // Track currencies
    if (tx.currency) {
      analysis.currencies.add(tx.currency);
    }

    // Track categories
    const category = tx.category || 'Uncategorized';
    analysis.categories.add(category);

    if (!tx.category || tx.category.toLowerCase() === 'other') {
      analysis.uncategorized++;
    }

    // Category breakdown
    if (!analysis.categoryBreakdown[category]) {
      analysis.categoryBreakdown[category] = { count: 0, amount: 0 };
    }
    analysis.categoryBreakdown[category].count++;
    analysis.categoryBreakdown[category].amount += Math.abs(income - expenses);

    // Track source files
    if (tx.fileName) {
      analysis.sourceFiles.add(tx.fileName);
    }

    // Track dates
    if (tx.date) {
      analysis.dates.push(new Date(tx.date));
    }

    // Data quality checks
    if (!tx.date) {
      analysis.issues.push(`Transaction ${index + 1}: Missing date`);
    }
    if (!tx.description || tx.description.trim() === '') {
      analysis.issues.push(`Transaction ${index + 1}: Missing description`);
    }
    if (income === 0 && expenses === 0) {
      analysis.issues.push(`Transaction ${index + 1}: Zero amount`);
    }
    if (income > 0 && expenses > 0) {
      analysis.issues.push(`Transaction ${index + 1}: Both income and expense values present`);
    }
  });

  // Finalize analysis
  analysis.currencies = Array.from(analysis.currencies);
  analysis.sourceFiles = Array.from(analysis.sourceFiles);
  analysis.categoryCount = analysis.categories.size;
  analysis.netBalance = (analysis.totalIncome - analysis.totalExpenses).toFixed(2);
  analysis.avgAmount = transactions.length > 0 ?
    ((analysis.totalIncome + analysis.totalExpenses) / transactions.length).toFixed(2) : '0.00';

  // Date range
  if (analysis.dates.length > 0) {
    const sortedDates = analysis.dates.sort((a, b) => a - b);
    const startDate = sortedDates[0].toLocaleDateString();
    const endDate = sortedDates[sortedDates.length - 1].toLocaleDateString();
    analysis.dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  } else {
    analysis.dateRange = 'No dates found';
  }

  // Format monetary values
  analysis.totalIncome = analysis.totalIncome.toFixed(2);
  analysis.totalExpenses = analysis.totalExpenses.toFixed(2);

  return analysis;
}

/**
 * Debug function for merged files
 */
export function debugMergedFiles() {
  console.log("Debug merged files triggered", AppState.mergedFiles);

  const modalContent = document.createElement('div');

  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    modalContent.innerHTML = `<p>No merged files found in AppState.</p>`;
  } else {
    modalContent.innerHTML = `
      <div class="merged-files-debug">
        <h3>Merged Files (${AppState.mergedFiles.length})</h3>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Data Rows</th>
              <th>Header Fields</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            ${AppState.mergedFiles.map(file => {
      const fields = (file.headerMapping || []).join(", ");
      return `
                <tr>
                  <td>${file.fileName}</td>
                  <td>${file.data ? file.data.length : 0}</td>
                  <td>${fields}</td>
                  <td style="font-size:0.8em; word-break:break-all;">${file.signature || 'missing'}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>

        <h3>Sample Data</h3>
        <div style="max-height:200px; overflow:auto;">
          <pre style="font-size:0.8em;">${JSON.stringify(
      AppState.mergedFiles[0]?.data?.slice(0, 2) || "No data",
      null, 2
    )}</pre>
        </div>
      </div>
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
  console.log("Debug signatures triggered");

  const modalContent = document.createElement('div');

  // Current file signature section
  let currentFileSection = '<h3>Current File Signature</h3>';
  if (AppState.currentFileSignature && AppState.currentFileName) {
    currentFileSection += `
      <p><strong>File currently being previewed:</strong> ${AppState.currentFileName}</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
        <tr>
          <th style="text-align:left; padding:8px; background:#f5f5f5;">Type</th>
          <th style="text-align:left; padding:8px; background:#f5f5f5;">Value</th>
        </tr>
        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;">Format Signature</td>
          <td style="padding:8px; border-bottom:1px solid #eee; word-break:break-all;">
            <code>${AppState.currentFileSignature.formatSig || 'N/A'}</code>
          </td>
        </tr>
        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;">Content Signature</td>
          <td style="padding:8px; border-bottom:1px solid #eee; word-break:break-all;">
            <code>${AppState.currentFileSignature.contentSig || 'N/A'}</code>
          </td>
        </tr>
      </table>
    `;
  } else {
    currentFileSection += '<p>No current file signature (no file is being previewed)</p>';
  }

  // Saved mappings section
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");
  let mappingsSection = '<h3>Saved Format Mappings</h3>';

  if (mappings.length > 0) {
    mappingsSection += `
      <div style="max-height:200px; overflow:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">Signature</th>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">Fields</th>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">Created</th>
          </tr>
          ${mappings.map(entry => {
      const fields = entry.mapping?.filter(m => m !== "–").join(", ") || "No mapping";
      const created = entry.created ? new Date(entry.created).toLocaleString() : 'Unknown';
      const sig = entry.signature || "Missing signature";

      return `
              <tr>
                <td style="padding:8px; border-bottom:1px solid #eee; word-break:break-all;">
                  <code>${typeof sig === 'object' ? JSON.stringify(sig) : sig}</code>
                </td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${fields}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${created}</td>
              </tr>
            `;
    }).join('')}
        </table>
      </div>
    `;
  } else {
    mappingsSection += '<p>No saved mappings found</p>';
  }

  // Merged files signatures section
  let filesSection = '<h3>Merged Files Signatures</h3>';
  if (AppState.mergedFiles?.length > 0) {
    filesSection += `
      <div style="max-height:200px; overflow:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">File Name</th>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">Signature</th>
            <th style="text-align:left; padding:8px; background:#f5f5f5;">Header Fields</th>
          </tr>
          ${AppState.mergedFiles.map(file => {
      const fields = (file.headerMapping || []).join(", ");
      return `
              <tr>
                <td style="padding:8px; border-bottom:1px solid #eee;">${file.fileName}</td>
                <td style="padding:8px; border-bottom:1px solid #eee; word-break:break-all;">
                  <code>${file.signature || 'missing'}</code>
                </td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${fields}</td>
              </tr>
            `;
    }).join('')}
        </table>
      </div>
    `;
  } else {
    filesSection += '<p>No merged files found</p>';
  }

  // Combine all sections
  modalContent.innerHTML = currentFileSection + mappingsSection + filesSection;

  showModal({
    title: "Signature Debug Info",
    content: modalContent,
    size: "large"
  });
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
    document.addEventListener('DOMContentLoaded', attachDebugButtonListeners);
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

  // Use a more reliable method to attach listeners after a longer delay
  setTimeout(() => {
    // Check if debug mode is enabled first
    const isDebugMode = document.body.classList.contains('debug-mode');

    if (!isDebugMode) {
      console.log("Debug mode not active, deferring button listener attachment");
      // Try again later if debug mode gets enabled
      setTimeout(attachDebugButtonListeners, 2000);
      return;
    }

    // Debug files button
    const debugFilesBtn = document.getElementById('debugFilesBtn');
    if (debugFilesBtn) {
      // Remove any existing listeners
      const newBtn = debugFilesBtn.cloneNode(true);
      debugFilesBtn.parentNode.replaceChild(newBtn, debugFilesBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Debug files button clicked");
        debugMergedFiles();
      });
      console.log("Debug files button listener attached");
    } else {
      console.warn("Debug files button not found - creating it");
      createDebugButton('debugFilesBtn', '🗂️', 'Debug Files', debugMergedFiles);
    }

    // Debug signatures button
    const debugSignaturesBtn = document.getElementById('debugSignaturesBtn');
    if (debugSignaturesBtn) {
      // Remove any existing listeners
      const newBtn = debugSignaturesBtn.cloneNode(true);
      debugSignaturesBtn.parentNode.replaceChild(newBtn, debugSignaturesBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Debug signatures button clicked");
        debugSignatures();
      });
      console.log("Debug signatures button listener attached");
    } else {
      console.warn("Debug signatures button not found - creating it");
      createDebugButton('debugSignaturesBtn', '🔍', 'Debug Signatures', debugSignatures);
    }

    // Reset application button
    const resetAppBtn = document.getElementById('resetAppBtn');
    if (resetAppBtn) {
      // Remove any existing listeners
      const newBtn = resetAppBtn.cloneNode(true);
      resetAppBtn.parentNode.replaceChild(newBtn, resetAppBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Reset application button clicked");
        resetApplication();
      });
      console.log("Reset application button listener attached");
    } else {
      console.warn("Reset application button not found - creating it");
      createDebugButton('resetAppBtn', '🔄', 'Reset App', resetApplication);
    }

    window.debugButtonsAttached = true;
    console.log("Debug button listeners attached");
  }, 1000); // Increased delay to ensure DOM is ready
}

/**
 * Create debug button if it doesn't exist
 */
function createDebugButton(id, icon, text, handler) {
  // Find debug section or create it
  let debugSection = document.getElementById('debugSection');
  if (!debugSection) {
    debugSection = createDebugSection();
  }

  const actionButtons = debugSection.querySelector('.action-buttons');
  if (actionButtons) {
    const button = document.createElement('button');
    button.id = id;
    button.className = 'action-button debug-only';
    if (id === 'resetAppBtn') {
      button.style.backgroundColor = '#dc3545';
    }

    button.innerHTML = `
      <span class="action-icon">${icon}</span>
      <span class="action-text">${text}</span>
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });

    actionButtons.appendChild(button);
    console.log(`Created debug button: ${id}`);
  }
}

/**
 * Create debug section if it doesn't exist
 */
function createDebugSection() {
  const debugSection = document.createElement('div');
  debugSection.className = 'section debug-only';
  debugSection.id = 'debugSection';

  debugSection.innerHTML = `
    <div class="section-header">
      <h2>Debug Tools</h2>
    </div>
    <div class="section-content">
      <div class="action-buttons">
        <!-- Debug buttons will be added here -->
      </div>
    </div>
  `;

  // Insert after the first section
  const firstSection = document.querySelector('.section');
  if (firstSection && firstSection.parentNode) {
    firstSection.parentNode.insertBefore(debugSection, firstSection.nextSibling);
  } else {
    document.body.appendChild(debugSection);
  }

  console.log("Created debug section");
  return debugSection;
}

// Helper function to detect production mode - FIXED: removed process.env reference
function isProduction() {
  // Browser-safe environment detection (no process.env)
  return location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1' &&
    !location.hostname.includes('.local');
}

/**
 * Reset application function
 */
function resetApplication() {
  console.log("Reset application triggered");

  // Show confirmation dialog
  if (confirm("Reset the entire application? This will delete ALL your data and cannot be undone.")) {
    try {
      // Clear localStorage
      localStorage.removeItem("mergedFiles");
      localStorage.removeItem("fileFormatMappings");
      localStorage.removeItem("expenseCategories");
      localStorage.removeItem("transactions");
      localStorage.removeItem("categoryMappings");

      // Reset AppState
      if (AppState) {
        AppState.mergedFiles = [];
        AppState.transactions = [];
        AppState.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      }

      // Provide visual feedback
      showToast("Application reset. Reloading...", "info");

      // Actually reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Error during application reset:", err);
      showToast("Error resetting application: " + err.message, "error");
    }
  } else {
    console.log("Application reset cancelled by user");
  }
}

// Call attachDebugFunctions immediately
attachDebugFunctions();
