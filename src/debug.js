import { AppState } from "./appState.js";

// Debug function for merged files
export function debugMergedFiles() {
  console.log("Current merged files:", AppState.mergedFiles);
  
  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    console.log("No merged files found!");
    alert("No merged files found in AppState");
    return;
  }
  
  AppState.mergedFiles.forEach((file, i) => {
    console.log(`File ${i+1}: ${file.fileName}, Signature: ${file.signature}`);
    console.log(`Header mapping:`, file.headerMapping);
    console.log(`Data rows: ${file.data.length}`);
    console.log(`Sample row:`, file.data[1] || "No data rows");
  });
  
  console.log("Current transactions:", AppState.transactions);
}

// Debug function for signatures
export function debugSignatures() {
  console.log("===== SIGNATURE DEBUG =====");
  
  // Check current file signature
  if (AppState.currentFileSignature) {
    console.log("Current file signature:", AppState.currentFileSignature);
  } else {
    console.log("No current file signature");
  }
  
  // Check mappings in localStorage
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "{}");
  console.log("Saved mappings:", mappings);
  
  // Check all signature types in merged files
  console.log("Signatures in merged files:");
  if (AppState.mergedFiles && AppState.mergedFiles.length > 0) {
    AppState.mergedFiles.forEach((file, i) => {
      console.log(`File ${i+1}: ${file.fileName}`);
      console.log(`  format: ${file.formatSig || 'missing'}`);
      console.log(`  content: ${file.contentSig || 'missing'}`);
      console.log(`  mapping: ${file.mappingSig || 'missing'}`);
      console.log(`  legacy: ${file.signature || 'missing'}`);
    });
  } else {
    console.log("No merged files found");
  }
  
  console.log("========================");
}

// Explicitly attach to window object, with more robust approach
function attachDebugFunctions() {
  window.debugMergedFiles = debugMergedFiles;
  window.debugSignatures = debugSignatures;
  console.log("Debug functions attached to window");
}

// Ensure functions are attached on module load
attachDebugFunctions();

// Also attach them after DOM is loaded for extra safety
document.addEventListener("DOMContentLoaded", attachDebugFunctions);

// For immediate verification
console.log("Debug module loaded, functions attached:", 
  Boolean(window.debugMergedFiles), 
  Boolean(window.debugSignatures));