import { showToast } from "../ui/uiManager.js";
import { AppState } from "../core/appState.js";

/**
 * Validation and defensive programming helpers
 */

/**
 * Safely gets a property from an object, returning a default if not found
 * @param {Object} obj - The object to access
 * @param {string|Array} path - Property path (e.g., 'user.name' or ['user', 'name'])
 * @param {any} defaultValue - Default value if property doesn't exist
 * @returns {any} The property value or default
 */
export function safeGet(obj, path, defaultValue = null) {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined || !Object.prototype.hasOwnProperty.call(result, key)) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

/**
 * Ensures a value is an array
 * @param {any} value - Value to check
 * @returns {Array} Original array or wrapped value in array
 */
export function ensureArray(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Validates a transaction object
 * @param {Object} tx - Transaction to validate
 * @returns {Object} Object with {valid: boolean, errors: string[]}
 */
export function validateTransaction(tx) {
  const errors = [];
  let valid = true;

  // Required fields
  if (!tx) {
    return { valid: false, errors: ['Transaction is null or undefined'] };
  }

  // Check date
  if (!tx.date) {
    errors.push('Missing date');
    valid = false;
  } else {
    // Verify date is parseable
    try {
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
        valid = false;
      }
    } catch (e) {
      errors.push('Invalid date');
      valid = false;
    }
  }

  // Check amount fields
  if (!tx.income && !tx.expenses) {
    errors.push('Missing income or expenses');
    valid = false;
  }

  // Validate numeric fields
  if (tx.income && (isNaN(parseFloat(tx.income)) || !isFinite(tx.income))) {
    errors.push('Income must be a valid number');
    valid = false;
  }

  if (tx.expenses && (isNaN(parseFloat(tx.expenses)) || !isFinite(tx.expenses))) {
    errors.push('Expenses must be a valid number');
    valid = false;
  }

  return { valid, errors };
}

/**
 * Adds validation to element event listeners
 * @param {string} selector - CSS selector for elements
 * @param {string} event - Event name (e.g., 'input', 'change')
 * @param {Function} validationFn - Function that returns {valid, message}
 * @param {Function} callback - Callback to run on valid input
 */
export function addValidatedListener(selector, event, validationFn, callback) {
  const elements = document.querySelectorAll(selector);

  elements.forEach(el => {
    el.addEventListener(event, (e) => {
      const result = validationFn(e.target.value, e.target);

      if (result.valid) {
        el.style.borderColor = '';
        el.setCustomValidity('');
        if (callback) callback(e);
      } else {
        el.style.borderColor = 'red';
        el.setCustomValidity(result.message);
        el.reportValidity();
      }
    });
  });
}

/**
 * Validates row indices for header and data rows
 * @param {Array<Array>} data - The data array to validate against
 * @param {string} headerRowInputId - Optional ID for header row input
 * @param {string} dataRowInputId - Optional ID for data row input
 * @returns {boolean} True if validation passed
 */
export function validateRowIndices(data, headerRowInputId = "headerRowInput", dataRowInputId = "dataRowInput") {
  if (!data || !Array.isArray(data)) {
    console.error("Invalid data array for validation");
    return false;
  }

  // Get header and data row inputs
  const headerRowInput = document.getElementById(headerRowInputId);
  const dataRowInput = document.getElementById(dataRowInputId);

  // Safety check for null elements
  if (!headerRowInput || !dataRowInput) {
    console.warn(`Row input elements not found: headerRowInput=${!!headerRowInput}, dataRowInput=${!!dataRowInput}`);
    return false;
  }

  try {
    // Convert to numbers (1-based to 0-based index)
    const headerRowValue = headerRowInput.value ? parseInt(headerRowInput.value, 10) : null;
    const dataRowValue = dataRowInput.value ? parseInt(dataRowInput.value, 10) : null;

    const headerRowIndex = headerRowValue ? headerRowValue - 1 : null;
    const dataRowIndex = dataRowValue ? dataRowValue - 1 : null;

    // Check if values are valid numbers
    if (isNaN(headerRowIndex) || isNaN(dataRowIndex)) {
      showFieldError(headerRowInput, "Please enter valid row numbers");
      showFieldError(dataRowInput, "Please enter valid row numbers");
      return false;
    }

    // Check if indices are within bounds
    if (headerRowIndex < 0 || headerRowIndex >= data.length) {
      showFieldError(headerRowInput, `Row must be between 1 and ${data.length}`);
      return false;
    }

    if (dataRowIndex < 0 || dataRowIndex >= data.length) {
      showFieldError(dataRowInput, `Row must be between 1 and ${data.length}`);
      return false;
    }

    // Check if header row comes before data row
    if (headerRowIndex >= dataRowIndex) {
      showFieldError(headerRowInput, "Header row must come before data row");
      showFieldError(dataRowInput, "Data row must come after header row");
      return false;
    }

    // Clear any previous errors
    clearFieldError(headerRowInput);
    clearFieldError(dataRowInput);

    return true;
  } catch (error) {
    console.error("Error validating row indices:", error);
    return false;
  }
}

/**
 * Shows an error message for an input field
 * @param {HTMLElement} inputElement - The input element
 * @param {string} message - Error message
 */
function showFieldError(inputElement, message) {
  if (!inputElement) return;

  inputElement.setCustomValidity(message);
  inputElement.reportValidity();
  inputElement.classList.add("error");
}

/**
 * Clears error message from an input field
 * @param {HTMLElement} inputElement - The input element
 */
function clearFieldError(inputElement) {
  if (!inputElement) return;

  inputElement.setCustomValidity("");
  inputElement.classList.remove("error");
}
