/**
 * Validation utilities for the expense tracker application
 */

import { validateAndNormalizeDate, isValidDateString } from './dateUtils.js';

/**
 * Validates row indices for file preview
 * @param {Array<Array>} data - The data array to validate against
 * @param {string} headerInputId - ID of header row input element
 * @param {string} dataInputId - ID of data row input element
 * @returns {boolean} True if row indices are valid
 */
export function validateRowIndices(data, headerInputId = "headerRowInput", dataInputId = "dataRowInput") {
  const headerInput = document.getElementById(headerInputId);
  const dataInput = document.getElementById(dataInputId);

  if (!headerInput || !dataInput) {
    console.error("Row input elements not found");
    return false;
  }

  const headerRow = parseInt(headerInput.value, 10) - 1;
  const dataRow = parseInt(dataInput.value, 10) - 1;

  const isHeaderValid = headerRow >= 0 && headerRow < data.length;
  const isDataValid = dataRow >= 0 && dataRow < data.length;

  if (!isHeaderValid) {
    console.warn(`Header row ${headerRow + 1} is out of range (1-${data.length})`);
    showValidationError(headerInput, `Row must be between 1 and ${data.length}`);
    return false;
  }

  if (!isDataValid) {
    console.warn(`Data row ${dataRow + 1} is out of range (1-${data.length})`);
    showValidationError(dataInput, `Row must be between 1 and ${data.length}`);
    return false;
  }

  // Clear any previous validation errors
  clearValidationError(headerInput);
  clearValidationError(dataInput);

  return true;
}

/**
 * Shows validation error on an input element
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
export function showValidationError(input, message) {
  if (!input) return;

  input.style.borderColor = '#dc3545';
  input.title = message;

  // Remove any existing error message
  const existingError = input.parentNode.querySelector('.validation-error');
  if (existingError) {
    existingError.remove();
  }

  // Add error message
  const errorSpan = document.createElement('span');
  errorSpan.className = 'validation-error';
  errorSpan.style.color = '#dc3545';
  errorSpan.style.fontSize = '0.8em';
  errorSpan.textContent = message;

  input.parentNode.appendChild(errorSpan);
}

/**
 * Clears validation error from an input element
 * @param {HTMLElement} input - Input element
 */
export function clearValidationError(input) {
  if (!input) return;

  input.style.borderColor = '';
  input.title = '';

  const errorSpan = input.parentNode.querySelector('.validation-error');
  if (errorSpan) {
    errorSpan.remove();
  }
}

/**
 * Validates if a string is a valid date
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date
 */
export function isValidDate(dateStr) {
  return isValidDateString(dateStr);
}

/**
 * Validates transaction basic fields
 * @param {Object} transaction - Transaction object
 * @returns {Array<string>} Array of validation errors
 */
function validateTransactionBasics(transaction) {
  const errors = [];

  if (!transaction.id) {
    errors.push("Transaction ID is required");
  }

  if (!transaction.description || transaction.description.trim() === '') {
    errors.push("Transaction description is required");
  }

  return errors;
}

/**
 * Validates transaction date
 * @param {string} date - Date to validate
 * @returns {Array<string>} Array of validation errors
 */
function validateTransactionDate(date) {
  const errors = [];

  if (!date) {
    errors.push("Transaction date is required");
  } else {
    const dateValidation = validateAndNormalizeDate(date);
    if (!dateValidation.isValid) {
      errors.push(`Invalid date format: ${date}`);
    }
  }

  return errors;
}

/**
 * Validates transaction amounts
 * @param {Object} transaction - Transaction object
 * @returns {Array<string>} Array of validation errors
 */
function validateTransactionAmounts(transaction) {
  const errors = [];

  const hasIncome = transaction.income && parseFloat(transaction.income) > 0;
  const hasExpenses = transaction.expenses && parseFloat(transaction.expenses) > 0;

  if (!hasIncome && !hasExpenses) {
    errors.push("Transaction must have either income or expenses");
  }

  if (hasIncome && hasExpenses) {
    errors.push("Transaction cannot have both income and expenses");
  }

  if (transaction?.income && (isNaN(parseFloat(transaction.income)) || parseFloat(transaction.income) < 0)) {
    errors.push("Income must be a valid positive number");
  }

  if (transaction?.expenses && (isNaN(parseFloat(transaction.expenses)) || parseFloat(transaction.expenses) < 0)) {
    errors.push("Expenses must be a valid positive number");
  }

  return errors;
}

/**
 * Validates transaction data with enhanced date validation
 * @param {Object} transaction - Transaction object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTransaction(transaction) {
  if (!transaction) {
    return { isValid: false, errors: ["Transaction object is required"] };
  }

  const errors = [
    ...validateTransactionBasics(transaction),
    ...validateTransactionDate(transaction.date),
    ...validateTransactionAmounts(transaction)
  ];

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a unique transaction ID
 * @param {number} index - Optional index for additional uniqueness
 * @returns {string} Unique transaction ID
 */
export function generateTransactionId(index = 0) {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${index}`;
}

/**
 * Validates file upload data
 * @param {Array<Array>} data - File data to validate
 * @returns {Object} Validation result
 */
export function validateFileData(data) {
  const errors = [];

  if (!data || !Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push('File appears to be empty');
    return { isValid: false, errors };
  }

  if (data.length < 2) {
    errors.push('File must contain at least a header row and one data row');
    return { isValid: false, errors };
  }

  // Check if rows have consistent column counts
  const columnCount = data[0]?.length || 0;
  if (columnCount === 0) {
    errors.push('Header row appears to be empty');
  }

  let inconsistentRows = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i]?.length !== columnCount) {
      inconsistentRows++;
    }
  }

  if (inconsistentRows > data.length * 0.1) { // Allow up to 10% inconsistent rows
    errors.push(`Too many rows with inconsistent column counts (${inconsistentRows} out of ${data.length - 1})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: inconsistentRows > 0 ? [`${inconsistentRows} rows have inconsistent column counts`] : []
  };
}

/**
 * Validates header mapping
 * @param {Array<string>} mapping - Header mapping array
 * @returns {Object} Validation result
 */
export function validateHeaderMapping(mapping) {
  const errors = [];
  const warnings = [];

  if (!mapping || !Array.isArray(mapping)) {
    errors.push('Mapping must be an array');
    return { isValid: false, errors, warnings };
  }

  // Check for required fields
  const hasDate = mapping.includes('Date');
  const hasAmount = mapping.includes('Income') || mapping.includes('Expenses');

  if (!hasDate) {
    errors.push('At least one Date column must be mapped');
  }

  if (!hasAmount) {
    errors.push('At least one Income or Expenses column must be mapped');
  }

  // Check for duplicates (excluding "–" which means "ignore")
  const mappedFields = mapping.filter(field => field !== '–');
  const uniqueFields = new Set(mappedFields);

  if (mappedFields.length !== uniqueFields.size) {
    errors.push('Duplicate field mappings detected');
  }

  // Warnings for optional fields
  if (!mapping.includes('Description')) {
    warnings.push('No Description column mapped - transactions may be harder to identify');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates column mapping to ensure only one Date field
 * @param {Array} mapping - Current column mapping
 * @param {number} newIndex - Index of new Date field
 * @param {string} newValue - New mapping value
 * @returns {boolean} True if mapping is valid
 */
export function validateDateMapping(mapping, newIndex, newValue) {
  if (newValue !== 'Date') return true;

  // Count existing Date mappings
  const dateCount = mapping.filter((field, index) => field === 'Date' && index !== newIndex).length;

  return dateCount === 0;
}
