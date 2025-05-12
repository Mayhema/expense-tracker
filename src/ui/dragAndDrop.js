import { showToast } from "./uiManager.js";

/**
 * Initializes drag and drop functionality for file uploads
 * @param {Function} onFileUpload - Function to handle uploaded files
 */
export function initializeDragAndDrop(onFileUpload) {
  const dropZone = document.getElementById("fileUploadSection");
  if (!dropZone) return;

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = "#f0f0f0";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.backgroundColor = "white";
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = "white";

    const file = event.dataTransfer.files[0];
    if (file) {
      onFileUpload({ target: { files: [file] } });
    } else {
      showToast("No file was dropped", "error");
    }
  });
}
