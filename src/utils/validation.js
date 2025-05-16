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
    if (result === null || result === undefined || !Object.hasOwn(result, key)) {
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
    // Verify date is parsable
    try {
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
        valid = false;
      }
    } catch (e) {
      errors.push(`Invalid date: ${e.message}`);
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
 * Validates that row indices are within bounds
 * @param {Array<Array>} data - The file data
 * @param {string} headerRowInputId - ID of header row input element
 * @param {string} dataRowInputId - ID of data row input element
 * @returns {boolean} True if indices are valid
 */
export function validateRowIndices(data, headerRowInputId = "headerRowInput", dataRowInputId = "dataRowInput") {
  try {
    if (!data || data.length === 0) return false;

    const headerRowInput = document.getElementById(headerRowInputId);
    const dataRowInput = document.getElementById(dataRowInputId);

    if (!headerRowInput || !dataRowInput) return false;

    const headerRowIndex = parseInt(headerRowInput.value, 10);
    const dataRowIndex = parseInt(dataRowInput.value, 10);

    // Check if values are valid numbers
    if (isNaN(headerRowIndex) || isNaN(dataRowIndex)) {
      showValidationError("Row indices must be numbers");
      return false;
    }

    // Make sure indices are within bounds
    if (headerRowIndex < 1 || headerRowIndex > data.length) {
      showValidationError(`Header row must be between 1 and ${data.length}`);
      return false;
    }

    if (dataRowIndex < 1 || dataRowIndex > data.length) {
      showValidationError(`Data row must be between 1 and ${data.length}`);
      return false;
    }

    // Allow same row for XML files or when needed - remove restriction that headerRowIndex != dataRowIndex
    // This allows header and data to be the same row for XML files

    return true;
  } catch (error) {
    console.error("Error validating row indices:", error);
    return false;
  }
}

function showValidationError(message) {
  console.warn("Validation error:", message);

  // Import showToast dynamically to avoid circular dependencies
  import("../ui/uiManager.js").then(module => {
    if (typeof module.showToast === 'function') {
      module.showToast(message, "warning");
    }
  }).catch(() => {
    // Fallback if import fails
    alert(message);
  });
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

/**
 * Validates an object against required fields
 * @param {Object} obj - The object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {boolean} True if validation passed
 */
export function validateObject(obj, requiredFields) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(obj, field)) {
      return false;
    }
  }

  return true;
}

// Fix exception handling
export function validateData(data) {
  try {
    if (!data) {
      return { valid: false, error: "No data provided" };
    }

    // More validation logic here
    return { valid: true, data };
  } catch (error) {
    console.error("Validation error:", error);
    return { valid: false, error: `Validation failed: ${error.message}` };
  }
}
