import { AppState, saveMergedFiles } from "../core/appState.js";
import { showModal } from "../ui/modalManager.js";
import { showToast } from "../ui/uiManager.js";
import { updateTransactions } from "../ui/transactionManager.js";
import { renderMergedFiles } from "../main.js";

const STORAGE_KEY = "fileFormatMappings";

/**
 * Tracks file signatures for each format mapping
 * Format: {formatId: {signatures: [], files: []}}
 */
const formatToFilesMap = {};

/**
 * Associates a file with a specific format mapping
 * @param {string} formatSig - The format signature
 * @param {string} fileName - The file name
 * @param {string} fileSig - The file's unique signature
 */
export function associateFileWithFormat(formatSig, fileName, fileSig) {
  if (!formatToFilesMap[formatSig]) {
    formatToFilesMap[formatSig] = {
      signatures: [],
      files: []
    };
  }

  // Add file signature to the format if not already present
  if (!formatToFilesMap[formatSig].signatures.includes(fileSig)) {
    formatToFilesMap[formatSig].signatures.push(fileSig);
    formatToFilesMap[formatSig].files.push(fileName);

    // Save the mapping to localStorage
    saveFormatToFileMapping();
    console.log(`Associated file ${fileName} with format ${formatSig}`);
  }
}

/**
 * Saves the format-to-files mapping to localStorage
 */
function saveFormatToFileMapping() {
  localStorage.setItem("formatToFilesMap", JSON.stringify(formatToFilesMap));
}

/**
 * Loads the format-to-files mapping from localStorage
 */
export function loadFormatToFileMapping() {
  const saved = localStorage.getItem("formatToFilesMap");
  if (saved) {
    Object.assign(formatToFilesMap, JSON.parse(saved));
  }
}

/**
 * Gets all files associated with a format signature
 * @param {string} formatSig - The format signature
 * @return {Array} Array of file data {fileName, signature}
 */
export function getFilesForFormat(formatSig) {
  if (!formatToFilesMap[formatSig]) return [];

  return {
    signatures: formatToFilesMap[formatSig].signatures || [],
    files: formatToFilesMap[formatSig].files || []
  };
}

// Update to support dual signatures

// Implementation of saveHeadersAndFormat function with reduced complexity
export function saveHeadersAndFormat(signature, mapping, fileName = null, headerRowIndex = null, dataRowIndex = null, currency = null) {
  try {
    // Get file name from state or parameter
    const currentFileName = fileName || AppState.currentFileName || "";

    if (!currentFileName) {
      console.warn("No filename provided for format mapping");
      return false;
    }

    // Get mapping configuration from parameters or DOM
    const config = getHeadersAndFormatConfig(headerRowIndex, dataRowIndex, currentFileName);

    // Get existing mappings
    const existingMappings = getSafeExistingMappings();

    // Process signature and mapping key
    const { sigString, mappingKey } = processSignatureAndMapping(signature, mapping);

    // Check if mapping exists and update or create as needed
    updateOrCreateMapping(
      existingMappings,
      sigString,
      mappingKey,
      mapping,
      config,
      currentFileName,
      currency
    );

    // Save and render
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingMappings));
    renderMappingList();

    return true;
  } catch (err) {
    console.error("Error saving format mapping:", err);
    return false;
  }
}

// Helper functions to reduce cognitive complexity

function getHeadersAndFormatConfig(headerRowIndex, dataRowIndex, currentFileName) {
  // Get row indices either from parameters or from DOM
  const headerRow = headerRowIndex !== null ? headerRowIndex :
    parseInt(document.getElementById("headerRowInput")?.value || "1", 10) - 1;

  const dataRow = dataRowIndex !== null ? dataRowIndex :
    parseInt(document.getElementById("dataRowInput")?.value || "2", 10) - 1;

  // Extract file extension for type info
  const fileType = currentFileName.split('.').pop().toLowerCase() || "unknown";

  console.log(`Saving format mapping for ${currentFileName} (${fileType}) with headerRow=${headerRow}, dataRow=${dataRow}`);

  return { headerRow, dataRow, fileType };
}

