import { AppState } from '../core/appState.js';
import { showToast } from './uiManager.js';

/**
 * FIXED: Add singleton pattern to prevent duplicate modals
 */
let fileListModalInstance = null;

/**
 * Show merged files modal
 */
export function showMergedFilesModal() {
  // FIXED: Prevent multiple modals
  if (fileListModalInstance) {
    console.log('File list modal already open');
    return fileListModalInstance;
  }

  console.log("Opening merged files modal...");

  const modalContent = document.createElement('div');
  modalContent.className = 'merged-files-content';

  // Build the content
  modalContent.innerHTML = buildMergedFilesContent();

  // Create the modal using the modal manager
  import('./modalManager.js').then(module => {
    const modal = module.showModal({
      title: '📁 Merged Files',
      content: modalContent,
      size: 'large',
      closeOnClickOutside: true
    });

    // Store reference and override close method
    fileListModalInstance = modal;
    const originalClose = modal.close;
    modal.close = function () {
      fileListModalInstance = null;
      originalClose.call(this);
    };

    // Attach event listeners
    attachMergedFilesEventListeners(modalContent, modal);
  });

  console.log("Merged files modal opened successfully");
}

/**
 * Build the merged files content HTML
 */
function buildMergedFilesContent() {
  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    return `
      <div class="empty-state">
        <p>No merged files found.</p>
        <p class="info-text">Upload some transaction files to see them here.</p>
      </div>
    `;
  }

  let html = `
    <div class="merged-files-list">
      <h3>Merged Files (${mergedFiles.length})</h3>
      <div class="merged-files-table-container">
        <table class="merged-files-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">File Name</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Transactions</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Currency</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Signature</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Import Date</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Actions</th>
            </tr>
          </thead>
          <tbody>
  `;

  mergedFiles.forEach((file, index) => {
    let transactionCount = 0;
    if (file.transactions) {
      transactionCount = file.transactions.length;
    } else if (file.data) {
      transactionCount = file.data.length - (file.dataRowIndex || 1);
    }
    const currency = file.currency || 'USD';
    const signature = file.signature || 'No signature';
    const importDate = file.mergedAt ? new Date(file.mergedAt).toLocaleDateString() : 'Unknown';
    const fileName = file.fileName || 'Unknown File';

    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${fileName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${transactionCount}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${currency}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; word-break: break-all; max-width: 150px;">
          ${signature.substring(0, 15)}${signature.length > 15 ? '...' : ''}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${importDate}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <button class="edit-file-btn" data-index="${index}" title="Edit file mapping" style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">✏️</button>
          <button class="remove-file-btn" data-index="${index}" title="Remove file" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">🗑️</button>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <button class="button secondary-btn" id="closeMergedFilesBtn">Close</button>
    </div>
  `;

  return html;
}

/**
 * Attach event listeners to the merged files content
 */
function attachMergedFilesEventListeners(container, modal) {
  // Close button
  const closeBtn = container.querySelector('#closeMergedFilesBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.close();
    });
  }

  // Remove file buttons
  container.querySelectorAll('.remove-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      handleRemoveFile(index, container, modal);
    });
  });

  // Edit file buttons
  container.querySelectorAll('.edit-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      handleEditFile(index);
    });
  });
}

/**
 * Handle removing a file
 */
function handleRemoveFile(index, container, modal) {
  const file = AppState.mergedFiles[index];
  if (!file) return;

  if (confirm(`Are you sure you want to remove "${file.fileName}"?`)) {
    // FIXED: Remove transactions associated with this file first
    if (AppState.transactions) {
      const originalTransactionCount = AppState.transactions.length;
      AppState.transactions = AppState.transactions.filter(tx => tx.fileName !== file.fileName);
      const removedTransactionCount = originalTransactionCount - AppState.transactions.length;

      if (removedTransactionCount > 0) {
        console.log(`Removed ${removedTransactionCount} transactions associated with file: ${file.fileName}`);
        // Save updated transactions
        localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
      }
    }

    // Remove from merged files
    AppState.mergedFiles.splice(index, 1);

    // Save to localStorage
    try {
      localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
      showToast(`File "${file.fileName}" and its transactions removed successfully`, 'success');

      // Refresh the modal content
      container.innerHTML = buildMergedFilesContent();
      attachMergedFilesEventListeners(container, modal);

      // Update transactions UI
      import('./transactionManager.js').then(module => {
        if (module.renderTransactions) {
          module.renderTransactions(AppState.transactions, true);
        }
        if (module.updateTransactions) {
          module.updateTransactions();
        }
      });

    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error removing file', 'error');
    }
  }
}

/**
 * Handle editing a file
 */
function handleEditFile(index) {
  const file = AppState.mergedFiles[index];
  if (!file) return;

  showToast('File editing feature coming soon', 'info');

}

/**
 * Render merged files (legacy function for compatibility)
 */
export function renderMergedFiles() {
  // This function is kept for compatibility but now just shows the modal
  showMergedFilesModal();
}
