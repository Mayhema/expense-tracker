import { AppState } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from "../core/constants.js";
// FIXED: Removed unused imports
import { showToast } from "../ui/uiManager.js";
import { showModal } from "../ui/modalManager.js";

/**
 * Debug function for transaction data
 */
export function inspectTransactionData() {
  console.log("Transaction inspection triggered", AppState.transactions);

  // Create a modal to show transaction info
  const modalContent = document.createElement('div');

  // Transaction summary
  const transactionCount = AppState.transactions?.length || 0;
  const incomeTotal = (AppState.transactions || [])
    .reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0).toFixed(2);
  const expensesTotal = (AppState.transactions || [])
    .reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0).toFixed(2);

  modalContent.innerHTML = `
    <div class="debug-info">
      <h3>Transaction Summary</h3>
      <p>Total Transactions: ${transactionCount}</p>
      <p>Total Income: ${incomeTotal}</p>
      <p>Total Expenses: ${expensesTotal}</p>

      <h3>Transaction Details</h3>
      <div class="transaction-detail-table" style="max-height:300px; overflow-y:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${(AppState.transactions || []).slice(0, 50).map(tx => `
              <tr>
                <td>${tx.date || ''}</td>
                <td>${tx.description || ''}</td>
                <td>${tx.income || ''}</td>
                <td>${tx.expenses || ''}</td>
                <td>${tx.category || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${transactionCount > 50 ? `<p>Showing 50 of ${transactionCount} transactions</p>` : ''}
      </div>

      <h3>Transaction File Sources</h3>
      <ul>
        ${Array.from(new Set((AppState.transactions || []).map(tx => tx.fileName))).map(file =>
    `<li>${file || 'Unknown file'}</li>`
  ).join('')}
      </ul>
    </div>
  `;

  showModal({
    title: "Transaction Inspection",
    content: modalContent,
    size: "large"
  });
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

  // Use less verbose logging in production - FIXED: removed process.env reference
  if (isProduction()) {
    console.log("Debug functions attached to window");
  } else {
    console.log("Debug functions attached to window", {
      inspectTransactionData: Boolean(window.inspectTransactionData),
      debugMergedFiles: Boolean(window.debugMergedFiles),
      debugSignatures: Boolean(window.debugSignatures)
    });
  }

  window.debugFunctionsAttached = true;

  // Add event listeners to debug buttons if DOM is ready, otherwise wait
  if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', attachDebugButtonListeners);
  } else {
    attachDebugButtonListeners();
  }
}

function attachDebugButtonListeners() {
  // Only attach once
  if (window.debugButtonsAttached) return;

  // Debug files button
  const debugFilesBtn = document.getElementById('debugFilesBtn');
  if (debugFilesBtn) {
    debugFilesBtn.addEventListener('click', debugMergedFiles);
  }

  // Debug signatures button
  const debugSignaturesBtn = document.getElementById('debugSignaturesBtn');
  if (debugSignaturesBtn) {
    debugSignaturesBtn.addEventListener('click', debugSignatures);
  }

  // Debug transactions button
  const debugTransactionBtn = document.getElementById('debugTransactionBtn');
  if (debugTransactionBtn) {
    debugTransactionBtn.addEventListener('click', inspectTransactionData);
  }

  // Reset application button
  const resetAppBtn = document.getElementById('resetAppBtn');
  if (resetAppBtn) {
    resetAppBtn.addEventListener('click', resetApplication);
  }

  window.debugButtonsAttached = true;

  // Use less verbose logging
  if (!isProduction()) {
    console.log("Debug button listeners attached");
  }
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