function getSafeExistingMappings() {
  try {
    const existingMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Ensure it's an array
    if (!Array.isArray(existingMappings)) {
      console.warn("Mappings storage was not an array, resetting");
      return [];
    }
    return existingMappings;
  } catch (err) {
    console.error("Error parsing mappings from storage:", err);
    return [];
  }
}

function processSignatureAndMapping(signature, mapping) {
  // Convert signature to string for storage
  const sigString = typeof signature === 'object' ?
    (signature.formatSig || signature.structureSig || JSON.stringify(signature)) :
    String(signature);

  // Generate a unique mapping ID based on the actual mapping fields
  const mappingKey = mapping.filter(m => m !== "–").sort().join(",");

  return { sigString, mappingKey };
}

function updateOrCreateMapping(existingMappings, sigString, mappingKey, mapping, config, fileName, currency) {
  // Find existing mapping
  const existingIndex = findExistingMappingIndex(existingMappings, sigString, mappingKey);

  if (existingIndex !== -1) {
    updateExistingMapping(existingMappings[existingIndex], mapping, sigString, mappingKey, config, fileName);
  } else {
    createNewMapping(existingMappings, sigString, mapping, mappingKey, config, fileName, currency);
  }
}

function findExistingMappingIndex(existingMappings, sigString, mappingKey) {
  return existingMappings.findIndex(m =>
    m.mappingKey === mappingKey ||
    m.signature === sigString ||
    (typeof m.signature === 'object' &&
      (m.signature.formatSig === sigString.formatSig ||
        m.signature.structureSig === sigString.structureSig))
  );
}

function updateExistingMapping(mapping, newMapping, sigString, mappingKey, config, fileName) {
  console.log("Updating existing mapping");

  // Update core mapping details
  mapping.mapping = newMapping;
  mapping.signature = sigString;
  mapping.mappingKey = mappingKey;
  mapping.headerRowIndex = config.headerRow;
  mapping.dataRowIndex = config.dataRow;

  // Update file types
  if (!mapping.fileTypes) {
    mapping.fileTypes = [];
  }
  if (!mapping.fileTypes.includes(config.fileType)) {
    mapping.fileTypes.push(config.fileType);
  }

  // Update files list
  if (!mapping.files) {
    mapping.files = [];
  }
  if (!mapping.files.includes(fileName)) {
    mapping.files.push(fileName);
  }
}

function createNewMapping(existingMappings, sigString, mapping, mappingKey, config, fileName, currency) {
  console.log("Creating new mapping");

  existingMappings.push({
    signature: sigString,
    mapping: mapping,
    mappingKey: mappingKey,
    headerRowIndex: config.headerRow,
    dataRowIndex: config.dataRow,
    fileTypes: [config.fileType],
    files: [fileName],
    currency: currency || "USD",
    created: new Date().toISOString()
  });
}

// Improve the getMappingBySignature function to be more reliable
// Update the getMappingBySignature function

