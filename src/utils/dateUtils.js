/**
 * Centralized date utilities for consistent date handling across the application
 */

/**
 * Supported date formats for parsing
 */
const DATE_FORMATS = {
  ISO: /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
  US: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,         // MM/DD/YYYY
  EU: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,         // DD/MM/YYYY (same pattern, context-dependent)
  DOT: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,        // DD.MM.YYYY
  DASH: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,         // DD-MM-YYYY
  REVERSE: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/     // YYYY/MM/DD
};

/**
 * Check if a value is an Excel date serial number
 * @param {any} value - Value to check
 * @returns {boolean} True if it appears to be an Excel date
 */
export function isExcelDate(value) {
  if (!value && value !== 0) return false;

  const num = parseFloat(value);
  if (isNaN(num)) return false;

  // FIXED: Only convert numbers that are actual Excel dates (from 1900 onwards)
  // Excel dates start from 1 (January 1, 1900) to around 2958465 (December 31, 9999)
  // Typical modern dates are between 25000 (1968) and 55000 (2050+)
  return num >= 25000 && num <= 100000 && Number.isInteger(num);
}

/**
 * Convert Excel date serial number to JavaScript Date
 * @param {number} excelDate - Excel date serial number
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export function excelDateToJSDate(excelDate) {
  if (!isExcelDate(excelDate)) return null;

  try {
    // FIXED: Use the correct Excel epoch and calculation
    // Excel's epoch is January 1, 1900, but Excel incorrectly considers 1900 a leap year
    // The correct calculation is: (excelDate - 1) days from January 1, 1900
    const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
    const msPerDay = 24 * 60 * 60 * 1000;

    // FIXED: Use (excelDate - 1) instead of (excelDate - 2) for correct date calculation
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * msPerDay);

    // Validate the resulting date
    if (isNaN(jsDate.getTime())) return null;

    return jsDate;
  } catch (error) {
    console.error('Error converting Excel date:', error);
    return null;
  }
}

/**
 * Convert Excel date to ISO string format (YYYY-MM-DD)
 * @param {number} excelDate - Excel date serial number
 * @returns {string|null} ISO date string or null if invalid
 */
export function excelDateToISOString(excelDate) {
  const jsDate = excelDateToJSDate(excelDate);
  if (!jsDate) return null;

  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format Excel date for preview display
 * @param {number} excelDate - Excel date serial number
 * @returns {string} Formatted preview string
 */
export function formatExcelDateForPreview(excelDate) {
  const isoDate = excelDateToISOString(excelDate);
  if (!isoDate) return String(excelDate);

  return `${isoDate} (Excel: ${excelDate})`;
}

/**
 * Validate if a string represents a valid date
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date
 */
export function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900;
}

/**
 * Parse various date formats into a standardized ISO format (YYYY-MM-DD)
 * @param {any} value - Value to parse as date
 * @returns {string|null} ISO date string or null if invalid
 */
export function parseToISODate(value) {
  if (!value && value !== 0) return null;

  // Handle Excel dates first
  if (isExcelDate(value)) {
    return excelDateToISOString(parseFloat(value));
  }

  // Convert to string for parsing
  const str = String(value).trim();
  if (!str) return null;

  // Check if already in ISO format
  if (DATE_FORMATS.ISO.test(str)) {
    if (isValidDateString(str)) return str;
  }

  // Try to parse other formats
  return parseCustomDateFormats(str);
}

/**
 * Parse custom date formats and convert to ISO
 * @param {string} dateStr - Date string to parse
 * @returns {string|null} ISO date string or null if invalid
 */
function parseCustomDateFormats(dateStr) {
  // Try specific format parsers
  return parseUSFormat(dateStr) ||
    parseEUFormat(dateStr) ||
    parseDotFormat(dateStr) ||
    parseDashFormat(dateStr) ||
    parseReverseFormat(dateStr) ||
    parseNativeFormat(dateStr);
}

/**
 * Try to parse US format: MM/DD/YYYY
 */
