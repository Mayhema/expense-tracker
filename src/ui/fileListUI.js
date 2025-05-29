import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";


// All styles are now in styles/ folder, loaded via HTML

/**
 * Creates the merged files section if it doesn't exist
 */
function createMergedFilesSection() {
  // Check if section already exists
  let section = document.getElementById('mergedFilesSection');
  if (section) {
    return section;
  }

  // Find a good place to insert the section
  const mainContent = document.querySelector('.main-content') || document.body;

  // Create the section
  section = document.createElement('div');
  section.id = 'mergedFilesSection';
  section.className = 'section merged-files-section';

  section.innerHTML = `
    <div class="section-header">
      <h2>📁 Imported Files</h2>
      <div class="section-actions">
        <button id="clearAllFilesBtn" class="button secondary-btn" style="display: none;">
          🗑️ Clear All
        </button>
      </div>
    </div>
    <div class="section-content">
      <div id="mergedFilesList" class="merged-files-list">
        <!-- Files will be rendered here -->
      </div>
    </div>
  `;

  // Insert after transaction table or at the end
  const transactionSection = document.getElementById('transactionTableContainer');
  if (transactionSection && transactionSection.parentNode) {
    transactionSection.parentNode.insertBefore(section, transactionSection.nextSibling);
  } else {
    mainContent.appendChild(section);
  }

  // Add event listener for clear all button
  const clearAllBtn = document.getElementById('clearAllFilesBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', handleClearAllFiles);
  }

  console.log('Created merged files section in DOM');
  return section;
}

/**
 * Renders the list of merged files
 */
export function renderMergedFiles() {
  console.log('Rendering merged files list');

  // Ensure the section exists
  createMergedFilesSection();
  const container = document.getElementById('mergedFilesList');

  if (!container) {
    console.error('Could not find or create merged files list container');
    return;
  }

  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📄 No files imported yet</p>
        <p class="info-text">Upload CSV, Excel, or XML files to get started</p>
      </div>
    `;

    // Hide clear all button
    const clearAllBtn = document.getElementById('clearAllFilesBtn');
    if (clearAllBtn) {
      clearAllBtn.style.display = 'none';
    }

    return;
  }

  // Show clear all button
  const clearAllBtn = document.getElementById('clearAllFilesBtn');
  if (clearAllBtn) {
    clearAllBtn.style.display = 'inline-block';
  }

  // Generate files HTML
  const filesHtml = mergedFiles.map((file, index) => {
    const transactionCount = file.transactions?.length || 0;
    const currency = file.currency || 'USD';
    const fileIcon = getFileIcon(file.fileName);

    return `
      <div class="file-item" data-file-index="${index}">
        <div class="file-info">
          <span class="file-icon">${fileIcon}</span>
          <div class="file-details">
            <span class="file-name">${file.fileName}</span>
            <span class="file-stats">${transactionCount} transactions • ${currency}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="edit-file-btn" data-file-index="${index}" title="Edit currency">
            💰
          </button>
          <button class="remove-file-btn" data-file-index="${index}" title="Remove file">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = filesHtml;

  // Add event listeners
  attachFileEventListeners();

  console.log(`Rendered ${mergedFiles.length} merged files`);
}

/**
 * Get appropriate icon for file type
 */
function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'csv': return '📊';
    case 'xlsx':
    case 'xls': return '📗';
    case 'xml': return '📄';
    default: return '📁';
  }
}

/**
 * Attach event listeners to file items
 */
function attachFileEventListeners() {
  // Remove file buttons
  document.querySelectorAll('.remove-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fileIndex = parseInt(e.target.dataset.fileIndex);
      handleRemoveFile(fileIndex);
    });
  });

  // Edit file buttons
  document.querySelectorAll('.edit-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fileIndex = parseInt(e.target.dataset.fileIndex);
      handleEditFile(fileIndex);
    });
  });
}

/**
 * Handle removing a file
 */
