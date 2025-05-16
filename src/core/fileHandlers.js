import { onFileUpload, createNewFileInput } from "../ui/fileUpload.js";
import { initializeDragAndDrop } from "../ui/dragAndDrop.js";

/**
 * Initializes file upload handlers
 */
export function initializeFileHandlers() {
  // Ensure we have a fresh file input element
  // const fileInput = createNewFileInput();

  // Add click handler to the upload button
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => {
      // Always create a fresh file input before clicking
      const input = createNewFileInput();
      if (input) {
        input.click();
      }
    });
  }

  // Initialize drag and drop if needed
  initializeDragAndDrop(onFileUpload);
}
