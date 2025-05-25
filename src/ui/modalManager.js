/**
 * Modal management utility for creating and managing modals throughout the application
 */

// Track active modals
const activeModals = new Map();
let modalCounter = 0;

/**
 * Creates and shows a modal dialog
 * @param {Object} options - Modal options
 * @returns {Object} Modal instance with close method
 */
export function showModal(options = {}) {
  const {
    title = 'Modal',
    content = '',
    size = 'medium',
    id = `modal-${Date.now()}`,
    closeOnClickOutside = true,
    width = null, // New parameter for custom width
  } = options;

  // Create modal container if it doesn't exist
  let modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }

  // Create modal element
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal-backdrop';
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.zIndex = '1000';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  // Determine size class
  const maxWidth = getModalWidth(size, width);

  // Add improved button styles
  const buttonStyles = `
    <style>
      /* Modal button styling */
      .modal-container button {
        padding: 8px 16px;
        margin: 5px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #ddd;
        background-color: #f8f8f8;
        color: #333;
      }

      .modal-container button:hover {
        background-color: #f0f0f0;
        border-color: #ccc;
      }

      .modal-container button.primary-btn {
        background-color: #4CAF50;
        color: white;
        border: 1px solid #45a049;
      }

      .modal-container button.primary-btn:hover {
        background-color: #45a049;
      }

      .modal-container button.danger-btn {
        background-color: #f44336;
        color: white;
        border: 1px solid #d32f2f;
      }

      .modal-container button.danger-btn:hover {
        background-color: #d32f2f;
      }

      .modal-container .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: 15px;
        margin-top: 15px;
        border-top: 1px solid #eee;
      }

      /* Dark mode support */
      .dark-mode .modal-container button {
        background-color: #444;
        border-color: #555;
        color: #eee;
      }

      .dark-mode .modal-container button:hover {
        background-color: #555;
        border-color: #666;
      }

      .dark-mode .modal-container button.primary-btn {
        background-color: #388e3c;
        border-color: #2e7d32;
      }

      .dark-mode .modal-container button.primary-btn:hover {
        background-color: #2e7d32;
      }

      .dark-mode .modal-container .modal-footer {
        border-top-color: #444;
      }
    </style>
  `;

  // Create modal HTML content with improved styling
  modal.innerHTML = `
    ${buttonStyles}
    <div class="modal-container" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); width: 90%; max-width: ${maxWidth}; max-height: 90vh; overflow-y: auto; position: relative;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 15px 20px;">
        <h2 class="modal-title" style="margin: 0; font-size: 1.25rem;">${title}</h2>
        <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #777; padding: 0; line-height: 1;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <!-- Content will be inserted here -->
      </div>
    </div>
  `;

  // Add to DOM
  modalContainer.appendChild(modal);

  // Insert content
  const modalBody = modal.querySelector('.modal-body');
  if (typeof content === 'string') {
    modalBody.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    modalBody.innerHTML = '';
    modalBody.appendChild(content);
  }

  // Add modal to the global modals tracking
  if (!window.openModals) window.openModals = [];
  window.openModals.push(id);

  // Create close function
  const close = () => {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);

      // Remove from tracking
      if (window.openModals) {
        const index = window.openModals.indexOf(id);
        if (index !== -1) window.openModals.splice(index, 1);
      }
    }
  };

  // Add close button event listener
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }

  // Add click outside to close
  if (closeOnClickOutside) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        close();
      }
    });
  }

  // Add ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Return modal object with close method
  return {
    element: modal,
    close,
    id
  };
}

/**
 * Closes a modal by ID
 * @param {string} id - Modal ID to close
 * @returns {boolean} True if modal was found and closed
 */
export function closeModal(id) {
  const modalElements = document.querySelectorAll(`#${id}`);
  if (modalElements.length === 0) return false;

  const modalElement = modalElements[0];
  if (modalElement && modalElement.parentNode) {
    modalElement.parentNode.removeChild(modalElement);
    return true;
  }

  return false;
}

/**
 * Closes all active modals
 */
export function closeAllModals() {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    // Remove all modal elements
    modalContainer.innerHTML = '';
  }

  // Also check for any direct modal elements that might be outside the container
  const modals = document.querySelectorAll('.modal-container, .modal, .modal-backdrop');
  modals.forEach(modal => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });

  // Clear tracking
  window.openModals = [];
}

// Add a global escape handler for modals
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAllModals();
  }
});

// Add to window for easy access
window.closeAllModals = closeAllModals;

// Add a function to handle global modal closing
export function setupGlobalModalCloser() {
  // Add a global close button to the document body if it doesn't exist
  if (!document.getElementById('globalModalCloser')) {
    const closer = document.createElement('button');
    closer.id = 'globalModalCloser';
    closer.innerHTML = 'Close All Modals';
    closer.style.position = 'fixed';
    closer.style.bottom = '10px';
    closer.style.right = '10px';
    closer.style.zIndex = '9999';
    closer.style.display = 'none';
    closer.style.padding = '8px 12px';
    closer.style.backgroundColor = '#ff4444';
    closer.style.color = 'white';
    closer.style.border = 'none';
    closer.style.borderRadius = '4px';
    closer.style.cursor = 'pointer';

    closer.addEventListener('click', closeAllModals);
    document.body.appendChild(closer);

    // Show the button when there are open modals
    const observer = new MutationObserver(() => {
      const hasModals = document.querySelectorAll('.modal-backdrop, .modal').length > 0;
      closer.style.display = hasModals ? 'block' : 'none';
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the global modal closer
document.addEventListener('DOMContentLoaded', setupGlobalModalCloser);

// Fix "xlarge" unknown word by using standard terminology
function getModalWidth(size, width) {
  if (typeof width === 'number') return `${width}px`;
  if (width) return width;

  switch (size) {
    case 'small': return '400px';
    case 'medium': return '600px';
    case 'large': return '800px';
    case 'extra-large': return '1000px'; // Changed from "xlarge"
    default: return '600px';
  }
}

// Add this helper function to ensure modals can close properly
export function ensureModalCanClose(modal) {
  if (!modal || !modal.element) return;

  // Find close button in the modal
  const closeBtn = modal.element.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
  }

  // Make sure the content is visible
  const content = modal.element.querySelector('.modal-content');
  if (content) {
    content.style.display = 'block';
  }
}
