/**
 * Modal management module
 */

let activeModal = null;
let modalCreationInProgress = false;

// FIXED: Cache frequently accessed DOM elements
const modalCache = {
  overlay: null,
  activeModals: new Map(),
  eventListeners: new Map()
};

function getModalOverlay() {
  // FIXED: Cache the overlay element
  if (!modalCache.overlay) {
    modalCache.overlay = document.getElementById('modalOverlay') || createModalOverlay();
  }
  return modalCache.overlay;
}

/**
 * Show a modal with the given options
 */
export function showModal(options = {}) {
  // FIXED: Prevent multiple modals from being created simultaneously
  if (modalCreationInProgress) {
    console.log('CRITICAL: Modal creation already in progress, skipping...');
    return activeModal;
  }

  // FIXED: Close any existing modal before creating a new one
  if (activeModal) {
    console.log('CRITICAL: Closing existing modal before creating new one');
    activeModal.close();
    activeModal = null;
  }

  modalCreationInProgress = true;

  console.log('CRITICAL: showModal called with options:', options);

  const {
    title = 'Modal',
    content = '',
    size = 'medium',
    closeOnClickOutside = true,
    showCloseButton = true
  } = options;

  // CRITICAL FIX: Ensure modal container exists and is properly styled
  let modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    modalContainer.className = 'modal-container';
    modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: auto;
      display: block;
    `;
    document.body.appendChild(modalContainer);
    console.log('CRITICAL: Created modal container');
  } else {
    // CRITICAL FIX: Ensure existing container is properly visible
    modalContainer.style.pointerEvents = 'auto';
    modalContainer.style.display = 'block';
    console.log('CRITICAL: Using existing modal container');
  }

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    visibility: visible;
    opacity: 1;
    z-index: 10001;
  `;

  // Create modal dialog
  const modalDialog = document.createElement('div');
  modalDialog.className = `modal-dialog modal-${size}`;
  modalDialog.style.cssText = `
    background-color: white;
    border-radius: 8px;
    max-width: ${size === 'large' ? '90vw' : '600px'};
    max-height: 90vh;
    overflow: auto;
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 10002;
  `;

  // Create modal content structure
  const modalContentWrapper = document.createElement('div');
  modalContentWrapper.className = 'modal-content';

  // Modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  modalHeader.style.cssText = `
    padding: 20px 24px 0 24px;
    border-bottom: 1px solid #eee;
    position: relative;
  `;
  modalHeader.innerHTML = `
    <h3 class="modal-title" style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 600;">${title}</h3>
    ${showCloseButton ? '<button class="modal-close-btn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>' : ''}
  `;

  // Modal body
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  modalBody.style.cssText = `
    padding: 24px;
  `;

  // Handle content - can be string or element
  if (typeof content === 'string') {
    modalBody.innerHTML = content;
  } else if (content instanceof Element) {
    modalBody.appendChild(content);
  } else {
    console.error('CRITICAL ERROR: Invalid content type for modal');
    modalBody.innerHTML = '<p>Error loading modal content</p>';
  }

  // Assemble modal
  modalContentWrapper.appendChild(modalHeader);
  modalContentWrapper.appendChild(modalBody);
  modalDialog.appendChild(modalContentWrapper);
  modalOverlay.appendChild(modalDialog);
  modalContainer.appendChild(modalOverlay);

  console.log('CRITICAL: Modal DOM structure created and appended');

  // CRITICAL FIX: Ensure modal is visible immediately
  modalContainer.style.pointerEvents = 'auto';
  modalContainer.style.display = 'block';
  modalOverlay.style.display = 'flex';

  // Create modal object with methods
  const modal = {
    element: modalOverlay,
    content: modalBody,
    close: () => {
      console.log('CRITICAL: Closing modal');
      if (modalOverlay?.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
      }
      // CRITICAL FIX: Hide container if no more modals
      if (modalContainer?.children.length === 0) {
        modalContainer.style.display = 'none';
        modalContainer.style.pointerEvents = 'none';
      }
      activeModal = null;
      modalCreationInProgress = false;
    }
  };

  // Set as active modal
  activeModal = modal;
  modalCreationInProgress = false;

  // Event listeners
  if (showCloseButton) {
    const closeBtn = modalHeader.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', modal.close);
    }
  }

  if (closeOnClickOutside) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modal.close();
      }
    });
  }

  // Handle escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.close();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  console.log('CRITICAL: Modal created successfully, returning modal object');

  // CRITICAL FIX: Force display update
  requestAnimationFrame(() => {
    console.log('CRITICAL: Modal should now be visible');
    console.log('CRITICAL: Modal container display:', modalContainer.style.display);
    console.log('CRITICAL: Modal overlay display:', modalOverlay.style.display);
  });

  return modal;
}

/**
 * Close all modals
 */
export function closeAllModals() {
  if (activeModal) {
    activeModal.close();
  }
}

/**
 * Check if a modal is currently open
 */
export function isModalOpen() {
  return activeModal !== null;
}

// FIXED: Cleanup function for memory management
export function cleanupAllModals() {
  modalCache.activeModals.forEach(({ cleanup }) => {
    cleanup.forEach(fn => fn());
  });
  modalCache.activeModals.clear();
  modalCache.overlay = null;
  activeModal = null;
}
