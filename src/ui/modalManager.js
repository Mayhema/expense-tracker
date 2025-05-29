/**
 * Show modal with configuration
 * @param {Object} config - Modal configuration
 * @returns {Object} Modal object with close method
 */
export function showModal(config) {
  const {
    title = "Modal",
    content = "",
    size = "medium",
    closeOnClickOutside = true,
    className = "",
    onClose = null
  } = config;

  // Prevent body scrolling when modal opens
  document.body.classList.add('modal-open');

  // Create modal backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  // Create modal content container
  const modalElement = document.createElement("div");
  modalElement.className = `modal-content ${className}`;

  // Apply enhanced modal sizes with better windowing
  switch (size) {
    case "upload":
      modalElement.style.width = "900px";
      modalElement.style.maxWidth = "90vw";
      modalElement.style.height = "75vh";
      modalElement.style.maxHeight = "75vh";
      break;
    case "small":
      modalElement.style.width = "450px";
      modalElement.style.maxWidth = "80vw";
      modalElement.style.height = "auto";
      modalElement.style.maxHeight = "60vh";
      break;
    case "large":
      modalElement.style.width = "800px";
      modalElement.style.maxWidth = "85vw";
      modalElement.style.height = "auto";
      modalElement.style.maxHeight = "80vh";
      break;
    case "xlarge":
      modalElement.style.width = "1000px";
      modalElement.style.maxWidth = "90vw";
      modalElement.style.height = "auto";
      modalElement.style.maxHeight = "85vh";
      break;
    default: // medium
      modalElement.style.width = "600px";
      modalElement.style.maxWidth = "80vw";
      modalElement.style.height = "auto";
      modalElement.style.maxHeight = "70vh";
      break;
  }

  // Ensure minimum height
  modalElement.style.minHeight = "200px";

  // Build enhanced modal structure
  modalElement.innerHTML = `
    <div class="modal-header">
      <h2>${title}</h2>
      <button class="modal-close-btn" aria-label="Close" title="Close">&times;</button>
    </div>
    <div class="modal-body">
      ${typeof content === 'string' ? content : ''}
    </div>
  `;

  // Add content if it's an element
  if (content && typeof content === 'object' && content.nodeType === Node.ELEMENT_NODE) {
    const modalBody = modalElement.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.appendChild(content);
  }

  backdrop.appendChild(modalElement);
  document.body.appendChild(backdrop);

  // Enhanced close functionality
  const closeBtn = modalElement.querySelector('.modal-close-btn');

  const closeModal = (animated = true) => {
    if (animated) {
      // Add closing animation
      modalElement.classList.add('closing');
      setTimeout(() => {
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
        // Restore body scrolling
        document.body.classList.remove('modal-open');
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      }, 300);
    } else {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
      // Restore body scrolling
      document.body.classList.remove('modal-open');
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }
  };

  // Enhanced event listeners
  closeBtn.addEventListener('click', () => closeModal(true));

  if (closeOnClickOutside) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(true);
      }
    });
  }

  // Enhanced ESC key handling
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      closeModal(true);
      document.removeEventListener('keydown', handleEscKey);
    }
  };
  document.addEventListener('keydown', handleEscKey);

  // Focus management for accessibility
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // Return enhanced modal object
  return {
    element: modalElement,
    backdrop: backdrop,
    close: closeModal
  };
}

/**
 * Closes all active modals with enhanced cleanup
 */
export function closeAllModals() {
  // Remove all modal backdrops
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(modal => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });

  // Restore body scrolling
  document.body.classList.remove('modal-open');

  // Clear any modal-related classes
  document.body.classList.remove('modal-blur');
}

// Enhanced global escape handler
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-backdrop');
    if (activeModals.length > 0) {
      // Close the topmost modal
      const topModal = activeModals[activeModals.length - 1];
      const closeBtn = topModal.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.click();
      }
    }
  }
});
