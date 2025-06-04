/**
 * Date utility functions for consistent dd/mm/yyyy format across the project
 */

/**
 * Convert date from various formats to dd/mm/yyyy
 * @param {string|Date} dateInput - Input date in any format
 * @returns {string} Date in dd/mm/yyyy format
 */
export function formatDateToDDMMYYYY(dateInput) {
  if (!dateInput) return '';

  let date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    // Handle various input formats
    if (dateInput.includes('/')) {
      // Already in dd/mm/yyyy or mm/dd/yyyy format
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        // Assume dd/mm/yyyy if day > 12, otherwise try to detect
        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);

        if (first > 12) {
          // Definitely dd/mm/yyyy
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (second > 12) {
          // Definitely mm/dd/yyyy, convert to dd/mm/yyyy
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        } else {
          // Ambiguous, assume dd/mm/yyyy
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    } else if (dateInput.includes('-')) {
      // ISO format yyyy-mm-dd
      date = new Date(dateInput);
    } else {
      // Try parsing as is
      date = new Date(dateInput);
    }
  } else {
    return '';
  }

  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Convert dd/mm/yyyy to ISO format (yyyy-mm-dd) for internal use
 * @param {string} ddmmyyyy - Date in dd/mm/yyyy format
 * @returns {string} Date in ISO format
 */
export function convertDDMMYYYYToISO(ddmmyyyy) {
  if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return '';

  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return '';
  }

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

/**
 * Parse date input in dd/mm/yyyy format
 * @param {string} dateStr - Date string in dd/mm/yyyy format
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export function parseDDMMYYYY(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get current date in dd/mm/yyyy format
 * @returns {string} Current date in dd/mm/yyyy format
 */
export function getCurrentDateDDMMYYYY() {
  return formatDateToDDMMYYYY(new Date());
}

/**
 * Validate dd/mm/yyyy format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid dd/mm/yyyy format
 */
export function isValidDDMMYYYY(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;

  const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!ddmmyyyyRegex.test(dateStr)) return false;

  return parseDDMMYYYY(dateStr) !== null;
}
