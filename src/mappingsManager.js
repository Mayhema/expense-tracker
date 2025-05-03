import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "./uiManager.js";
import { updateTransactions } from "./transactionManager.js";
import { renderMergedFiles } from "./main.js";

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

// Update the saveHeadersAndFormat function

export function saveHeadersAndFormat(signatures, headerMapping) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
  // Get the main signature to use as key
  const mainSig = signatures.structureSig || signatures.formatSig || signatures;
  const mappingSig = signatures.mappingSig;
  
  console.log("Saving format mapping with signature:", mainSig);
  
  // Check if mapping already exists to avoid duplicates
  if (allMappings[mainSig] && JSON.stringify(allMappings[mainSig].mapping) === JSON.stringify(headerMapping)) {
    console.log("Format mapping already exists, skipping save");
    return;
  }
  
  // Store all available signatures and the mapping
  allMappings[mainSig] = { 
    mapping: headerMapping,
    formatSig: signatures.formatSig || mainSig,
    structureSig: signatures.structureSig || signatures.formatSig || mainSig,
    mappingSig: mappingSig,
    created: new Date().toISOString() // Add timestamp for sorting
  };
  
  // Also store by mapping signature if available
  if (mappingSig && mappingSig !== mainSig) {
    allMappings[mappingSig] = allMappings[mainSig];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
  console.log("Format mapping saved successfully");
  
  // Force refresh the mappings list
  renderMappingList();
}

// Update getMappingBySignature to handle all signature formats
export function getMappingBySignature(signature) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
  // Extract the format signature
  let lookupSig;
  if (typeof signature === 'object') {
    // Try all possible signature properties in order of preference
    lookupSig = signature.structureSig || signature.formatSig || signature.contentSig;
  } else {
    lookupSig = signature; // It's already a string
  }
  
  console.log("Looking up mapping by signature:", lookupSig);
  
  // First try direct lookup
  if (allMappings[lookupSig]) {
    console.log("Found direct mapping match:", allMappings[lookupSig]);
    return allMappings[lookupSig].mapping;
  }
  
  // If not found, check for matching formatSig in any entry
  for (const [sig, entry] of Object.entries(allMappings)) {
    if (entry.formatSig === lookupSig || entry.structureSig === lookupSig) {
      console.log("Found indirect mapping match:", entry);
      return entry.mapping;
    }
  }
  
  console.log("No mapping found for signature:", lookupSig);
  return null;
}

// Replace the renderMappingList function with this version:
export function renderMappingList() {
  const table = document.getElementById("mappingTable");
  if (!table) return;

  // Fetch mappings from localStorage
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  console.log("Rendering mappings table with data:", allMappings);
  
  // Create a map to track unique mappings, using stringified mapping as the key
  // This ensures we only show each unique mapping once regardless of signature
  const uniqueMappings = new Map();
  
  // Process all mappings, preferring formatSig entries
  Object.entries(allMappings).forEach(([sig, entry]) => {
    if (!entry || !entry.mapping || !Array.isArray(entry.mapping)) return;
    
    // Create a unique key based on the actual mapping content
    const mappingKey = JSON.stringify(entry.mapping);
    
    // Only add if not already added or if this is the format signature (preferred)
    if (!uniqueMappings.has(mappingKey) || entry.formatSig === sig) {
      uniqueMappings.set(mappingKey, { sig, entry });
    }
  });
  
  // Set table headers with adjusted widths
  table.innerHTML = `
    <tr>
      <th style="width: 25%;">Format ID</th>
      <th style="width: 65%;">Fields</th>
      <th style="width: 10%;">Actions</th>
    </tr>
  `;

  if (uniqueMappings.size === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="3" style="text-align: center; padding: 10px;">No saved format mappings yet</td>';
    table.appendChild(emptyRow);
    return;
  }

  // Build table rows
  uniqueMappings.forEach(({ sig, entry }) => {
    const row = document.createElement("tr");
    
    // Format the mapping for display
    const mapping = Array.isArray(entry.mapping) 
      ? entry.mapping.filter(m => m !== "–").join(", ") 
      : "Invalid mapping";

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.className = "icon-button";
    deleteButton.addEventListener("click", () => deleteMapping(sig));

    // Add signature as ID with tooltip
    const sigCell = document.createElement("td");
    sigCell.title = sig; // Full signature as tooltip
    sigCell.textContent = sig.substring(0, 8) + "...";
    sigCell.style.overflow = "hidden";
    sigCell.style.textOverflow = "ellipsis";
    sigCell.style.whiteSpace = "nowrap";
    
    // Add mapping description
    const mapCell = document.createElement("td");
    mapCell.className = "mapping-cell";
    mapCell.textContent = mapping;
    
    // Add actions cell with delete button
    const actionsCell = document.createElement("td");
    actionsCell.appendChild(deleteButton);
    
    // Assemble the row
    row.appendChild(sigCell);
    row.appendChild(mapCell);
    row.appendChild(actionsCell);
    table.appendChild(row);
  });
}

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

window.deleteMapping = deleteMapping;
window.deleteFormatAndAssociatedFiles = deleteFormatAndAssociatedFiles;
