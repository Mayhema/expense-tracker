import { AppState, saveMergedFiles } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { showModal } from "./modalManager.js";
import { updateTransactions } from "./transactionManager.js";

/**
 * Renders the merged files list in a modal
 */
export function showMergedFilesModal() {
  console.log("Opening merged files modal");

  const modalContent = document.createElement("div");
  modalContent.className = "merged-files-modal";

  modalContent.innerHTML = `
    <div class="merged-files-section">
      <h3>Merged Files (${AppState.mergedFiles?.length || 0})</h3>
      <p>Files that have been processed and added to your transaction list.</p>

      <div id="mergedFilesSection" class="merged-files-list">
        <!-- Files will be rendered here -->
      </div>

      <div class="merged-files-actions" style="margin-top: 20px;">
        <button id="refreshMergedFilesBtn" class="button">Refresh List</button>
        <button id="clearAllFilesBtn" class="button danger">Clear All Files</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: "Merged Files Manager",
    content: modalContent,
    size: "large"
  });

  // Render the files
  renderMergedFiles();

  // Add event listeners
  setupMergedFilesEventListeners(modal);
}

/**
 * Renders the merged files list
 */
export function renderMergedFiles() {
  console.log("Rendering merged files list");

  // Try to find the element in the modal first, then fallback to main page
  let mergedFilesSection = document.getElementById("mergedFilesSection");

  if (!mergedFilesSection) {
    console.warn("Merged files section not found in DOM");
    // Create a temporary container for the modal
    const modalContent = document.querySelector(".merged-files-modal");
    if (modalContent) {
      mergedFilesSection = modalContent.querySelector("#mergedFilesSection");
    }
  }

  if (!mergedFilesSection) {
    console.error("Could not find merged files section to render into");
    return;
  }

  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    mergedFilesSection.innerHTML = `
      <div class="no-files-message">
        <p>No merged files yet. Upload transaction files to get started.</p>
      </div>
    `;
    return;
  }

  // Generate file list HTML
  const filesHtml = mergedFiles.map((file, index) => `
    <div class="merged-file-item" data-index="${index}">
      <div class="file-info">
        <div class="file-name">
          <span class="file-icon">${getFileIcon(file.fileName)}</span>
          <strong>${file.fileName}</strong>
        </div>
        <div class="file-details">
          <span class="file-rows">${file.data?.length || 0} rows</span>
          <span class="file-currency">${file.currency || 'USD'}</span>
          <span class="file-date">Added: ${formatDate(file.dateAdded)}</span>
        </div>
        <div class="file-mapping">
          <small>Mapping: ${(file.headerMapping || []).filter(h => h !== '–').join(', ')}</small>
        </div>
      </div>
      <div class="file-actions">
        <label class="file-toggle">
          <input type="checkbox" ${file.selected !== false ? 'checked' : ''}
                 onchange="toggleFileSelection(${index}, this.checked)">
          <span>Include in transactions</span>
        </label>
        <button class="remove-file-btn" onclick="removeFile(${index})" title="Remove file">🗑️</button>
      </div>
    </div>
  `).join('');

  mergedFilesSection.innerHTML = `
    <div class="merged-files-container">
      ${filesHtml}
    </div>
  `;

  // Add global functions for the onclick handlers
  window.toggleFileSelection = toggleFileSelection;
  window.removeFile = removeFile;
}

/**
 * Setup event listeners for merged files modal
 */
function setupMergedFilesEventListeners(modal) {
  const refreshBtn = document.getElementById("refreshMergedFilesBtn");
  const clearAllBtn = document.getElementById("clearAllFilesBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      renderMergedFiles();
      updateTransactions();
      showToast("Merged files refreshed", "info");
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to remove all merged files? This cannot be undone.")) {
        AppState.mergedFiles = [];
        saveMergedFiles();
        renderMergedFiles();
        updateTransactions();
        showToast("All merged files cleared", "success");
      }
    });
  }
}

/**
 * Toggle file selection
 */
function toggleFileSelection(index, selected) {
  if (AppState.mergedFiles && AppState.mergedFiles[index]) {
    AppState.mergedFiles[index].selected = selected;
    saveMergedFiles();
    updateTransactions();
    showToast(`File ${selected ? 'included' : 'excluded'} from transactions`, "info");
  }
}

/**
 * Remove a file from merged files
 */
function removeFile(index) {
  if (!AppState.mergedFiles || !AppState.mergedFiles[index]) return;

  const fileName = AppState.mergedFiles[index].fileName;

  if (confirm(`Remove "${fileName}" from merged files? This cannot be undone.`)) {
    AppState.mergedFiles.splice(index, 1);
    saveMergedFiles();
    renderMergedFiles();
    updateTransactions();
    showToast(`File "${fileName}" removed`, "success");
  }
}

/**
 * Get file icon based on extension
 */
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return '📊';
    case 'xml':
      return '📋';
    case 'csv':
      return '📝';
    default:
      return '📄';
  }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    console.warn('Failed to format date:', dateString, e);
    return 'Invalid date';
  }
}
