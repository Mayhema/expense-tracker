import { deleteFormatMapping, renderMappingList } from "../mappings/mappingsManager.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";

/**
 * Shows a modal with format mappings management
 */
export function showFormatMappingsModal() {
  const modalContent = document.createElement('div');

  // Get format mappings from localStorage
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

  if (mappings.length === 0) {
    modalContent.innerHTML = `
      <div class="empty-mappings">
        <p>No format mappings saved yet.</p>
        <p>When you upload files and map their columns, the formats will be saved here for future use.</p>
      </div>
    `;
  } else {
    modalContent.innerHTML = `
      <div class="mappings-container">
        <p>The following file formats are recognized automatically:</p>
        <div style="max-height: 400px; overflow-y: auto;">
          <table class="mappings-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px;">Format</th>
                <th style="text-align: left; padding: 10px;">Fields</th>
                <th style="text-align: center; padding: 10px;">Files</th>
                <th style="text-align: center; padding: 10px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${Array.isArray(mappings) ? mappings.map((mapping, index) => {
      // Get the field mappings, filtering out placeholders
      const fields = mapping.mapping && Array.isArray(mapping.mapping)
        ? mapping.mapping.filter(m => m !== "–").join(", ")
        : "Unknown";

      // Get file count or list of files
      const fileCount = (mapping.files?.length || 0);
      const fileTypes = mapping.fileTypes && Array.isArray(mapping.fileTypes)
        ? mapping.fileTypes.join(", ")
        : "Unknown";

      return `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      ${mapping.formatName || "Format " + (index + 1)}
                      <div style="font-size: 0.8em; color: #666;">${fileTypes} format</div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${fields}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">
                      ${fileCount} file${fileCount !== 1 ? 's' : ''}
                    </td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">
                      <button class="delete-mapping-btn"
                        data-index="${index}"
                        style="background-color: #ffebeb; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer;">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `;
    }).join('') : '<tr><td colspan="4">Error: Invalid mapping data format</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  const modal = showModal({
    title: "Format Mappings",
    content: modalContent,
    size: "large"
  });

  // Add event listeners to delete buttons
  const deleteButtons = modalContent.querySelectorAll('.delete-mapping-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.dataset.index, 10);
      if (confirm("Delete this format mapping? This will affect future file imports.")) {
        // Call deleteFormatMapping with the index
        const success = deleteFormatMapping(index);
        if (success) {
          showToast("Format mapping deleted", "success");
          // Close and reopen modal to refresh content
          modal.close();
          setTimeout(() => showFormatMappingsModal(), 300);

          // Also update mapping list in the main UI if present
          renderMappingList();
        } else {
          showToast("Error deleting format mapping", "error");
        }
      }
    });
  });

  return modal;
}
