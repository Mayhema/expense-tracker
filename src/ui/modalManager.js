/**
 * Modal management module
 */

let activeModal = null;
let modalCreationInProgress = false;
// Maintain a stack of open modals to support stacking (parent stays open behind child)
const modalStack = [];

// FIXED: Cache frequently accessed DOM elements
const modalCache = {
  overlay: null,
  activeModals: new Map(),
  eventListeners: new Map(),
};

function getModalOverlay() {
  // FIXED: Cache the overlay element
  if (!modalCache.overlay) {
    modalCache.overlay = document.getElementById("modalOverlay");
    if (!modalCache.overlay) {
      const overlay = document.createElement("div");
      overlay.id = "modalOverlay";
      overlay.className = "modal-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      `;
      document.body.appendChild(overlay);
      modalCache.overlay = overlay;
    }
  }
  return modalCache.overlay;
}

// Helper: lock body scroll
function lockBodyScroll() {
  if (!document.body.classList.contains('modal-open')) {
    const previousScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add('modal-open');
    document.body.dataset.prevScroll = String(previousScrollY);
    document.body.style.top = `-${previousScrollY}px`;
    document.body.style.width = '100%';
  }
}

// Helper: unlock body scroll
function unlockBodyScrollIfLast(modalContainer) {
  if (modalContainer && modalContainer.children.length > 0) return; // still modals
  if (document.body.classList.contains('modal-open')) {
    const prev = parseInt(document.body.dataset.prevScroll || '0', 10) || 0;
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    document.body.style.width = '';
    delete document.body.dataset.prevScroll;
    // In JSDOM tests window.scrollTo is not implemented; guard to prevent noisy errors
    try {
      if (typeof window.scrollTo === 'function') {
        window.scrollTo(0, prev);
      } else {
        // No-op in non-browser environments
      }
    } catch (e) {
      // Swallow to avoid polluting test output; it's safe to ignore restore failures
    }
  }
}

// Helper: create element with styles & classes
function createElement(tag, { className = '', styles = '', html = '' } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (styles) el.style.cssText = styles;
  if (html) el.innerHTML = html;
  return el;
}

/**
 * Show a modal with the given options
 */
