import { onFileUpload } from "../ui/fileUpload.js";
import { initializeDragAndDrop } from "../ui/dragAndDrop.js";

/**
 * Initializes file upload handlers
 */
export function initializeFileHandlers() {
  // FIXED: Removed duplicate upload button event listener
  // The upload button is already handled by sidebarManager.js
  // Adding duplicate listeners was causing the file dialog to appear twice

  // Initialize drag and drop if needed
  initializeDragAndDrop(onFileUpload);
}
