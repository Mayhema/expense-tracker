/**
 * Formats a date string to DD/MM/YYYY format
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Date in DD/MM/YYYY format
 */
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateStr;
  }
}

/**
 * Parses a date string in various formats into a Date object
 *
 * @param {string} dateStr - Date string in DD/MM/YYYY or YYYY-MM-DD format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export function parseDateString(dateStr) {
  if (!dateStr) return null;

  try {
    // Check if it's in DD/MM/YYYY format
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(ddmmyyyy);

    if (match) {
      // Convert from DD/MM/YYYY to YYYY-MM-DD for Date constructor
      const [_, day, month, year] = match;
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }

    // Otherwise try standard date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Error parsing date:", e);
    return null;
  }
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 *
 * @param {Date} date - Date object to convert
 * @returns {string} Date in YYYY-MM-DD format
 */
export function toISODateString(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Checks if a string is in YYYY-MM-DD format
 *
 * @param {string} dateStr - Date string to check
 * @returns {boolean} True if in ISO format
 */
export function isISODateFormat(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Converts date from any supported format to DD/MM/YYYY
 *
 * @param {string|Date} date - Date to format
 * @returns {string} Date in DD/MM/YYYY format
 */
export function formatAnyDateToDDMMYYYY(date) {
  if (!date) return '';

  try {
    // If it's already a Date object
    if (date instanceof Date) {
      return formatDateForDisplay(toISODateString(date));
    }

    // If it's a string, check if it's ISO format
    if (typeof date === 'string') {
      if (isISODateFormat(date)) {
        return formatDateForDisplay(date);
      }

      // Try to parse it as a date and format
      const parsedDate = parseDateString(date);
      if (parsedDate) {
        return formatDateForDisplay(toISODateString(parsedDate));
      }
    }

    // If all else fails, return original
    return String(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return String(date);
  }
}
