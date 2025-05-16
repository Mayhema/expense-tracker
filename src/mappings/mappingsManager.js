import { AppState, saveMergedFiles } from "../core/appState.js";
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

// Replace saveHeadersAndFormat function to prevent duplicates

// Helper function to get existing mappings from storage
function getExistingMappings() {
  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(mappings)) {
      console.warn("Mappings storage was not an array, resetting");
      return [];
    }
    return mappings;
  } catch (err) {
    console.error("Error parsing mappings from storage:", err);
    return [];
  }
}

// Helper function to prepare mapping data
function prepareSignatureAndKey(signature, mapping) {
  // Convert signature to string for storage
  const sigString = typeof signature === 'object' ?
    (signature.formatSig || signature.structureSig || JSON.stringify(signature)) :
    String(signature);

  // Generate a unique mapping ID based on the actual mapping fields
  const mappingKey = mapping.filter(m => m !== "–").sort().join(",");

  return { sigString, mappingKey };
}

// Helper function to find existing mapping index
function findExistingMappingIndex(mappings, sigString, mappingKey, signature) {
  return mappings.findIndex(m =>
    (m.mappingKey === mappingKey) ||
    (m.signature && (
      m.signature === sigString ||
      (typeof m.signature === 'object' &&
        (m.signature.formatSig === signature.formatSig ||
          m.signature.structureSig === signature.structureSig))
    ))
  );
}

// Helper function to update existing mapping
function updateExistingMapping(mappings, index, config) {
  mappings[index].mapping = config.mapping;
  mappings[index].signature = config.sigString;
  mappings[index].mappingKey = config.mappingKey;
  mappings[index].headerRowIndex = config.headerRow;
  mappings[index].dataRowIndex = config.dataRow;

  // Initialize arrays if needed and add new values
  if (!mappings[index].fileTypes) {
    mappings[index].fileTypes = [];
  }
  if (!mappings[index].fileTypes.includes(config.fileType)) {
    mappings[index].fileTypes.push(config.fileType);
  }

  if (!mappings[index].files) {
    mappings[index].files = [];
  }
  if (!mappings[index].files.includes(config.fileName)) {
    mappings[index].files.push(config.fileName);
  }
}

// Update saveHeadersAndFormat to explicitly handle filenames
export function saveHeadersAndFormat(signature, mapping, fileName = null, headerRowIndex = null, dataRowIndex = null) {
  try {
    // Get file name from state or parameter
    const currentFileName = fileName || AppState.currentFileName || "";

    if (!currentFileName) {
      console.warn("No filename provided for format mapping");
      return false;
    }

    // Get row indices either from parameters or from DOM
    const headerRow = headerRowIndex !== null ? headerRowIndex :
      parseInt(document.getElementById("headerRowInput")?.value || "1", 10) - 1;

    const dataRow = dataRowIndex !== null ? dataRowIndex :
      parseInt(document.getElementById("dataRowInput")?.value || "2", 10) - 1;

    // Extract file extension for type info
    const fileType = currentFileName.split('.').pop().toLowerCase() || "unknown";

    console.log(`Saving format mapping for ${currentFileName} (${fileType}) with headerRow=${headerRow}, dataRow=${dataRow}`);

    // Get existing mappings
    const existingMappings = getExistingMappings();

    // Prepare signature and key
    const { sigString, mappingKey } = prepareSignatureAndKey(signature, mapping);

    // Find existing mapping
    const existingIndex = findExistingMappingIndex(existingMappings, sigString, mappingKey, signature);

    if (existingIndex !== -1) {
      console.log("Updating existing mapping at index", existingIndex);
      updateExistingMapping(existingMappings, existingIndex, {
        mapping, sigString, mappingKey, headerRow, dataRow, fileType, fileName: currentFileName
      });
    } else {
      console.log("Creating new mapping");
      existingMappings.push({
        signature: sigString,
        mapping: mapping,
        mappingKey: mappingKey,
        headerRowIndex: headerRow,
        dataRowIndex: dataRow,
        fileTypes: [fileType],
        files: [currentFileName],
        created: new Date().toISOString()
      });
    }

    console.log("Saving mappings:", existingMappings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingMappings));
    renderMappingList();
    return true;
  } catch (err) {
    console.error("Error saving format mapping:", err);
    return false;
  }
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
    if (!signature) return null;

    // Convert signature to string if it's an object
    const sigString = typeof signature === 'object' ? JSON.stringify(signature) : signature;

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find a mapping with this signature
    // Fix the undefined 'key' variable by using 'sigString' instead
    const mapping = mappings.find(m =>
      String(m.signature) === sigString ||
      (m.signature && m.signature.mappingSig === sigString)
    );

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by signature:", err);
    return null;
  }
}