function parseUSFormat(dateStr) {
  const match = dateStr.match(DATE_FORMATS.US);
  if (match) {
    const [, month, day, year] = match;
    if (isValidDateComponents(year, month, day)) {
      return formatISODate(year, month, day);
    }
  }
  return null;
}

/**
 * Try to parse EU format: DD/MM/YYYY (assume if day > 12)
 */
function parseEUFormat(dateStr) {
  const match = dateStr.match(DATE_FORMATS.EU);
  if (match) {
    const [, part1, part2, year] = match;
    if (parseInt(part1) > 12 && isValidDateComponents(year, part2, part1)) {
      return formatISODate(year, part2, part1);
    }
  }
  return null;
}

/**
 * Try to parse dot format: DD.MM.YYYY
 */
function parseDotFormat(dateStr) {
  const match = dateStr.match(DATE_FORMATS.DOT);
  if (match) {
    const [, day, month, year] = match;
    if (isValidDateComponents(year, month, day)) {
      return formatISODate(year, month, day);
    }
  }
  return null;
}

/**
 * Try to parse dash format: DD-MM-YYYY
 */
function parseDashFormat(dateStr) {
  const match = dateStr.match(DATE_FORMATS.DASH);
  if (match) {
    const [, day, month, year] = match;
    if (isValidDateComponents(year, month, day)) {
      return formatISODate(year, month, day);
    }
  }
  return null;
}

/**
 * Try to parse reverse format: YYYY/MM/DD
 */
function parseReverseFormat(dateStr) {
  const match = dateStr.match(DATE_FORMATS.REVERSE);
  if (match) {
    const [, year, month, day] = match;
    if (isValidDateComponents(year, month, day)) {
      return formatISODate(year, month, day);
    }
  }
  return null;
}

/**
 * Try parsing with native Date constructor
 */
function parseNativeFormat(dateStr) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.warn('Failed to parse date string:', dateStr, error.message);
  }
  return null;
}

/**
 * Format components into ISO date string
 */
function formatISODate(year, month, day) {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Validate date components
 * @param {string} year - Year component
 * @param {string} month - Month component
 * @param {string} day - Day component
 * @returns {boolean} True if valid components
 */
function isValidDateComponents(year, month, day) {
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);

  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  // Create date and check if it's valid
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;
}

/**
 * Format date for display in different locales
 * @param {string} isoDate - ISO date string (YYYY-MM-DD)
 * @param {string} format - Display format ('US', 'EU', 'ISO')
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(isoDate, format = 'ISO') {
  if (!isoDate || !isValidDateString(isoDate)) return isoDate || '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format.toUpperCase()) {
    case 'US':
      return `${month}/${day}/${year}`;
    case 'EU':
      return `${day}/${month}/${year}`;
    case 'ISO':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Check if a column contains date-like values
 * @param {Array} columnValues - Array of values from a column
 * @returns {boolean} True if column appears to contain dates
 */
export function isDateColumn(columnValues) {
  if (!columnValues || columnValues.length === 0) return false;

  let dateCount = 0;
  let totalValidValues = 0;

  for (const value of columnValues) {
    if (value !== null && value !== undefined && value !== '') {
      totalValidValues++;

      // Check if it's an Excel date or parseable date
      if (isExcelDate(value) || parseToISODate(value)) {
        dateCount++;
      }
    }
  }

  // If at least 60% of non-empty values are dates, consider it a date column
  return totalValidValues > 0 && (dateCount / totalValidValues) >= 0.6;
}

/**
 * Get current date in ISO format
 * @returns {string} Current date as YYYY-MM-DD
 */
export function getCurrentISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validate and normalize a date value for storage
 * @param {any} value - Date value to normalize
 * @returns {{isValid: boolean, normalizedDate: string|null, originalValue: any}} Validation result
 */
