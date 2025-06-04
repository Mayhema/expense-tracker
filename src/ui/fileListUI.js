import { AppState } from '../core/appState.js';
import { showToast } from './uiManager.js';

/**
 * Show merged files modal
 */
export function showMergedFilesModal() {
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
  `;

  mergedFiles.forEach((file, index) => {
    const transactionCount = file.data ? file.data.length - (file.dataRowIndex || 1) : 0;
    const fileSize = file.originalFile ? (file.originalFile.size / 1024).toFixed(1) + ' KB' : 'Unknown size';

    html += `
      <div class="file-item" data-index="${index}">
        <div class="file-info">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <div class="file-name">${file.fileName || 'Unknown File'}</div>
            <div class="file-stats">${transactionCount} transactions • ${fileSize}</div>
          </div>
        </div>
        <div class="file-actions">
          <button class="edit-file-btn" data-index="${index}" title="Edit file mapping">✏️</button>
          <button class="remove-file-btn" data-index="${index}" title="Remove file">🗑️</button>
        </div>
      </div>
    `;
  });

  html += `
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
    // Remove from merged files
    AppState.mergedFiles.splice(index, 1);

    // Save to localStorage
    try {
      localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
      showToast(`File "${file.fileName}" removed successfully`, 'success');

      // Refresh the modal content
      container.innerHTML = buildMergedFilesContent();
      attachMergedFilesEventListeners(container, modal);

      // Update transactions
      import('./transactionManager.js').then(module => {
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