/**
 * Gets a mapping by format
 * @param {string} format - Format identifier to look up
 * @returns {Object|null} - Mapping object or null if not found
 */
function getMappingByFormat(format) {
  try {
    if (!format) return null;

    // Convert format to string if it's an object
    const formatString = typeof format === 'object' ? JSON.stringify(format) : format;

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find matching mapping
    // Fix: Replace undefined 'key' with 'formatString'
    const mapping = mappings.find(m =>
      m.format === formatString ||
      (m.signature && m.signature.formatSig === formatString)
    );

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by format:", err);
    return null;
  }
}

/**
 * Gets a mapping by content signature
 * @param {string} contentSig - Content signature to look up
 * @returns {Object|null} - Mapping object or null if not found
 */
function getMappingByContentSignature(contentSig) {
  try {
    if (!contentSig) return null;

    // Convert signature to string if needed
    const sigString = typeof contentSig === 'object' ? JSON.stringify(contentSig) : contentSig;

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find mapping with matching content signature
    // Fix: Replace undefined 'key' with 'sigString'
    const mapping = mappings.find(m =>
      m.contentSignature === sigString ||
      (m.signature && m.signature.contentSig === sigString)
    );

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by content signature:", err);
    return null;
  }
}

// Fix for Undefined `key` Reference in mappingsManager.js

/**
 * Searches for a mapping by content signature with improved error handling
 * @param {string} contentSig - The content signature to look for
 * @returns {Object|null} The mapping object or null if not found
 */
function findMappingByContentSignature(contentSig) {
  try {
    if (!contentSig) return null;

    // Convert signature to string if needed
    const sigString = typeof contentSig === 'object' ? JSON.stringify(contentSig) : contentSig;

    // Get all mappings using the safer function
    const mappings = getSafeFormatMappings();

    // Find a mapping with matching content signature
    const mapping = mappings.find(m =>
      m.contentSignature === sigString ||
      (m.signature && m.signature.contentSig === sigString)
    );

    return mapping || null;
  } catch (err) {
    console.error("Error finding mapping by content signature:", err);
    return null;
  }
}

// Fix the renderMappingList to handle duplicates properly
// Update the renderMappingList function to show file types and files
export function renderMappingList() {
  const list = document.getElementById("mappingsList");
  if (!list) {
    console.warn("Mappings list element not found");
    return;
  }

  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log("Rendering mappings list:", mappings);

    if (!mappings.length) {
      list.innerHTML = '<div class="empty-list-message">No saved mappings yet</div>';
      return;
    }

    let html = `
      <table class="mappings-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Fields</th>
            <th>Row Info</th>
            <th>File Types</th>
            <th>Files</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    mappings.forEach((mapping, index) => {
      // Get mapped fields string
      const mappedFields = mapping.mapping.filter(m => m !== "–").join(", ") || "Unknown";

      // Get row indices information
      const headerRow = typeof mapping.headerRowIndex === 'number' ? mapping.headerRowIndex + 1 : 1;
      const dataRow = typeof mapping.dataRowIndex === 'number' ? mapping.dataRowIndex + 1 : 2;
      const rowInfo = `H:${headerRow}, D:${dataRow}`;

      // Get file types string
      const fileTypes = mapping.fileTypes && mapping.fileTypes.length > 0
        ? mapping.fileTypes.join(", ")
        : "None";

      // Get files using this format
      const filesText = mapping.files && mapping.files.length > 0
        ? mapping.files.join(", ")
        : "No files using this format";

      // Add row
      html += `
        <tr>
          <td>${mappedFields}</td>
          <td>${rowInfo}</td>
          <td>${fileTypes}</td>
          <td>${filesText}</td>
          <td>
            <button onclick="window.deleteMapping(${index})" title="Delete this mapping" class="icon-button">
              🗑️
            </button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    list.innerHTML = html;

  } catch (err) {
    console.error("Error rendering mapping list:", err);
    list.innerHTML = '<div class="error">Error loading mappings</div>';
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
    deleteButton.addEventListener("click", () => deleteMapping(sig));
    const actionsCell = document.createElement("td");
    actionsCell.appendChild(deleteButton);
    newRow.appendChild(actionsCell);

    table.appendChild(newRow);
  }
}

