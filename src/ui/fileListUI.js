import { AppState, saveMergedFiles } from "../core/appState.js";
import { updateTransactions } from "./transactionManager.js";
import { showToast } from "./uiManager.js";
import { getFileIcon } from "../utils/fileUtils.js";

/**
 * Renders the merged files list in the UI
 */
export function renderMergedFiles() {
  const list = document.getElementById("mergedFilesList");
  if (!list) return;

  list.innerHTML = "";

  // Get collapsed state from localStorage
  const isSectionCollapsed = localStorage.getItem("mergedFilesSectionCollapsed") === "true";
  const listContainer = document.getElementById("mergedFilesListContainer");

  // Update toggle button appearance
  const toggleButton = document.getElementById("toggleMergedBtn");
  if (toggleButton) {
    toggleButton.textContent = isSectionCollapsed ? "🔽" : "🔼";
    toggleButton.title = isSectionCollapsed ? "Expand merged files" : "Collapse merged files";
  }

  // Show/hide list based on state
  if (listContainer) {
    listContainer.style.display = isSectionCollapsed ? "none" : "block";
  }

  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    list.innerHTML = '<div class="empty-list-message" style="text-align: center; padding: 15px; color: #888;">No files merged yet</div>';
    return;
  }

  // Create a more professional, table-like structure for merged files
  let html = `
  <div class="merged-files-container" style="max-height: 300px; overflow-y: auto; border-radius: 6px; border: 1px solid #eee;">
    <table class="merged-files-table" style="width: 100%; border-collapse: collapse; background-color: #fff;">
      <thead>
        <tr style="position: sticky; top: 0; background-color: #f7f7f7; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          <th style="text-align: left; padding: 12px; border-bottom: 1px solid #ddd;">File Name</th>
          <th style="text-align: center; padding: 12px; border-bottom: 1px solid #ddd;">Rows</th>
          <th style="text-align: center; padding: 12px; border-bottom: 1px solid #ddd;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  AppState.mergedFiles.forEach((file, i) => {
    const rowCount = file.data ? file.data.length : 0;
    const fileIcon = getFileIcon(file.fileName);

    // Apply alternating row colors
    const rowStyle = i % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #fff;';

    html += `
    <tr style="${rowStyle} transition: background-color 0.2s;">
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 18px; margin-right: 10px;">${fileIcon}</span>
          <span style="font-weight: 500;">${file.fileName}</span>
        </div>
      </td>
      <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">
        <span class="badge" style="background-color: #e9f3ff; color: #0066cc; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${rowCount}</span>
      </td>
      <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">
        <button class="icon-button" onclick="window.removeMergedFile(${i})" title="Remove file"
          style="background-color: #ffebeb; color: #cc0000; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer;">
            🗑️
        </button>
      </td>
    </tr>
  `;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;

  list.innerHTML = html;

  // Make sure the removeMergedFile function is defined globally
  if (!window.removeMergedFile) {
    window.removeMergedFile = removeMergedFile;
  }
}

/**
 * Toggles the visibility of the merged files section
 */
export function toggleMergedFilesVisibility() {
  const listContainer = document.getElementById("mergedFilesListContainer");
  const toggleButton = document.getElementById("toggleMergedBtn");

  // Get current state (default to not collapsed)
  const isSectionCollapsed = localStorage.getItem("mergedFilesSectionCollapsed") === "true";

  // Toggle state
  const newState = !isSectionCollapsed;
  localStorage.setItem("mergedFilesSectionCollapsed", newState);

  // Update UI
  if (listContainer) {
    listContainer.style.display = newState ? "none" : "block";
  }

  if (toggleButton) {
    toggleButton.textContent = newState ? "🔽" : "🔼";
    toggleButton.title = newState ? "Expand merged files" : "Collapse merged files";
    console.log(`Merged files section is now ${newState ? 'collapsed' : 'expanded'}`);
  }
}

/**
 * Removes a merged file from the list
 * @param {number} index - Index of the file to remove
 */
function removeMergedFile(index) {
  if (index < 0 || index >= AppState.mergedFiles.length) {
    console.error("Invalid file index:", index);
    return;
  }

  const filename = AppState.mergedFiles[index]?.fileName || "this file";

  if (confirm(`Remove "${filename}"?\n\nWARNING: All transactions from this file will also be removed from the transaction list.`)) {
    AppState.mergedFiles.splice(index, 1);
    saveMergedFiles();
    renderMergedFiles();
    updateTransactions();
    showToast("File and its transactions removed", "success");
  }
}

// Ensure the function is available globally
window.removeMergedFile = removeMergedFile;
