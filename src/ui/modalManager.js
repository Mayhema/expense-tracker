/**
 * Modal management module
 */

let activeModal = null;

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
 * Show a modal with the given configuration
 */
export function showModal(config) {
  const {
    title = 'Modal',
    content = '',
    size = 'medium',
    closeOnClickOutside = true,
    className = ''
  } = config;

  // Close any existing modal first
  if (activeModal) {
    activeModal.close();
  }

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  // Create modal container
  const modal = document.createElement('div');
  modal.className = `modal-container ${size} ${className}`;
  modal.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.7);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
  `;

  // Set modal size
  if (size === 'small') {
    modal.style.width = '400px';
  } else if (size === 'medium') {
    modal.style.width = '600px';
  } else if (size === 'large') {
    modal.style.width = '800px';
  } else if (size === 'xlarge') {
    modal.style.width = '1000px';
  }

  // Create modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.style.cssText = `
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
  `;

  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  titleEl.style.cssText = `
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  `;

  // FIXED: Define closeModal function before using it
  const closeModal = () => {
    // FIXED: Proper cleanup sequence
    backdrop.style.opacity = '0';
    modal.style.transform = 'scale(0.7)';

    // FIXED: Use transition end event instead of arbitrary timeout
    const handleTransitionEnd = () => {
      if (backdrop.parentNode) {
        document.body.removeChild(backdrop);
      }

      // FIXED: Clean up all event listeners
      cleanupFunctions.forEach(cleanup => cleanup());
      modalCache.activeModals.delete(modalId);

      backdrop.removeEventListener('transitionend', handleTransitionEnd);
      activeModal = null;
    };

    backdrop.addEventListener('transitionend', handleTransitionEnd, { once: true });

    // Fallback cleanup after 300ms if transition doesn't fire
    setTimeout(handleTransitionEnd, 300);
  };

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.addEventListener('click', closeModal);

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Create modal body
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.style.cssText = `
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  `;

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);

  // Add to DOM
  document.body.appendChild(backdrop);

  // Trigger animation
  requestAnimationFrame(() => {
    backdrop.style.opacity = '1';
    modal.style.transform = 'scale(1)';
  });

  const modalId = Date.now().toString();

  // FIXED: Track modal and its cleanup functions
  const cleanupFunctions = [];

  // FIXED: Track event listeners for cleanup
  if (closeOnClickOutside) {
    const backdropClickHandler = (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    };
    backdrop.addEventListener('click', backdropClickHandler);
    cleanupFunctions.push(() => backdrop.removeEventListener('click', backdropClickHandler));
  }

  // Prevent modal content clicks from bubbling to backdrop
  const modalClickHandler = (e) => {
    e.stopPropagation();
  };
  modal.addEventListener('click', modalClickHandler);
  cleanupFunctions.push(() => modal.removeEventListener('click', modalClickHandler));

  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', escapeHandler);
  cleanupFunctions.push(() => document.removeEventListener('keydown', escapeHandler));

  modalCache.activeModals.set(modalId, { modal, cleanup: cleanupFunctions });

  // Set active modal
  activeModal = { close: closeModal };

  return { close: closeModal };
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