// First, add this function at the top to safely parse format mappings
function getSafeFormatMappings() {
  try {
    const data = localStorage.getItem("fileFormatMappings");

    // Handle case where data isn't stored yet
    if (!data) return [];

    const parsed = JSON.parse(data);

    // Check if it's actually an array
    if (!Array.isArray(parsed)) {
      console.warn("fileFormatMappings is not an array, resetting to empty array");
      localStorage.setItem("fileFormatMappings", "[]");
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing fileFormatMappings:", error);
    // Reset to empty array if corrupted
    localStorage.setItem("fileFormatMappings", "[]");
    return [];
  }
}

// Now update the getMappingBySignature function
export function getMappingBySignature(signature) {
  try {
    // Use the safe getter instead of direct JSON.parse
    const mappings = getSafeFormatMappings();

    // Handle the case where signature is null or undefined
    if (!signature) return null;

    // Handle both object and string signatures
    const sigString = typeof signature === 'object'
      ? (signature.mappingSig || signature.formatSig || signature.contentSig || JSON.stringify(signature))
      : String(signature);

    // Search for matching mapping
    const mapping = mappings.find(m => {
      // Handle different signature formats
      const mSig = typeof m.signature === 'object'
        ? (m.signature.mappingSig || m.signature.formatSig || m.signature.contentSig || JSON.stringify(m.signature))
        : String(m.signature || "");

      return mSig === sigString;
    });

    return mapping || null;
  } catch (error) {
    console.error("Error getting mapping by signature:", error);
    return null;
  }
}

// Fix the renderMappingList to handle duplicates properly
// Update the renderMappingList function to show file types and files
export function renderMappingList(targetTableBodyId = "mappingsTableBody") { // Added target ID parameter
  const tableBody = document.getElementById(targetTableBodyId); // Use the target ID
  if (!tableBody) {
    console.warn(`Mappings table body ('${targetTableBodyId}') element not found`);
    // Try to find the generic list as a fallback for other potential uses, though showMappingsModal should provide the correct ID.
    const genericList = document.getElementById("mappingsList");
    if (genericList) {
      genericList.innerHTML = '<div class="empty-list-message">Mappings table body not found.</div>';
    }
    return;
  }

  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log("Rendering mappings list for target:", targetTableBodyId, mappings);

    if (!mappings.length) {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-list-message">No saved mappings yet</td></tr>'; // Adjusted for table
      return;
    }

    let html = ""; // Build rows for tbody

    mappings.forEach((mapping, index) => {
      const mappingName = mapping.formatName || `Format ${index + 1}`;
      // Get mapped fields string
      const mappedFieldsDisplay = Array.isArray(mapping.mapping) ? mapping.mapping.filter(m => m && m !== "–").map(f => `<span class="field-tag">${f}</span>`).join(" ") : "Unknown";

      // Get file types string
      const fileTypes = mapping.fileTypes && mapping.fileTypes.length > 0
        ? mapping.fileTypes.join(", ")
        : "N/A";

      // Get files using this format
      const filesText = mapping.files && mapping.files.length > 0
        ? `${mapping.files.length} file(s)` // Show count, full list in tooltip or details view
        : "0 files";

      const createdDate = mapping.created ? new Date(mapping.created).toLocaleDateString() : "N/A";

      // Add row
      html += `
        <tr>
          <td>${mappingName}</td>
          <td class="field-mapping-display">${mappedFieldsDisplay || "Unknown"}</td>
          <td>${fileTypes}</td>
          <td title="${(mapping.files || []).join(', ')}">${filesText}</td>
          <td>${createdDate}</td>
          <td>
            <button onclick="window.deleteMappingByIndexGUI(${index})" title="Delete this mapping" class="icon-button delete-mapping-btn">
              🗑️
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

  } catch (err) {
    console.error("Error rendering mapping list:", err);
    tableBody.innerHTML = '<tr><td colspan="6" class="error">Error loading mappings</td></tr>'; // Adjusted for table
  }
}

// Add this function to ensure format-to-file associations are current

// Fix the deleteMapping function to properly handle associated files

export function deleteMapping(sig) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  if (allMappings[sig]) {
    // Get both signatures to make sure we delete all references
    const { structureSig, mappingSig } = allMappings[sig];

    // Delete files first - if user cancels, we don't delete the mapping
    const deleteCompleted = deleteFormatAndAssociatedFiles(sig, structureSig, mappingSig);

    // Only delete mapping if file deletion was completed (not canceled)
    if (deleteCompleted) {
      // Delete both signature entries
      delete allMappings[structureSig];
      if (mappingSig) {
        delete allMappings[mappingSig];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
      renderMappingList();
    }
  }
}

// Replace your existing deleteFormatAndAssociatedFiles function
export function deleteFormatAndAssociatedFiles(sig, structureSig, mappingSig) {
  console.log(`Deleting format with signatures: primary=${sig}, structure=${structureSig}, mapping=${mappingSig}`);

  // Collect all signatures we might need to check
  const allSignatures = new Set([sig, structureSig, mappingSig].filter(Boolean));

  // Look for files in our associated files map for all these signatures
  let associatedSignatures = [];
  let associatedFileNames = [];

  allSignatures.forEach(formatSig => {
    const fileData = getFilesForFormat(formatSig);
    if (fileData.signatures && fileData.signatures.length > 0) {
      associatedSignatures = [...associatedSignatures, ...fileData.signatures];
      associatedFileNames = [...associatedFileNames, ...fileData.files];

      // Remove this format from our mapping
      delete formatToFilesMap[formatSig];
    }
  });

  // Add any signatures from our signatures list
  associatedSignatures = [...new Set([...associatedSignatures, ...Array.from(allSignatures)])];

  // Find files in AppState.mergedFiles matching any of these signatures
  const filesToDelete = AppState.mergedFiles.filter(file =>
    associatedSignatures.includes(file.signature)
  );

  if (filesToDelete.length === 0) {
    showToast("No files found associated with this format.", "info");
    return true;
  }

  // Get list of file names to show in confirmation
  const fileNames = filesToDelete.map(file => file.fileName).join(", ");
  const confirmDelete = confirm(
    `The following files will be deleted:\n\n${fileNames}\n\nDo you want to proceed?`
  );

  if (!confirmDelete) return false;

  // Remove the files
  const beforeCount = AppState.mergedFiles.length;
  AppState.mergedFiles = AppState.mergedFiles.filter(file =>
    !associatedSignatures.includes(file.signature)
  );

  const afterCount = AppState.mergedFiles.length;
  console.log(`Removed ${beforeCount - afterCount} files`);

  // Save the updated mapping
  saveFormatToFileMapping();
  saveMergedFiles();
  renderMergedFiles();
  updateTransactions();
  showToast(`Removed ${beforeCount - afterCount} files.`, "success");

  return true;
}

export function updateMappingRow(table, sig, entry) {
  const row = document.querySelector(`[data-sig="${sig}"]`);
  if (row) {
    row.querySelector(".mapping-cell").textContent = entry.mapping.join(", ");
  } else {
    // Add a new row if it doesn't exist
    const newRow = document.createElement("tr");
    newRow.setAttribute("data-sig", sig);
    newRow.innerHTML = `
      <td>${sig}</td>
      <td class="mapping-cell">${entry.mapping.join(", ")}</td>
    `;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    // Note: This deleteMapping(sig) is different from the index-based one.
    deleteButton.addEventListener("click", () => deleteMapping(sig));
    const actionsCell = document.createElement("td");
    actionsCell.appendChild(deleteButton);
    newRow.appendChild(actionsCell);

    table.appendChild(newRow);
  }
}

// Add window helper for deleteMapping
// Helper function for simple mapping deletion
function handleSimpleDelete(mappings, index, mappingFields) {
  if (confirm(`Delete format mapping for "${mappingFields}"?`)) {
    mappings.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    renderMappingList();
    showToast("Format mapping deleted", "success");
  }
}

// Helper function for deletion with associated files
function handleDeleteWithFiles(mappings, index, mappingFields, associatedFiles) {
  let confirmMessage = `Delete format mapping for "${mappingFields}"?`;
  confirmMessage += `\n\nThis format is used by ${associatedFiles.length} file(s):\n- ${associatedFiles.join('\n- ')}`;
  confirmMessage += `\n\nDo you want to remove these files from your merged list as well?`;

  if (!confirm(confirmMessage)) {
    return;
  }

  // Remove associated files
  AppState.mergedFiles = AppState.mergedFiles.filter(file =>
    !associatedFiles.includes(file.fileName)
  );
  saveMergedFiles();
  updateTransactions();
  renderMergedFiles();

  // Remove the mapping
  mappings.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  renderMappingList();

  showToast(`Format mapping and ${associatedFiles.length} associated file(s) removed`, "success");
}

// This is the comprehensive index-based deletion function
export function deleteMappingByIndexGUI(index) {
  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log(`Attempting to delete mapping at index ${index}, total mappings:`, mappings.length);

    if (!mappings || index < 0 || index >= mappings.length) {
      showToast("Invalid mapping index", "error");
      return;
    }

    const mappingToDelete = mappings[index];
    console.log("Mapping to delete:", mappingToDelete);

    // Get mapping information for display
    const mappingFields = mappingToDelete.mapping.filter(m => m !== "–").join(", ");
    const associatedFiles = mappingToDelete.files || [];

    let confirmMessage = `Delete format mapping for "${mappingFields}"?`;

    // Determine confirmation message based on whether there are associated files
    if (associatedFiles && associatedFiles.length > 0) {
      confirmMessage += `\n\nThis format is used by ${associatedFiles.length} file(s):\n- ${associatedFiles.join('\n- ')}`;
      confirmMessage += `\n\nDo you want to remove these files from your merged list as well?`;
    }

    // Handle confirmation and deletion
    if (associatedFiles && associatedFiles.length > 0 && confirm(confirmMessage)) {
      // User confirmed deletion with file removal

      // 1. Remove associated files from merged files
      const beforeCount = AppState.mergedFiles.length;
      AppState.mergedFiles = AppState.mergedFiles.filter(file =>
        !associatedFiles.includes(file.fileName)
      );
      const removedCount = beforeCount - AppState.mergedFiles.length;

      // 2. Update app state
      saveMergedFiles();

      // 3. Remove the mapping
      mappings.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));

      // 4. Update UI
      renderMergedFiles();
      renderMappingList();
      updateTransactions();

      showToast(`Format mapping and ${removedCount} file(s) removed`, "success");
    } else if (!associatedFiles || !associatedFiles.length) {
      // No associated files, just confirm mapping deletion
      if (confirm(`Delete format mapping for "${mappingFields}"?`)) {
        mappings.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
        renderMappingList();
        showToast("Format mapping deleted", "success");
      }
    }
  } catch (err) {
    console.error("Error deleting mapping by index:", err);
    showToast("Error deleting mapping by index", "error");
  }
}

// Assign to window for use in HTML generated by renderMappingList
window.deleteMappingByIndexGUI = deleteMappingByIndexGUI;

// Add or update this function
export function deleteAllMappings() {
  const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if (mappings.length === 0) {
    showToast("No format mappings to delete", "info");
    return;
  }

  if (confirm("Are you sure you want to delete ALL format mappings?\n\nNOTE: This will not automatically remove your existing files from the merged list.")) {
    // Option to also remove associated files
    const removeFiles = confirm("Would you also like to remove all files that use these formats from your merged files list?");

    // Get current mappings to find associated files
    const filesToRemove = [];

    if (removeFiles) {
      // Collect all file names that are associated with mappings
      mappings.forEach(mapping => {
        if (mapping.files && Array.isArray(mapping.files)) {
          filesToRemove.push(...mapping.files);
        }
      });

      // Remove the files from merged files
      if (filesToRemove.length > 0) {
        // Get unique filenames
        const uniqueFiles = [...new Set(filesToRemove)];

        AppState.mergedFiles = AppState.mergedFiles.filter(file =>
          !uniqueFiles.includes(file.fileName)
        );
        saveMergedFiles();
        renderMergedFiles();
        updateTransactions();
      }
    }

    // Delete all mappings
    localStorage.removeItem(STORAGE_KEY);
    renderMappingList();

    if (removeFiles && filesToRemove.length > 0) {
      showToast(`Removed ${filesToRemove.length} files and all format mappings`, "success");
    } else {
      showToast("All format mappings deleted", "success");
    }
  }
}

/**
 * Deletes a format mapping by its index - this function will now call the comprehensive GUI version.
 * @param {number} index - The index of the format mapping to delete
 * @returns {boolean} - True if successful, false otherwise
 */
export function deleteFormatMapping(index) {
  // Call the comprehensive, UI-handling delete function
  // Note: deleteMappingByIndexGUI handles its own try/catch and toast messages.
  // The original simple boolean return might not be directly applicable unless deleteMappingByIndexGUI is modified.
  // For now, we assume it handles UI feedback.
  try {
    deleteMappingByIndexGUI(index);
    // Assuming success if no error is thrown from deleteMappingByIndexGUI.
    // This function might need to be refactored if a strict boolean success is required by all callers.
    return true;
  } catch (e) {
    console.error("Error in deleteFormatMapping calling deleteMappingByIndexGUI:", e);
    showToast("Error processing mapping deletion.", "error"); // Generic error as specific one is in GUI func
    return false;
  }
}

window.deleteFormatAndAssociatedFiles = deleteFormatAndAssociatedFiles;

// Add function to check if files need to be removed when mapping is deleted

/**
 * Removes a format mapping and associated files
 * @param {string} signatureToRemove - Signature of mapping to remove
 * @returns {boolean} True if removal successful
 */
export function removeFormatMapping(signatureToRemove) {
  if (!signatureToRemove) return false;

  // Load current mappings
  const mappings = loadSavedMappings();

  // Find index of mapping to remove
  const indexToRemove = mappings.findIndex(
    m => m.signature === signatureToRemove
  );

  if (indexToRemove === -1) {
    console.log("No mapping found with signature:", signatureToRemove);
    return false;
  }

  // Check if any files use this mapping
  const affectedFiles = (AppState.mergedFiles || []).filter(
    file => file.signature === signatureToRemove
  );

  // If files will be affected, confirm with the user
  if (affectedFiles.length > 0) {
    const confirmMessage =
      `Removing this mapping will also remove ${affectedFiles.length} file(s) ` +
      `that use this format:\n\n${affectedFiles.map(f => f.fileName).join('\n')}\n\n` +
      `Do you want to continue?`;

    if (!confirm(confirmMessage)) {
      return false;
    }

    // Remove the affected files
    AppState.mergedFiles = (AppState.mergedFiles || []).filter(
      file => file.signature !== signatureToRemove
    );

    // Save the updated merged files list
    saveMergedFiles();

    // Update transactions after removing files
    setTimeout(() => {
      import("../ui/transactionManager.js").then(module => {
        if (typeof module.updateTransactions === 'function') {
          module.updateTransactions();
        }
      }).catch(err => console.error("Error updating transactions after mapping removal:", err));
    }, 0);
  }

  // Remove the mapping
  mappings.splice(indexToRemove, 1);

  // Save the updated mappings
  localStorage.setItem("fileFormatMappings", JSON.stringify(mappings));

  console.log(`Removed mapping ${signatureToRemove}`);
  const associatedFilesMessage = affectedFiles.length ? " " + affectedFiles.length + " associated file(s) were also removed." : "";
  showToast(`Format mapping removed.${associatedFilesMessage}`, "success");

  return true;
}


/**
 * Save mappings to localStorage
 * @param {Array} mappings - Array of mapping objects to save
 */
export function saveAllMappings(mappings) {
  try {
    localStorage.setItem('fileFormatMappings', JSON.stringify(mappings));
  } catch (error) {
    console.error("Error saving mappings to localStorage:", error);
  }
}

/**
 * Get all saved mappings from localStorage
 * @returns {Array} Array of mapping objects
 */
export function getMappings() {
  try {
    const savedMappings = localStorage.getItem("fileFormatMappings");
    if (savedMappings) {
      const mappings = JSON.parse(savedMappings);
      return Array.isArray(mappings) ? mappings : [];
    }
    return [];
  } catch (error) {
    console.error("Error loading mappings from localStorage:", error);
    return [];
  }
}

/**
 * Render mapping list in modal
 */
function renderMappingListModal(targetId) {
  console.log("Rendering mappings list for target:", targetId);

  const target = document.getElementById(targetId);
  if (!target) {
    console.error(`Target element ${targetId} not found`);
    return;
  }

  try {
    const mappings = getMappings(); // Now this function exists
    console.log("Rendering mappings list for target:", targetId, mappings);

    if (!mappings || mappings.length === 0) {
      target.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #666; padding: 20px;">
            No saved mappings found. Import a file to create your first mapping.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    mappings.forEach((mapping, index) => {
      const signature = typeof mapping.signature === 'string'
        ? mapping.signature
        : JSON.stringify(mapping.signature);

      const fields = Array.isArray(mapping.mapping)
        ? mapping.mapping.filter(m => m !== "–").join(", ")
        : "Unknown mapping";

      const currency = mapping.currency || "USD";
      const created = mapping.created
        ? new Date(mapping.created).toLocaleDateString()
        : "Unknown";

      html += `
        <tr>
          <td style="max-width: 200px; word-break: break-all; font-family: monospace; font-size: 0.9em;">
            ${signature.substring(0, 50)}${signature.length > 50 ? '...' : ''}
          </td>
          <td>${fields}</td>
          <td>${currency}</td>
          <td>${created}</td>
          <td>
            <button class="button danger small" onclick="deleteMappingByIndex(${index})" title="Delete this mapping">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `;
    });

    target.innerHTML = html;
  } catch (error) {
    console.error("Error rendering mapping list:", error);
    target.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: red; padding: 20px;">
          Error loading mappings: ${error.message}
        </td>
      </tr>
    `;
  }
}

/**
 * Delete mapping by index
 */
window.deleteMappingByIndex = function (index) {
  try {
    const mappings = getMappings();
    if (index >= 0 && index < mappings.length) {
      mappings.splice(index, 1);

      // Save updated mappings
      localStorage.setItem("fileFormatMappings", JSON.stringify(mappings));

      // Refresh the display
      renderMappingListModal("mappingsTableBody");

      showToast(`Mapping deleted successfully`, "success");
    } else {
      showToast("Invalid mapping index", "error");
    }
  } catch (error) {
    console.error("Error deleting mapping:", error);
    showToast("Error deleting mapping: " + error.message, "error");
  }
};

/**
 * Clear all mappings
 */
function clearAllMappings() {
  if (confirm("Are you sure you want to delete ALL saved mappings? This cannot be undone.")) {
    try {
      localStorage.removeItem("fileFormatMappings");
      renderMappingListModal("mappingsTableBody");
      showToast("All mappings cleared", "success");
    } catch (error) {
      console.error("Error clearing mappings:", error);
      showToast("Error clearing mappings: " + error.message, "error");
    }
  }
}

/**
 * Show mappings modal with complete UI
 */
export function showMappingsModal() {
  console.log("Opening mappings modal");

  const modalContent = document.createElement("div");
  modalContent.className = "mappings-modal";

  modalContent.innerHTML = `
    <div class="mappings-section">
      <h3>Format Mappings</h3>
      <p>Saved file format mappings for automatic processing.</p>

      <div class="mappings-list">
        <table class="mappings-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">File Format Signature</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Column Mapping</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Currency</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Created</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Actions</th>
            </tr>
          </thead>
          <tbody id="mappingsTableBody">
            <!-- Mappings will be rendered here -->
          </tbody>
        </table>
      </div>

      <div class="mappings-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="refreshMappingsBtn" class="button">🔄 Refresh</button>
        <button id="clearAllMappingsBtn" class="button danger">🗑️ Clear All Mappings</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: "Format Mappings Manager",
    content: modalContent,
    size: "large"
  });

  // Initial render of mappings
  renderMappingListModal("mappingsTableBody");

  // Setup event listeners
  setupMappingsEventListeners(modal);
}

/**
 * Setup event listeners for mappings modal
 */
function setupMappingsEventListeners(modal) {
  // Refresh button
  const refreshBtn = document.getElementById("refreshMappingsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      renderMappingListModal("mappingsTableBody");
      showToast("Mappings refreshed", "info");
    });
  }

  // Clear all button
  const clearAllBtn = document.getElementById("clearAllMappingsBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllMappings);
  }
}

// Mappings manager for file format mappings



/**
 * Get all saved mappings
 * @returns {Array} Array of mapping objects
 */
export function getAllMappings() {
  try {
    return JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");
  } catch (error) {
    console.error("Error getting all mappings:", error);
    return [];
  }
}

/**
 * Delete mapping by signature
 * @param {string} signature - Signature to delete
 * @returns {boolean} Success status
 */
export function deleteMappingBySignature(signature) {
  try {
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");
    const filteredMappings = mappings.filter(m => m.signature !== signature);

    localStorage.setItem("fileFormatMappings", JSON.stringify(filteredMappings));
    console.log(`Deleted mapping for signature: ${signature}`);
    return true;
  } catch (error) {
    console.error("Error deleting mapping:", error);
    return false;
  }
}

/**
 * Show mappings modal (alternative implementation)
 */
export function showMappingsModalAlt() {
  import("../ui/modalManager.js").then(module => {
    if (typeof module.showModal === 'function') {
      const modalContent = createMappingsModalContent();
      module.showModal({
        title: "File Format Mappings",
        content: modalContent,
        size: "large"
      });
    }
  }).catch(err => {
    console.error("Error showing mappings modal:", err);
  });
}

/**
 * Create mappings modal content
 * @returns {HTMLElement} Modal content element
 */
function createMappingsModalContent() {
  const container = document.createElement('div');
  container.className = 'mappings-manager';

  const mappings = getAllMappings();

  container.innerHTML = `
    <div class="mappings-info">
      <p>Saved file format mappings (${mappings.length} total):</p>
      <p class="help-text">These mappings are automatically applied when you upload files with similar formats.</p>
    </div>

    <div class="mappings-list">
      ${mappings.length === 0 ?
      '<p class="no-mappings">No saved mappings found. Upload and map some files to see them here.</p>' :
      mappings.map(mapping => createMappingItem(mapping)).join('')
    }
    </div>

    <div class="mappings-actions">
      <button id="clearAllMappingsBtn" class="button secondary-btn" ${mappings.length === 0 ? 'disabled' : ''}>
        Clear All Mappings
      </button>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    attachMappingEventListeners(container);
  }, 100);

  return container;
}

