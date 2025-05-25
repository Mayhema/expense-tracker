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
 * Validates row indices for header and data rows
 * @param {Array<Array>} data - The file data
 * @param {string} headerRowInputId - ID of header row input
 * @param {string} dataRowInputId - ID of data row input
 * @returns {boolean} Whether indices are valid
 */
export function validateRowIndices(data, headerRowInputId = "headerRowInput", dataRowInputId = "dataRowInput") {
  const headerRowInput = document.getElementById(headerRowInputId);
  const dataRowInput = document.getElementById(dataRowInputId);

  if (!headerRowInput || !dataRowInput) {
    console.error("Row input elements not found");
    return false;
  }

  const headerRow = parseInt(headerRowInput.value, 10);
  const dataRow = parseInt(dataRowInput.value, 10);

  // Validate header row
  if (isNaN(headerRow) || headerRow < 1 || headerRow > data.length) {
    showValidationError(headerRowInput, `Header row must be between 1 and ${data.length}`);
    return false;
  }

  // Validate data row
  if (isNaN(dataRow) || dataRow < 1 || dataRow > data.length) {
    showValidationError(dataRowInput, `Data row must be between 1 and ${data.length}`);
    return false;
  }

  // Data row should be different from header row
  if (headerRow === dataRow) {
    showValidationError(dataRowInput, "Data row should be different from header row");
    return false;
  }

  // Clear any previous validation errors
  clearValidationError(headerRowInput);
  clearValidationError(dataRowInput);

  return true;
}

/**
 * Show validation error on input element
 * @param {HTMLElement} element - Input element
 * @param {string} message - Error message
 */
function showValidationError(element, message) {
  element.style.borderColor = '#dc3545';
  element.title = message;

  // Show tooltip-like error
  let errorDiv = element.parentNode.querySelector('.validation-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
      color: #dc3545;
      font-size: 12px;
      margin-top: 2px;
      display: block;
    `;
    element.parentNode.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
}

/**
 * Clear validation error on input element
 * @param {HTMLElement} element - Input element
 */
function clearValidationError(element) {
  element.style.borderColor = '';
  element.title = '';

  const errorDiv = element.parentNode.querySelector('.validation-error');
  if (errorDiv) {
    errorDiv.remove();
  }
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

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether date is valid
 */
export function validateDate(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate currency amount
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} Whether amount is valid
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return false;
  }

  const num = parseFloat(amount);
  return !isNaN(num) && isFinite(num);
}

/**
 * Validate category name
 * @param {string} categoryName - Category name to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateCategoryName(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') {
    return { isValid: false, message: 'Category name is required' };
  }

  const trimmed = categoryName.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: 'Category name cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, message: 'Category name cannot exceed 50 characters' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmed)) {
    return { isValid: false, message: 'Category name contains invalid characters' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Object} Validation result
 */
export function validateFileSize(file, maxSizeMB = 10) {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      isValid: false,
      message: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB`
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed file extensions
 * @returns {Object} Validation result
 */
export function validateFileType(file, allowedTypes = ['csv', 'xlsx', 'xls', 'xml']) {
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      message: `File type '.${fileExtension}' is not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { isValid: true, message: '' };
}
