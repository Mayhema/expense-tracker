/**
 * Shows a modal dialog
 * @param {Object} options - Modal configuration options
 * @param {string} options.title - Modal title
 * @param {HTMLElement|string} options.content - Modal content (HTML element or HTML string)
 * @param {string} options.size - Modal size (small, medium, large, or custom)
 * @param {number} options.width - Custom width for the modal (when size is 'custom')
 * @param {boolean} options.closeOnClickOutside - Whether to close when clicking outside
 * @param {Function} options.onClose - Callback function when modal is closed
 * @returns {Object} Modal instance with close method
 */
export function showModal(options = {}) {
  // Create modal elements
  const modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  modalBackdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const modal = document.createElement("div");
  modal.className = `modal ${options.size || "medium"}`;

  // Set width if custom size
  if (options.size === "custom" && options.width) {
    modal.style.width = typeof options.width === 'number' ? `${options.width}px` : options.width;
    modal.style.maxWidth = "90%";
  }

  // Create modal content container
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.cssText = `
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  `;

  // Apply dark mode if body has dark-mode class
  if (document.body.classList.contains("dark-mode")) {
    modalContent.style.backgroundColor = "#2d2d2d";
    modalContent.style.color = "#e0e0e0";
  }

  // Create header with title and close button
  const header = document.createElement("div");
  header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;";

  const title = document.createElement("h3");
  title.textContent = options.title || "Modal";
  title.style.margin = "0";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "close";
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    color: #777;
  `;

  // Apply dark mode to close button if needed
  if (document.body.classList.contains("dark-mode")) {
    closeBtn.style.color = "#aaa";
  }

  header.appendChild(title);
  header.appendChild(closeBtn);
  modalContent.appendChild(header);

  // Add content
  if (options.content) {
    if (typeof options.content === "string") {
      modalContent.innerHTML += options.content;
    } else {
      modalContent.appendChild(options.content);
    }
  }

  modal.appendChild(modalContent);
  modalBackdrop.appendChild(modal);
  document.body.appendChild(modalBackdrop);

  // Modal instance
  const modalInstance = {
    element: modal,
    close: () => {
      document.body.removeChild(modalBackdrop);
      if (typeof options.onClose === "function") {
        options.onClose();
      }
    }
  };

  // Add close event to button
  closeBtn.addEventListener("click", modalInstance.close);

  // Close on click outside if enabled
  if (options.closeOnClickOutside !== false) {
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) {
        modalInstance.close();
      }
    });
  }

  return modalInstance;
}

/**
 * Closes all open modals
 */
export function closeModal() {
  const modals = document.querySelectorAll(".modal-backdrop");
  modals.forEach(modal => {
    document.body.removeChild(modal);
  });
}