/**
 * Create individual mapping item HTML
 * @param {Object} mapping - Mapping object
 * @returns {string} HTML string
 */
function createMappingItem(mapping) {
  const fields = mapping.mapping ? mapping.mapping.filter(m => m !== "–").join(", ") : "No mapping";
  const created = new Date(mapping.created).toLocaleDateString();
  const lastUsed = mapping.lastUsed ? new Date(mapping.lastUsed).toLocaleDateString() : 'Never';

  return `
    <div class="mapping-item" data-signature="${mapping.signature}">
      <div class="mapping-header">
        <strong>Mapping: ${mapping.description || 'Unnamed'}</strong>
        <button class="delete-mapping-btn button-small danger" data-signature="${mapping.signature}">
          Delete
        </button>
      </div>
      <div class="mapping-details">
        <p><strong>Fields:</strong> ${fields}</p>
        <p><strong>Currency:</strong> ${mapping.currency || 'USD'}</p>
        <p><strong>Header Row:</strong> ${(mapping.headerRowIndex || 0) + 1}, <strong>Data Row:</strong> ${(mapping.dataRowIndex || 1) + 1}</p>
        <p><strong>Created:</strong> ${created}, <strong>Last Used:</strong> ${lastUsed}</p>
        <p class="signature"><strong>Signature:</strong> <code>${mapping.signature}</code></p>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners to mapping elements
 * @param {HTMLElement} container - Container element
 */
function attachMappingEventListeners(container) {
  // Delete mapping buttons
  container.querySelectorAll('.delete-mapping-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const signature = e.target.getAttribute('data-signature');
      if (confirm('Delete this mapping? This action cannot be undone.')) {
        deleteMappingBySignature(signature);
        // Refresh the modal
        showMappingsModal();
      }
    });
  });

  // Clear all mappings button
  const clearAllBtn = container.querySelector('#clearAllMappingsBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Delete ALL mappings? This action cannot be undone.')) {
        localStorage.removeItem("fileFormatMappings");
        showMappingsModal(); // Refresh the modal
      }
    });
  }
}