// Add window helper for deleteMapping
window.deleteMapping = function (index) {
  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    console.log("All mappings:", mappings);
    console.log("Trying to delete mapping at index:", index);

    if (index >= 0 && index < mappings.length) {
      const mappingToDelete = mappings[index];
      const mappingFields = mappingToDelete.mapping.filter(m => m !== "–").join(", ");

      // Check if the mapping has associated files
      const associatedFiles = mappingToDelete.files || [];

      let confirmMessage = `Delete format mapping for "${mappingFields}"?`;

      if (associatedFiles.length > 0) {
        confirmMessage += `\n\nThis format is used by ${associatedFiles.length} file(s):\n- ${associatedFiles.join('\n- ')}`;
        confirmMessage += `\n\nDo you want to remove these files from your merged list as well?`;

        if (confirm(confirmMessage)) {
          // Remove associated files if confirmed
          if (associatedFiles.length > 0) {
            AppState.mergedFiles = AppState.mergedFiles.filter(file =>
              !associatedFiles.includes(file.fileName)
            );
            saveMergedFiles();
            updateTransactions();
            renderMergedFiles();
          }

          // Remove the mapping
          mappings.splice(index, 1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
          renderMappingList();

          showToast(`Format mapping and ${associatedFiles.length} associated file(s) removed`, "success");
        }
      } else {
        // No files associated, just confirm mapping deletion
        if (confirm(`Delete format mapping for "${mappingFields}"?`)) {
          mappings.splice(index, 1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
          renderMappingList();
          showToast("Format mapping deleted", "success");
        }
      }
    } else {
      showToast("Invalid mapping index", "error");
      console.error("Invalid mapping index:", index);
    }
  } catch (err) {
    console.error("Error deleting mapping:", err);
    showToast("Error deleting mapping", "error");
  }
};

window.deleteMapping = deleteMapping;
window.deleteFormatAndAssociatedFiles = deleteFormatAndAssociatedFiles;

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

// Update window.deleteMapping function
// Helper function to build confirmation message
function buildConfirmMessage(mappingFields, associatedFiles) {
  let message = `Delete format mapping for "${mappingFields}"?`;

  if (associatedFiles.length > 0) {
    message += `\n\nThis format is used by ${associatedFiles.length} file(s):\n- ${associatedFiles.join('\n- ')}`;
    message += `\n\nDo you want to remove these files from your merged list as well?`;
  }

  return message;
}

// Helper function to handle mapping deletion and UI updates
function handleMappingDeletion(mappings, index, withFiles = false, removedCount = 0) {
  mappings.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  renderMappingList();

  if (withFiles) {
    renderMergedFiles();
    updateTransactions();
    showToast(`Format mapping and ${removedCount} file(s) removed`, "success");
  } else {
    showToast("Format mapping deleted", "success");
  }
}

// Helper function to remove associated files and return count of removed files
function removeAssociatedFiles(associatedFiles) {
  if (!associatedFiles || associatedFiles.length === 0) {
    return 0;
  }

  const beforeCount = AppState.mergedFiles.length;
  AppState.mergedFiles = AppState.mergedFiles.filter(file =>
    !associatedFiles.includes(file.fileName)
  );
  const removedCount = beforeCount - AppState.mergedFiles.length;
  saveMergedFiles();
  return removedCount;
}

// Helper function to validate mapping index
function isValidMappingIndex(mappings, index) {
  return mappings && index >= 0 && index < mappings.length;
}

window.deleteMapping = function (index) {
  try {
    const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log(`Attempting to delete mapping at index ${index}, total mappings:`, mappings.length);

    // Early return if index is invalid
    if (!isValidMappingIndex(mappings, index)) {
      showToast("Invalid mapping index", "error");
      return;
    }

    const mappingToDelete = mappings[index];
    console.log("Mapping to delete:", mappingToDelete);

    // Prepare mapping information
    const mappingFields = mappingToDelete.mapping.filter(m => m !== "–").join(", ");
    const associatedFiles = mappingToDelete.files || [];
    const hasAssociatedFiles = associatedFiles.length > 0;

    // Confirm deletion
    const confirmMessage = buildConfirmMessage(mappingFields, associatedFiles);
    if (!confirm(confirmMessage)) {
      return;
    }

    // Process file removal if needed
    const removedCount = hasAssociatedFiles ?
      removeAssociatedFiles(associatedFiles) : 0;

    // Update mappings and UI
    handleMappingDeletion(mappings, index, hasAssociatedFiles, removedCount);

  } catch (err) {
    console.error("Error deleting mapping:", err);
    showToast("Error deleting mapping", "error");
  }
};

/**
 * Deletes a format mapping by its index
 * @param {number} index - The index of the format mapping to delete
 * @returns {boolean} - True if successful, false otherwise
 */
export function deleteFormatMapping(index) {
  try {
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    if (index >= 0 && index < mappings.length) {
      // Get the mapping to be deleted for confirmation message

      // Remove the mapping
      mappings.splice(index, 1);

      // Save updated mappings
      localStorage.setItem("fileFormatMappings", JSON.stringify(mappings));

      // Return success message with format details
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error deleting format mapping:", e);
    return false;
  }
}

window.deleteMapping = deleteMapping;
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
  const removalMessage = affectedFiles.length ?
    `Format mapping removed. ${affectedFiles.length} associated file(s) were also removed.` :
    "Format mapping removed.";
  showToast(removalMessage, "success");

  return true;
}

// Make sure deleteFormatMapping is included in the default export
export default {
  // ...existing exports...
  deleteFormatMapping,
  removeFormatMapping,
  // ...existing exports...
};

// Refactor function at line 75
function processMappings(mappings) {
  return mappings.filter(isValidMapping).map(formatMapping);
}

// Refactor function at line 438
function updateMappings(mappings, updates) {
  updates.forEach(update => {
    if (mappings[update.key]) {
      mappings[update.key] = update.value;
    }
  });
}

/**
 * Toggles the visibility of a mapping section
 * @param {string} mappingId - The ID of the mapping section to toggle
 */
function toggleMappingSection(mappingId) {
  const contentDiv = document.getElementById(`mapping-content-${mappingId}`);
  const arrowIcon = document.querySelector(`#mapping-header-${mappingId} .toggle-arrow`);

  if (!contentDiv || !arrowIcon) return;

  // Define condition variable before using it
  const condition = contentDiv.style.display !== 'none';

  // Toggle content visibility
  contentDiv.style.display = condition ? 'none' : 'block';

  // Update arrow icon
  arrowIcon.textContent = condition ? '▶' : '▼';

  // Save state to localStorage
  try {
    const collapsedMappings = JSON.parse(localStorage.getItem('collapsedMappings') || '{}');
    collapsedMappings[mappingId] = condition;
    localStorage.setItem('collapsedMappings', JSON.stringify(collapsedMappings));
  } catch (err) {
    console.error('Error saving mapping section state:', err);
  }
}

/**
 * Gets a mapping by name
 * @param {string} name - The name to look for
 * @returns {Object|null} The mapping object or null if not found
 */
function getMappingByName(name) {
  try {
    if (!name) return null;

    // Convert name to string for consistency
    const nameString = typeof name === 'object' ? JSON.stringify(name) : String(name);

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find a mapping with this name
    // Fix: Replace undefined 'key' with 'nameString'
    const mapping = mappings.find(m =>
      m.name === nameString ||
      (m.fileName && m.fileName === nameString) ||
      (m.files && m.files.includes(nameString))
    );

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by name:", err);
    return null;
  }
}

/**
 * Gets a mapping by ID
 * @param {string} id - The mapping ID to look for
 * @returns {Object|null} The mapping object or null if not found
 */
function getMappingById(id) {
  try {
    if (!id) return null;

    // Convert ID to string for consistent comparison
    const idString = typeof id === 'object' ? JSON.stringify(id) : String(id);

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find a mapping with this ID
    // Fix: Replace undefined 'key' with 'idString'
    const mapping = mappings.find(m =>
      m.id === idString ||
      String(m.id) === idString
    );

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by ID:", err);
    return null;
  }
}

/**
 * Gets a mapping by key
 * @param {string} mappingKey - The key to look for
 * @returns {Object|null} The mapping object or null if not found
 */
function getMappingByKey(mappingKey) {
  try {
    if (!mappingKey) return null;

    // Convert key to string for consistent comparison
    const keyString = typeof mappingKey === 'object' ? JSON.stringify(mappingKey) : String(mappingKey);

    // Ensure AppState is initialized
    if (!AppState || !AppState.mergedFiles) {
      console.error("AppState is not initialized.");
      return null;
    }

    // Get all mappings
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find a mapping with this key
    const mapping = mappings.find(m => m.key === keyString || String(m.key) === keyString);

    return mapping || null;
  } catch (err) {
    console.error("Error getting mapping by key:", err);
    return null;
  }
}
