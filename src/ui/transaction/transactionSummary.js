/**
 * TRANSACTION SUMMARY MODULE
 *
 * Handles transaction summary calculations and display with multi-currency support.
 * Extracted from transactionManager.js for better separation of concerns.
 */

import { CURRENCIES } from '../../constants/currencies.js';

/**
 * Update transaction summary with multi-currency support
 */
export function updateTransactionSummary(transactions) {
  console.log('🔍 DEBUG: updateTransactionSummary called with', transactions?.length, 'transactions');

  // First, let's check if the transaction section exists at all
  const transactionSection = document.getElementById('transactionsSection');
  console.log('🔍 DEBUG: transactionsSection exists:', !!transactionSection);

  if (transactionSection) {
    const sectionHeader = transactionSection.querySelector('.section-header');
    console.log('🔍 DEBUG: section-header exists:', !!sectionHeader);

    if (sectionHeader) {
      console.log('🔍 DEBUG: section-header innerHTML length:', sectionHeader.innerHTML.length);
      console.log('🔍 DEBUG: section-header contains transactionSummary:', sectionHeader.innerHTML.includes('transactionSummary'));
    }
  }

  // Try to find the element with retries for timing issues
  let summaryContainer = document.getElementById('transactionSummary');

  if (summaryContainer) {
    console.log('🔍 DEBUG: Summary element found immediately, proceeding with update');
    updateSummaryContent(summaryContainer, transactions);
    return;
  }

  // If not found, try with retries
  let retryCount = 0;
  const maxRetries = 5;

  const findElementWithRetry = () => {
    retryCount++;
    summaryContainer = document.getElementById('transactionSummary');
    console.log(`🔍 DEBUG: Attempt ${retryCount}: summaryContainer found:`, !!summaryContainer);

    // Also check if the parent structure exists
    const transactionSection = document.getElementById('transactionsSection');
    const sectionHeader = transactionSection?.querySelector('.section-header');
    console.log(`🔍 DEBUG: Attempt ${retryCount}: transactionsSection exists:`, !!transactionSection);
    console.log(`🔍 DEBUG: Attempt ${retryCount}: section-header exists:`, !!sectionHeader);

    if (summaryContainer) {
      console.log(`🔍 DEBUG: Summary element found on attempt ${retryCount}, proceeding with update`);
      updateSummaryContent(summaryContainer, transactions);
      return;
    }

    if (retryCount < maxRetries) {
      setTimeout(findElementWithRetry, 100);
      return;
    }

    console.error('❌ ERROR: transactionSummary element not found in DOM after retries');

    // Try to recreate the element if the transaction section exists
    if (transactionSection) {
      console.log('🔧 RECOVERY: Attempting to recreate summary element...');
      const sectionHeader = transactionSection.querySelector('.section-header');
      if (sectionHeader) {
        // Check if summary element already exists but wasn't found
        let existingSummary = sectionHeader.querySelector('#transactionSummary');
        if (!existingSummary) {
          // Create the summary element
          existingSummary = document.createElement('div');
          existingSummary.className = 'transaction-summary';
          existingSummary.id = 'transactionSummary';
          sectionHeader.appendChild(existingSummary);
          console.log('🔧 RECOVERY: Created new summary element');
        }

        updateSummaryContent(existingSummary, transactions);
      }
    } else {
      console.error('❌ ERROR: transactionsSection not found, cannot recreate summary');
    }
  };

  findElementWithRetry();
}

function updateSummaryContent(summaryContainer, transactions) {

  // Handle null or undefined transactions
  if (!transactions || !Array.isArray(transactions)) {
    summaryContainer.innerHTML = '<p>No transaction data available</p>';
    return;
  }

  // Handle empty transactions array
  if (transactions.length === 0) {
    summaryContainer.innerHTML = '<p>No transaction data available</p>';
    return;
  }

  // Group transactions by currency
  const currencyGroups = {};
  transactions.forEach(tx => {
    const currency = tx.currency || 'USD';
    if (!currencyGroups[currency]) {
      currencyGroups[currency] = {
        income: 0,
        expenses: 0,
        count: 0
      };
    }
    currencyGroups[currency].income += parseFloat(tx.income) || 0;
    currencyGroups[currency].expenses += parseFloat(tx.expenses) || 0;
    currencyGroups[currency].count += 1;
  });

  const currencies = Object.keys(currencyGroups);

  if (currencies.length === 1) {
    // Single currency - show traditional summary
    const currency = currencies[0];
    const data = currencyGroups[currency];
    const netBalance = data.income - data.expenses;
    const currencyIcon = CURRENCIES[currency]?.icon || '💱';

    summaryContainer.innerHTML = `
      <div class="summary-cards-row" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 1rem !important; justify-content: flex-start !important;">
        <div class="summary-card income" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(40, 167, 69, 0.1) !important; color: #28a745 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">💰</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Income</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #28a745 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${data.income.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card expenses" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(220, 53, 69, 0.1) !important; color: #dc3545 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">💸</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Expenses</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #dc3545 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${data.expenses.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card net ${netBalance >= 0 ? 'positive' : 'negative'}" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: ${netBalance >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'} !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">${netBalance >= 0 ? '📈' : '📉'}</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Net Balance</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${netBalance.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card count" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(0, 123, 255, 0.1) !important; color: #007bff !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">📊</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Transactions</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #007bff !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${data.count}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    // Multiple currencies - show by currency
    let cardsHTML = '';
    currencies.forEach(currency => {
      const data = currencyGroups[currency];
      const netBalance = data.income - data.expenses;
      const currencyIcon = CURRENCIES[currency]?.icon || '💱';

      cardsHTML += `
        <div class="summary-card currency-summary" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important; flex: 1 1 auto !important; min-width: 220px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="currency-header" style="display: flex !important; align-items: center !important; gap: 0.5rem !important; font-weight: 600 !important; color: #495057 !important; white-space: nowrap !important;">
            <span style="font-size: 1.2rem !important;">${currencyIcon}</span>
            <span>${currency}</span>
          </div>
          <div class="currency-stats" style="display: flex !important; justify-content: space-between !important; gap: 0.5rem !important; flex-wrap: wrap !important;">
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Income</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: #28a745 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${data.income.toFixed(2)}</div>
            </div>
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Expenses</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: #dc3545 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${data.expenses.toFixed(2)}</div>
            </div>
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Net</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${netBalance.toFixed(2)}</div>
            </div>
          </div>
          <div style="text-align: center !important; font-size: 0.85rem !important; color: #6c757d !important;">${data.count} transactions</div>
        </div>
      `;
    });

    summaryContainer.innerHTML = `
      <div class="summary-cards-row" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 1rem !important; justify-content: flex-start !important;">
        ${cardsHTML}
      </div>
    `;
  }

  console.log('CRITICAL: Transaction summary updated with multi-currency support');
}
