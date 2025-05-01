import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "./uiManager.js";
import { updateTransactions } from "./transactionManager.js";
import { renderMergedFiles } from "./main.js";

const STORAGE_KEY = "fileFormatMappings";

// Update to support dual signatures

export function saveHeadersAndFormat(signatures, headerMapping) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
  // Store structure signature as primary key
  const { structureSig, mappingSig } = signatures;
  
  // Store both signatures and the mapping
  allMappings[structureSig] = { 
    mapping: headerMapping, 
    structureSig, 
    mappingSig 
  };
  
  // Also store by mapping signature if available
  if (mappingSig) {
    allMappings[mappingSig] = { 
      mapping: headerMapping, 
      structureSig, 
      mappingSig 
    };
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
}

export function getMappingBySignature(signatures) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
  // Check if it's an object with signatures or just a string
  let structureSig, mappingSig;
  
  if (typeof signatures === 'object') {
    structureSig = signatures.structureSig;
    mappingSig = signatures.mappingSig;
  } else {
    structureSig = signatures;
  }
  
  // Try to find by either signature
  if (mappingSig && allMappings[mappingSig]) {
    return allMappings[mappingSig].mapping;
  }
  
  if (structureSig && allMappings[structureSig]) {
    return allMappings[structureSig].mapping;
  }
  
  return null;
}

export function renderMappingList() {
  const table = document.getElementById("mappingTable");
  if (!table) return;

  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
  // Create a map to track unique mappings (avoid duplicates from dual signatures)
  const uniqueMappings = new Map();
  
  Object.entries(allMappings).forEach(([sig, entry]) => {
    // Use structureSig as the unique key
    if (entry.structureSig) {
      uniqueMappings.set(entry.structureSig, entry);
    }
  });
  
  // Set table headers with adjusted widths
  table.innerHTML = `
    <tr>
      <th style="width: 25%; max-width: 120px; overflow: hidden; text-overflow: ellipsis;">Format</th>
      <th style="width: 65%;">Mapping</th>
      <th style="width: 10%;">Actions</th>
    </tr>
  `;

  uniqueMappings.forEach((entry, sig) => {
    const row = document.createElement("tr");
    
    // Format the mapping for display
    const mapping = Array.isArray(entry.mapping) 
      ? entry.mapping.filter(m => m !== "–").join(", ") 
      : "Invalid mapping";

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.addEventListener("click", () => deleteMapping(sig));

    // Add abbreviated signature with tooltip
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
    
    // Delete both signature entries
    delete allMappings[structureSig];
    if (mappingSig) {
      delete allMappings[mappingSig];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
    renderMappingList();
    
    // Delete all files with this signature
    deleteFormatAndAssociatedFiles(sig, structureSig, mappingSig);
  }
}

// Add a new function to handle deletion of associated files
export function deleteFormatAndAssociatedFiles(sig, structureSig, mappingSig) {
  // Find all files matching any of these signatures
  const associatedFiles = AppState.mergedFiles.filter(file => 
    file.signature === sig || 
    file.signature === structureSig || 
    file.signature === mappingSig
  );

  if (associatedFiles.length > 0) {
    const fileNames = associatedFiles.map(file => file.fileName).join(", ");
    const confirmDelete = confirm(
      `The following files are associated with this format and will be deleted:\n\n${fileNames}\n\nDo you want to proceed?`
    );

    if (!confirmDelete) return;

    // Remove these files from the merged files list
    AppState.mergedFiles = AppState.mergedFiles.filter(file => 
      file.signature !== sig && 
      file.signature !== structureSig && 
      file.signature !== mappingSig
    );
    
    saveMergedFiles();
    renderMergedFiles();
    updateTransactions();
    showToast("Format and associated files deleted.", "success");
  }
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
