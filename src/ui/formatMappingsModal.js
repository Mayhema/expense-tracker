import { showModal } from './modalManager.js';
import { getMappings, deleteFormatMapping } from '../mappings/mappingsManager.js';
import { showToast } from './uiManager.js';

/**
 * Show format mappings modal
 */
export function showFormatMappingsModal() {
  const modalContent = document.createElement('div');
  modalContent.className = 'format-mappings-modal';

  modalContent.innerHTML = `
    <div class="mappings-info">
      <h3>📋 Saved Format Mappings</h3>
      <p>These mappings are automatically applied when you upload files with similar formats.</p>
    </div>

    <div class="mappings-list" id="formatMappingsList">
      <!-- Mappings will be rendered here -->
    </div>

    <div class="mappings-actions">
      <button id="refreshMappingsBtn" class="button secondary">🔄 Refresh</button>
      <button id="clearAllMappingsBtn" class="button danger">🗑️ Clear All</button>
    </div>
  `;

  showModal({
    title: 'Format Mappings',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: true
  });

  // Initial render
  renderMappingsList();

  // Event listeners
  document.getElementById('refreshMappingsBtn').addEventListener('click', () => {
    renderMappingsList();
    showToast('Mappings refreshed', 'info');
  });

  document.getElementById('clearAllMappingsBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL format mappings?')) {
      localStorage.removeItem('fileFormatMappings');
      renderMappingsList();
      showToast('All format mappings cleared', 'success');
    }
  });
}

/**
 * Render the mappings list
 */
function renderMappingsList() {
  const container = document.getElementById('formatMappingsList');
  if (!container) return;

  // CRITICAL FIX: Use the mappingsManager to get mappings
  const mappings = getMappings();

  if (mappings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No saved format mappings found.</p>
        <p>Upload and map some files to see them here.</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="mappings-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">File Name</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Signature</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Column Mapping</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Currency</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Created</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  mappings.forEach((mapping, index) => {
    const signature = mapping.signature || 'Unknown';
    const fileName = mapping.fileName || 'Unknown';

    const fields = Array.isArray(mapping.mapping)
      ? mapping.mapping.filter(m => m !== "–").join(", ")
      : "Unknown mapping";

    const currency = mapping.currency || "USD";
    const created = mapping.created
      ? new Date(mapping.created).toLocaleDateString()
      : "Unknown";

    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${fileName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; word-break: break-all; max-width: 150px;">
          ${signature.substring(0, 15)}${signature.length > 15 ? '...' : ''}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${fields}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${currency}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${created}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <button onclick="deleteMappingAtIndex(${index})" class="button danger small" title="Delete this mapping">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * Delete mapping by index
 */
window.deleteMappingAtIndex = function (index) {
  if (deleteFormatMapping(index)) {
    renderMappingsList();
    showToast('Format mapping deleted', 'success');
  } else {
    showToast('Error deleting format mapping', 'error');
  }
};