export function showModal(options = {}) {
  // FIXED: Prevent multiple modals from being created simultaneously
  if (modalCreationInProgress) {
    console.log("CRITICAL: Modal creation already in progress, skipping...");
    return activeModal;
  }

  // Enter creation critical section
  modalCreationInProgress = true;

  console.log("CRITICAL: showModal called with options:", options);

  // Optionally keep previous modal (allow stacking)
  const {
    title = "Modal",
    content = "",
    size = "medium",
    closeOnClickOutside = true,
    showCloseButton = true,
    keepPrevious = false,
  } = options;

  // If stacking not requested, close any active modal first
  if (activeModal && !keepPrevious) {
    console.log("CRITICAL: Closing existing modal before creating new one");
    try {
      activeModal.close();
    } catch (e) {
      console.warn("Failed to close existing modal:", e);
    }
    activeModal = null;
  }

  // CRITICAL FIX: Ensure modal container exists and is properly styled
  let modalContainer = document.getElementById("modalContainer");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "modalContainer";
    modalContainer.className = "modal-container";
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
    console.log("CRITICAL: Created modal container");
  } else {
    // CRITICAL FIX: Ensure existing container is properly visible
    modalContainer.style.pointerEvents = "auto";
    modalContainer.style.display = "block";
    console.log("CRITICAL: Using existing modal container");
  }

  // Create modal overlay
  const modalOverlay = createElement('div', {
    className: 'modal-overlay',
    styles: `
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
      z-index: 10001;`
  });
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');

  // Create modal dialog
  const modalDialog = createElement('div', { className: `modal-dialog modal-${size}` });
  // Layout: dialog acts as a column container with inner body handling scroll
  // Use a safe viewport width minus margins to avoid triggering horizontal scrollbars
  let maxWidth;
  if (size === "xlarge") {
    maxWidth = "min(1100px, calc(100vw - 40px))";
  } else if (size === "large") {
    maxWidth = "min(900px, calc(100vw - 40px))";
  } else {
    maxWidth = "600px";
  }
  modalDialog.style.cssText = `
    background-color: white;
    border-radius: 8px;
    max-width: ${maxWidth};
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
    overflow: hidden; /* prevent horizontal scroll at dialog level */
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 10002;
  `;

  // Create modal content structure
  const modalContentWrapper = createElement('div', {
    className: 'modal-content',
    styles: `display:flex;flex-direction:column;flex:1 1 auto;min-height:0;overflow:hidden;`
  });

  // Modal header
  const modalHeader = createElement('div', {
    className: 'modal-header',
    styles: `padding:20px 24px 0 24px;border-bottom:1px solid #eee;position:relative;flex-shrink:0;`,
    html: `<h3 class="modal-title" style="margin:0 0 16px 0;font-size:1.25rem;font-weight:600;">${title}</h3>${showCloseButton ? '<button class="modal-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>' : ''}`
  });

  // Modal body
  const modalBody = createElement('div', {
    className: 'modal-body',
    styles: `padding:24px;flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;width:100%;`
  });

  // Handle content - can be string or element
  if (typeof content === "string") {
    modalBody.innerHTML = content;
  } else if (content instanceof Element) {
    modalBody.appendChild(content);
  } else {
    console.error("CRITICAL ERROR: Invalid content type for modal");
    modalBody.innerHTML = "<p>Error loading modal content</p>";
  }

  // Assemble modal
  modalContentWrapper.appendChild(modalHeader);
  modalContentWrapper.appendChild(modalBody);
  modalDialog.appendChild(modalContentWrapper);
  modalOverlay.appendChild(modalDialog);
  modalContainer.appendChild(modalOverlay);

  console.log("CRITICAL: Modal DOM structure created and appended");

  // CRITICAL FIX: Ensure modal is visible immediately
  modalContainer.style.pointerEvents = "auto";
  modalContainer.style.display = "block";
  modalOverlay.style.display = "flex";

  // Lock background scrolling
  lockBodyScroll();

  const modal = {
    element: modalOverlay,
    content: modalBody,
    close: () => {
      console.log("CRITICAL: Closing modal");
      if (modalOverlay?.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
      }
    // Remove this modal from the stack
    const idx = modalStack.indexOf(modal);
    if (idx !== -1) modalStack.splice(idx, 1);
      // CRITICAL FIX: Hide container if no more modals
      if (modalContainer?.children.length === 0) {
        modalContainer.style.display = "none";
        modalContainer.style.pointerEvents = "none";
      }
      unlockBodyScrollIfLast(modalContainer);
    // Restore previous modal as active if any remains
    activeModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
      modalCreationInProgress = false;
    },
  };

  // Set as active modal
  activeModal = modal;
  modalStack.push(modal);
  modalCreationInProgress = false;

  // Event listeners
  if (showCloseButton) {
    const closeBtn = modalHeader.querySelector(".modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", modal.close);
    }
  }

  if (closeOnClickOutside) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modal.close();
      }
    });
  }

  // Handle escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      modal.close();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  // Prevent wheel/touch scroll from bubbling to body (Chrome background scroll issue)
  modalBody.addEventListener('wheel', (e) => {
    // Allow default scrolling inside modalBody but stop propagation so body doesn't scroll when at edges
    e.stopPropagation();
  }, { passive: true });
  modalBody.addEventListener('touchmove', (e) => {
    e.stopPropagation();
  }, { passive: true });

  // Basic focus trap
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusable = () => Array.from(modalDialog.querySelectorAll(focusableSelectors)).filter(el => !el.disabled && el.offsetParent !== null);
  const handleTab = (e) => {
    if (e.key !== 'Tab') return;
    const nodes = focusable();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  modalDialog.addEventListener('keydown', handleTab);
  // Focus first element after render
  requestAnimationFrame(() => {
    const nodes = focusable();
    (nodes[0] || modalDialog).focus({ preventScroll: true });
  });

  console.log("CRITICAL: Modal created successfully, returning modal object");

  // CRITICAL FIX: Force display update
  requestAnimationFrame(() => {
    console.log("CRITICAL: Modal should now be visible");
    console.log(
      "CRITICAL: Modal container display:",
      modalContainer.style.display
    );
    console.log("CRITICAL: Modal overlay display:", modalOverlay.style.display);
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
    cleanup.forEach((fn) => fn());
  });
  modalCache.activeModals.clear();
  modalCache.overlay = null;
  activeModal = null;
}