export function validateAndNormalizeDate(value) {
  const result = {
    isValid: false,
    normalizedDate: null,
    originalValue: value
  };

  if (!value && value !== 0) {
    return result;
  }

  const normalizedDate = parseToISODate(value);

  if (normalizedDate) {
    result.isValid = true;
    result.normalizedDate = normalizedDate;
  }

  return result;
}

// Legacy compatibility functions (deprecated but maintained for backward compatibility)

/**
 * FIXED: Use formatDateForDisplay instead of deprecated function
 */
export function formatDateToDDMMYYYYDeprecated(dateInput) {
  console.warn('formatDateToDDMMYYYY is deprecated. Use formatDateForDisplay with EU format instead.');
  const isoDate = parseToISODate(dateInput);
  return isoDate ? formatDateForDisplay(isoDate, 'EU') : '';
}

/**
 * FIXED: Convert dd/mm/yyyy format to ISO date string with proper validation
 * @param {string} ddmmyyyy - Date in dd/mm/yyyy format
 * @returns {string|null} ISO date string or null if invalid
 */
export function convertDDMMYYYYToISO(ddmmyyyy) {
  if (!ddmmyyyy || typeof ddmmyyyy !== 'string') {
    return null;
  }

  // FIXED: Strict dd/mm/yyyy pattern matching
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = ddmmyyyy.trim().match(datePattern);

  if (!match) {
    console.warn('Date format does not match dd/mm/yyyy:', ddmmyyyy);
    return null;
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // FIXED: Validate date components
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    console.warn('Invalid date components:', { day, month, year });
    return null;
  }

  // FIXED: Create date with explicit day/month order - Use UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));

  // FIXED: Verify the date was created correctly (handles invalid dates like 31/02)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== (month - 1) || date.getUTCDate() !== day) {
    console.warn('Invalid date created:', ddmmyyyy, 'resulted in:', date);
    return null;
  }

  // FIXED: Return ISO string in YYYY-MM-DD format using UTC
  const isoString = date.toISOString().split('T')[0];
  console.log(`✓ Date conversion: ${ddmmyyyy} → ${isoString} (Day: ${day}, Month: ${month}, Year: ${year})`);

  return isoString;
}

/**
 * @deprecated Use parseToISODate instead
 */
export function parseDDMMYYYY(dateStr) {
  console.warn('parseDDMMYYYY is deprecated. Use parseToISODate instead.');
  const isoDate = parseToISODate(dateStr);
  return isoDate ? new Date(isoDate) : null;
}

/**
 * @deprecated Use getCurrentISODate instead
 */
export function getCurrentDateDDMMYYYY() {
  console.warn('getCurrentDateDDMMYYYY is deprecated. Use getCurrentISODate instead.');
  return formatDateForDisplay(getCurrentISODate(), 'EU');
}

/**
 * @deprecated Use validateAndNormalizeDate instead
 */
export function isValidDDMMYYYY(dateStr) {
  console.warn('isValidDDMMYYYY is deprecated. Use validateAndNormalizeDate instead.');
  return validateAndNormalizeDate(dateStr).isValid;
}

/**
 * FIXED: Format ISO date or Date object to dd/mm/yyyy with proper validation
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date as dd/mm/yyyy
 */
export function formatDateToDDMMYYYY(date) {
  if (!date) return '';

  let dateObj;
  if (typeof date === 'string') {
    // FIXED: Parse ISO date string using UTC to avoid timezone shifts
    if (date.includes('T')) {
      dateObj = new Date(date);
    } else {
      // For YYYY-MM-DD format, parse as UTC to avoid timezone issues
      const [yearPart, monthPart, dayPart] = date.split('-').map(num => parseInt(num, 10));
      dateObj = new Date(Date.UTC(yearPart, monthPart - 1, dayPart));
    }
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }

  // FIXED: Validate date object
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date for formatting:', date);
    return '';
  }

  // FIXED: Format as dd/mm/yyyy using UTC to maintain consistency
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const year = dateObj.getUTCFullYear();

  const formatted = `${day}/${month}/${year}`;
  console.log(`✓ Date formatting: ${date} → ${formatted}`);

  return formatted;
}
