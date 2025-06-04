import { AppState } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';
import { exportTransactionsAsCSV, exportTransactionsAsJSON } from '../exports/exportManager.js';

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

    if (format === 'csv') {
      exportTransactionsAsCSV();
    } else if (format === 'json') {
      exportTransactionsAsJSON();
    }

    modal.close();
  });
}
