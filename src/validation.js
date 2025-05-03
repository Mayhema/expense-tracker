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