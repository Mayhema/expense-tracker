import { AppState, saveMergedFiles } from "../core/appState.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";
import { getFileIcon } from "../utils/fileUtils.js";
import { updateTransactions } from "./transactionManager.js";
import { exportMergedFilesAsCSV } from "../exports/exportManager.js";

/**
 * Shows the merged files modal with all merged files
 */
export function showMergedFilesModal() {
  const mergedFiles = AppState.mergedFiles || [];

  const content = document.createElement('div');
  content.className = 'merged-files-container';

  if (mergedFiles.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <p>No merged files yet.</p>
        <p class="info-text">Upload transaction files to see them listed here.</p>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="mappings-header">
        <h3>Merged Files</h3>
        <button id="exportMergedFilesBtn" class="action-btn">Export to CSV</button>
      </div>
      <div class="merged-files-list">
        <table class="merged-files-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Rows</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${mergedFiles.map((file, index) => {
      const rowCount = file.data ? file.data.length : 0;
      const fileIcon = getFileIcon(file.fileName);

      // Use file added date if available, or current date if not
      const addedDate = file.dateAdded ? new Date(file.dateAdded).toLocaleDateString() : 'Unknown';

      return `
                <tr>
                  <td>
                    <div class="file-info">
                      <span class="file-icon">${fileIcon}</span>
                      <span class="file-name" title="${file.fileName}">${file.fileName}</span>
                    </div>
                  </td>
                  <td>${rowCount}</td>
                  <td>${addedDate}</td>
                  <td>
                    <button class="remove-file-btn" data-index="${index}" title="Remove this file">🗑️</button>
                  </td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const modal = showModal({
    title: "Merged Files",
    content: content,
    size: "large"
  });

  // Add event handlers
  const exportBtn = content.querySelector('#exportMergedFilesBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportMergedFilesAsCSV();
    });
  }

  // Add event handlers to individual delete buttons
  const removeButtons = content.querySelectorAll('.remove-file-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index);
      if (confirm(`Remove "${AppState.mergedFiles[index].fileName}"?\n\nWARNING: All transactions from this file will also be removed from the transaction list.`)) {
        AppState.mergedFiles.splice(index, 1);
        saveMergedFiles();
        updateTransactions();
        showToast("File and its transactions removed", "success");
        modal.close();
        showMergedFilesModal(); // Re-open with updated data
      }
    });
  });

  return modal;
}
