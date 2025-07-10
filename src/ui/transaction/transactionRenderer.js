/**
 * TRANSACTION RENDERER MODULE
 *
 * Handles DOM rendering and container management for transactions.
 * Extracted from transactionManager.js for better separation of concerns.
 */

import { createAdvancedFilterSection, initializeAdvancedFilters } from '../filters/advancedFilters.js';

/**
 * Ensure transaction container exists with proper structure and remove duplicates
 */
export function ensureTransactionContainer() {
  console.log('🔍 DEBUG: ensureTransactionContainer called');

  // FIXED: Check if container already exists before removing anything
  let existingContainer = document.getElementById('transactionsSection');
  if (existingContainer) {
    console.log('CRITICAL: Transaction container already exists, verifying structure...');

    // Check if the summary element exists in the existing container
    const summaryElement = existingContainer.querySelector('#transactionSummary');
    console.log('🔍 DEBUG: Existing container has summary element:', !!summaryElement);

    if (summaryElement) {
      console.log('CRITICAL: Container and summary element both exist, reusing...');
      return existingContainer;
    } else {
      console.log('🔧 RECOVERY: Summary element missing, attempting to recreate within existing container...');

      // Try to add the summary element to the existing container
      const sectionHeader = existingContainer.querySelector('.section-header');
      if (sectionHeader) {
        const newSummary = document.createElement('div');
        newSummary.className = 'transaction-summary';
        newSummary.id = 'transactionSummary';
        newSummary.innerHTML = '<!-- Summary will be updated dynamically -->';
        sectionHeader.appendChild(newSummary);
        console.log('🔧 RECOVERY: Added summary element to existing container');
        return existingContainer;
      } else {
        console.error('❌ ERROR: Existing container missing section-header! Recreating...');
        existingContainer.remove();
        existingContainer = null;
      }
    }
  }

  // Only remove duplicates if we need to create a new container
  const existingSections = document.querySelectorAll('.transactions-section, [id*="transaction"]:not(#transactionsSection)');
  if (existingSections.length > 0) {
    console.log('🔍 DEBUG: Found', existingSections.length, 'existing sections to remove');
    existingSections.forEach(section => {
      console.log('CRITICAL: Removing duplicate transaction section:', section.className, section.id);
      section.remove();
    });
  }

  const mainContent = document.querySelector('.main-content');
  if (!mainContent) {
    console.error('CRITICAL: Main content not found');
    return null;
  }

  console.log('🔍 DEBUG: Creating new transaction section...');

  // Create ONE clean transaction section
  const section = document.createElement('div');
  section.className = 'section transactions-section';
  section.id = 'transactionsSection';
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
  console.log('CRITICAL: Created single clean transaction section');

  // Verify the summary element was created
  const summaryElement = section.querySelector('#transactionSummary');
  console.log('🔍 DEBUG: Summary element created successfully:', !!summaryElement);

  return section;
}

/**
 * Render filters section using advanced filters
 */
export function renderFiltersSection(container, transactions) {
  const filtersContainer = container.querySelector('#transactionFilters');
  if (!filtersContainer) return;

  // Use the new advanced filter section
  filtersContainer.innerHTML = createAdvancedFilterSection();

  // Initialize advanced filters
  initializeAdvancedFilters();

  console.log('CRITICAL: Advanced filters section rendered');
}

/**
 * Render transaction table with guaranteed structure and proper date sorting
 */
export function renderTransactionTable(container, transactions) {
  const tableWrapper = container.querySelector('#transactionTableWrapper');
  if (!tableWrapper) {
    console.error('CRITICAL: Table wrapper not found');
    return;
  }

  console.log(`CRITICAL: Rendering table for ${transactions.length} transactions`);

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
    console.log('CRITICAL: Rendered empty state');
    return;
  }

  // Sort transactions by date (oldest to newest) - ensure proper date parsing
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || '1900-01-01');
    const dateB = new Date(b.date || '1900-01-01');
    return dateA - dateB;
  });

  // Import table generator and generate HTML
  import('./transactionTableGenerator.js').then(module => {
    const tableHTML = module.generateTransactionTableHTML(sortedTransactions);
    tableWrapper.innerHTML = tableHTML;

    // Attach event listeners after DOM update
    setTimeout(() => {
      import('./transactionEventHandler.js').then(eventModule => {
        eventModule.attachTransactionEventListeners();
        console.log('CRITICAL: Event listeners attached');
      });
    }, 50);

    console.log(`CRITICAL: Transaction table rendered with ${sortedTransactions.length} rows (sorted by date)`);
  });
}