function handleRemoveFile(fileIndex) {
  const mergedFiles = AppState.mergedFiles || [];

  if (fileIndex >= 0 && fileIndex < mergedFiles.length) {
    const fileName = mergedFiles[fileIndex].fileName;

    if (confirm(`Remove "${fileName}" and its ${mergedFiles[fileIndex].transactions?.length || 0} transactions?`)) {
      // Remove file from state
      mergedFiles.splice(fileIndex, 1);

      // Save updated state
      import('../core/appState.js').then(module => {
        if (module.saveMergedFiles) {
          module.saveMergedFiles();
        }

        // Update UI
        renderMergedFiles();

        // Update transactions
        import('./transactionManager.js').then(txModule => {
          if (txModule.updateTransactions) {
            txModule.updateTransactions();
          }
        });

        showToast(`File "${fileName}" removed`, 'success');
      });
    }
  }
}

/**
 * Handle editing a file (currency change)
 */
function handleEditFile(fileIndex) {
  const mergedFiles = AppState.mergedFiles || [];

  if (fileIndex >= 0 && fileIndex < mergedFiles.length) {
    const file = mergedFiles[fileIndex];

    // Simple prompt for currency change
    const newCurrency = prompt(`Change currency for "${file.fileName}"?\nCurrent: ${file.currency || 'USD'}`, file.currency || 'USD');

    if (newCurrency && newCurrency !== file.currency) {
      file.currency = newCurrency.toUpperCase();

      // Save updated state
      import('../core/appState.js').then(module => {
        if (module.saveMergedFiles) {
          module.saveMergedFiles();
        }

        // Update UI
        renderMergedFiles();

        // Update transactions
        import('./transactionManager.js').then(txModule => {
          if (txModule.updateTransactions) {
            txModule.updateTransactions();
          }
        });

        showToast(`Currency updated to ${newCurrency}`, 'success');
      });
    }
  }
}

/**
 * Handle clearing all files
 */
function handleClearAllFiles() {
  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    showToast('No files to clear', 'info');
    return;
  }

  const totalTransactions = mergedFiles.reduce((sum, file) => sum + (file.transactions?.length || 0), 0);

  if (confirm(`Clear all ${mergedFiles.length} imported files and ${totalTransactions} transactions?`)) {
    // Clear all files
    AppState.mergedFiles = [];

    // Save updated state
    import('../core/appState.js').then(module => {
      if (module.saveMergedFiles) {
        module.saveMergedFiles();
      }

      // Update UI
      renderMergedFiles();

      // Update transactions
      import('./transactionManager.js').then(txModule => {
        if (txModule.updateTransactions) {
          txModule.updateTransactions();
        }
      });

      showToast('All files cleared', 'success');
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Don't create the section automatically in the main page
  // Only create it when explicitly requested via sidebar
  console.log('File list UI ready - merged files section will be created on demand');

  // Remove any existing merged files section from main content
  const existingSection = document.getElementById('mergedFilesSection');
  if (existingSection && existingSection.closest('.main-content')) {
    existingSection.remove();
    console.log('Removed merged files section from main content');
  }
});

/**
 * Show merged files modal (called from sidebar)
 */
export function showMergedFilesModal() {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div id="mergedFilesList" class="merged-files-list">
      ${renderMergedFilesContent()}
    </div>
  `;

  import('./modalManager.js').then(module => {
    if (module.showModal) {
      module.showModal({
        title: '📁 Imported Files',
        content: modalContent,
        size: 'large'
      });
    }
  });
}

/**
 * Render merged files content for modal
 */
function renderMergedFilesContent() {
  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    return `
      <div class="empty-state">
        <p>📄 No files imported yet</p>
        <p class="info-text">Upload CSV, Excel, or XML files to get started</p>
      </div>
    `;
  }

  // Generate files HTML
  return mergedFiles.map((file, index) => {
    const transactionCount = file.transactions?.length || 0;
    const currency = file.currency || 'USD';
    const fileIcon = getFileIcon(file.fileName);

    return `
      <div class="file-item" data-file-index="${index}">
        <div class="file-info">
          <span class="file-icon">${fileIcon}</span>
          <div class="file-details">
            <span class="file-name">${file.fileName}</span>
            <span class="file-stats">${transactionCount} transactions • ${currency}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="edit-file-btn" data-file-index="${index}" title="Edit currency">
            💰
          </button>
          <button class="remove-file-btn" data-file-index="${index}" title="Remove file">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}
