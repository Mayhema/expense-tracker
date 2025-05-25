import { AppState, saveMergedFiles } from './appState.js';
import { showToast } from '../ui/uiManager.js';

/**
 * Adds a new file to the merged files list in AppState and saves it.
 * @param {Array<Array>} fileData - The parsed data from the file.
 * @param {Array<string>} headerMapping - The mapping of headers.
 * @param {string} fileName - The name of the file.
 * @param {string} signature - The file signature.
 * @param {number} headerRowIndex - The 0-based index of the header row.
 * @param {number} dataRowIndex - The 0-based index of the first data row.
 * @param {string} currency - The currency of the file.
 */
export function addMergedFile(fileData, headerMapping, fileName, signature, headerRowIndex, dataRowIndex, currency) {
  if (!fileData || !headerMapping || !fileName || !signature) {
    console.error("addMergedFile: Missing required parameters.", { fileName, signature, headerMapping, fileData });
    showToast("Error: Could not add file due to missing data.", "error");
    return;
  }

  const newFileEntry = {
    fileName,
    data: fileData,
    headerMapping,
    signature,
    selected: true, // Default to selected
    dateAdded: new Date().toISOString(),
    headerRowIndex,
    dataRowIndex,
    currency
  };

  // Ensure AppState.mergedFiles is an array
  if (!Array.isArray(AppState.mergedFiles)) {
    AppState.mergedFiles = [];
  }

  // Check for existing file by signature to prevent exact duplicates if desired,
  // or replace by name if that's the policy (current policy seems to be replace by name via UI confirm)
  const existingFileIndex = AppState.mergedFiles.findIndex(f => f.fileName === fileName);
  if (existingFileIndex !== -1) {
    console.log(`Replacing existing file: ${fileName}`);
    AppState.mergedFiles[existingFileIndex] = newFileEntry;
  } else {
    AppState.mergedFiles.push(newFileEntry);
  }

  saveMergedFiles(); // Save to localStorage
  console.log(`File "${fileName}" added/updated in mergedFiles. Total: ${AppState.mergedFiles.length}`);
  showToast(`File "${fileName}" processed and saved.`, "success");
}
