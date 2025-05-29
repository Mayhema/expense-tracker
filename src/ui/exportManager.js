import { AppState } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';

/**
 * Show export modal with options
 */
export function showExportModal() {
  const transactions = AppState.transactions || [];

  if (transactions.length === 0) {
    showToast('No transactions to export', 'warning');
    return;
  }

  const modalContent = document.createElement('div');
  modalContent.className = 'export-modal';

  modalContent.innerHTML = `
    <div class="export-options">
      <h3>📤 Export Your Data</h3>
      <p>Choose how you'd like to export your transaction data:</p>

      <div class="export-format-section">
        <h4>Export Format:</h4>
        <div class="format-options">
          <label class="radio-option">
            <input type="radio" name="exportFormat" value="csv" checked>
            <span>📊 CSV (Excel compatible)</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="exportFormat" value="json">
            <span>📄 JSON (Raw data)</span>
          </label>
        </div>
      </div>

      <div class="export-stats">
        <div class="stat-card">
          <span class="stat-number">${transactions.length}</span>
          <span class="stat-label">Transactions</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${new Set(transactions.map(t => t.fileName)).size}</span>
          <span class="stat-label">Source Files</span>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="cancel-btn" id="cancelExport">Cancel</button>
      <button class="primary-btn" id="performExport">💾 Export Data</button>
    </div>
  `;

  const modal = showModal({
    title: 'Export Transactions',
    content: modalContent,
    size: 'medium',
    closeOnClickOutside: false
  });

  // Event listeners
  document.getElementById('cancelExport').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('performExport').addEventListener('click', () => {
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    exportTransactions(format);
    modal.close();
  });
}

/**
 * Export transactions in specified format
 */
function exportTransactions(format) {
  const transactions = AppState.transactions || [];

  try {
    let content, filename, mimeType;

    if (format === 'csv') {
      content = convertToCSV(transactions);
      filename = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(transactions, null, 2);
      filename = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    downloadFile(content, filename, mimeType);
    showToast(`Successfully exported ${transactions.length} transactions`, 'success');

  } catch (error) {
    console.error('Export error:', error);
    showToast('Error exporting data', 'error');
  }
}

/**
 * Convert transactions to CSV format
 */
function convertToCSV(transactions) {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Source File'];
  const rows = transactions.map(t => [
    t.date || '',
    (t.description || '').replace(/"/g, '""'),
    t.expenses || t.income || '0',
    t.expenses ? 'Expense' : 'Income',
    t.category || 'Uncategorized',
    t.fileName || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download file to user's computer
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
