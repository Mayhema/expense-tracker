/**
 * TRANSACTION RENDERER MODULE
 *
 * Handles DOM rendering and container management for transactions.
 * Extracted from transactionManager.js for better separation of concerns.
 */

import {
  createAdvancedFilterSection,
  initializeAdvancedFilters,
} from "../filters/advancedFilters.js";

/**
 * Ensure transaction container exists with proper structure and remove duplicates
 */
export function ensureTransactionContainer() {
  // Remove ALL existing transaction sections first
  const existingSections = document.querySelectorAll(
    '.transactions-section, #transactionsSection, [id*="transaction"]'
  );
  existingSections.forEach((section) => {
    console.log(
      "CRITICAL: Removing duplicate transaction section:",
      section.className,
      section.id
    );
    section.remove();
  });

  const mainContent = document.querySelector(".main-content");
  if (!mainContent) {
    console.error("CRITICAL: Main content not found");
    return null;
  }

  // Create ONE clean transaction section
  const section = document.createElement("div");
  section.className = "section transactions-section";
  section.id = "transactionsSection";
  section.innerHTML = `
    <div class="section-header">
      <h2>💰 Transactions</h2>
      <div class="transaction-summary" id="transactionSummary">
        <!-- Summary will be updated dynamically -->
      </div>
    </div>
    <div class="section-content">
      <div id="transactionFilters" class="transaction-filters"></div>
      <div id="transactionTableWrapper" class="transaction-table-wrapper">
        <!-- Table will be rendered here -->
      </div>
    </div>
  `;

  mainContent.appendChild(section);
  console.log("CRITICAL: Created single clean transaction section");

  return section;
}

/**
 * Render filters section using advanced filters
 */
export function renderFiltersSection(container, transactions) {
  const filtersContainer = container.querySelector("#transactionFilters");
  if (!filtersContainer) return;

  // Use the new advanced filter section
  filtersContainer.innerHTML = createAdvancedFilterSection();

  // Initialize advanced filters
  initializeAdvancedFilters();

  console.log("CRITICAL: Advanced filters section rendered");
}

/**
 * Render transaction table with guaranteed structure and proper date sorting
 */
export function renderTransactionTable(container, transactions) {
  const tableWrapper = container.querySelector("#transactionTableWrapper");
  if (!tableWrapper) {
    console.error("CRITICAL: Table wrapper not found");
    return;
  }

  console.log(
    `CRITICAL: Rendering table for ${transactions.length} transactions`
  );

  if (transactions.length === 0) {
    tableWrapper.innerHTML = `
      <div class="no-transactions">
        <div class="empty-state-content">
          <h3>📄 No Transactions Available</h3>
          <p>Import transaction files using the "Upload File" button in the sidebar to see your data here.</p>
          <p>Supported formats: CSV, Excel (.xlsx, .xls), XML</p>
        </div>
      </div>
    `;
    console.log("CRITICAL: Rendered empty state");
    return;
  }

  // Sort transactions by date (oldest to newest) - ensure proper date parsing
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || "1900-01-01");
    const dateB = new Date(b.date || "1900-01-01");
    return dateA - dateB;
  });

  // Choose rendering strategy: simple full render (default) or virtualization behind a feature flag
  const useVirtualization = Boolean(globalThis.APP_FEATURES?.useVirtualization);

  if (!useVirtualization) {
    import("./transactionTableGenerator.js").then((module) => {
      const tableHTML = module.generateTransactionTableHTML(sortedTransactions);
      tableWrapper.innerHTML = tableHTML;
      setTimeout(() => {
        import("./transactionEventHandler.js").then((eventModule) => {
          eventModule.attachTransactionEventListeners();
          console.log("CRITICAL: Event listeners attached");
        });
      }, 50);
      console.log(
        `CRITICAL: Transaction table rendered with ${sortedTransactions.length} rows (sorted by date)`
      );
    });
    return;
  }

  // Virtualized rendering: render only a window of rows; expand/shrink on scroll
  Promise.all([
    import("./transactionTableGenerator.js"),
    import("../../utils/virtualize.js"),
  ]).then(([tableModule, virt]) => {
    // Base markup with container for rows
    const base = `
      <div class="transaction-table-virtualized" style="position: relative; overflow: auto; max-height: 70vh;">
        <div class="spacer-top" style="height:0px"></div>
        <div class="rows"></div>
        <div class="spacer-bottom" style="height:0px"></div>
      </div>`;
    tableWrapper.innerHTML = base;
    const scroller = tableWrapper.querySelector('.transaction-table-virtualized');
    const rowsEl = scroller.querySelector('.rows');
    const topEl = scroller.querySelector('.spacer-top');
    const bottomEl = scroller.querySelector('.spacer-bottom');

    const rowHeight = 44; // approximate row height in px
    const buffer = 8;

    function renderWindow() {
      const height = scroller.clientHeight || 400;
      const scrollTop = scroller.scrollTop || 0;
      const { start, end } = virt.computeWindow({
        itemCount: sortedTransactions.length,
        itemSize: rowHeight,
        containerHeight: height,
        scrollTop,
        buffer,
      });
      topEl.style.height = `${start * rowHeight}px`;
      bottomEl.style.height = `${Math.max(0, (sortedTransactions.length - end - 1) * rowHeight)}px`;

      // Render visible slice using existing generator for correctness
      const slice = sortedTransactions.slice(start, end + 1);
      const tableHTML = tableModule.generateTransactionTableHTML(slice);
      rowsEl.innerHTML = tableHTML;
    }

    scroller.addEventListener('scroll', () => {
      // Debounce with rAF
      if (scroller._raf) cancelAnimationFrame(scroller._raf);
      scroller._raf = requestAnimationFrame(renderWindow);
    });

    renderWindow();
    setTimeout(() => {
      import("./transactionEventHandler.js").then((eventModule) => {
        eventModule.attachTransactionEventListeners();
        console.log("CRITICAL: Event listeners attached (virtualized)");
      });
    }, 50);
    console.log(
      `CRITICAL: Virtualized table rendered for ${sortedTransactions.length} rows`
    );
  });
}
