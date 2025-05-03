/**
 * Utility functions shared across the application
 */

/**
 * Checks if a value could be an Excel date (numeric between 30000-50000)
 * @param {any} value - The value to test
 * @return {boolean} True if the value appears to be an Excel date
 */
export function isExcelDate(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 30000 && num < 50000;
}

/**
 * Converts an Excel numeric date to ISO string date (YYYY-MM-DD)
 * @param {number} excelDate - Excel date value
 * @return {string} ISO date string
 */
export function excelDateToString(excelDate) {
  try {
    // Excel dates are days since 1900-01-01 (except Excel incorrectly thinks 1900 was a leap year)
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    return jsDate.toISOString().split('T')[0];
  } catch (err) {
    console.error("Failed to convert Excel date:", excelDate, err);
    return String(excelDate);
  }
}

/**
 * Safely attempts to parse any value into a valid date string
 * @param {any} value - Value to convert to a date
 * @return {string|null} Date string or null if invalid
 */
export function parseToDateString(value) {
  // Handle empty values
  if (value === null || value === undefined || value === '') return null;
  
  // Handle Excel dates
  if (isExcelDate(value)) {
    return excelDateToString(parseFloat(value));
  }
  
  // Handle string dates with various formats
  if (typeof value === 'string') {
    // Try to parse the string to a date
    const dateMatch = value.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
    if (dateMatch) {
      const [_, part1, part2, part3] = dateMatch;
      
      // YYYY-MM-DD format
      if (part1.length === 4) {
        return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
      } 
      // DD/MM/YYYY or MM/DD/YYYY format
      else {
        // Heuristic: if part1 > 12, it's likely DD/MM/YYYY
        const year = part3.length === 2 ? `20${part3}` : part3;
        if (parseInt(part1) > 12) {
          return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        } else {
          return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
        }
      }
    }
    
    // Try standard date parsing for ISO and well-formed dates
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(`Failed to parse date value: ${value}`);
    }
  }
  
  // For JS Date objects
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  return null;
}

/**
 * Determines whether white or black text offers better contrast on the given color
 * @param {string} hexColor - Hex color code (e.g. "#FF5500")
 * @returns {string} Either "white" or "black" for best contrast
 */
export function getContrastColor(hexColor) {
  if (!hexColor) return 'black';

  // Convert hex to RGB
  let r, g, b;
  if (hexColor.startsWith('#')) {
    hexColor = hexColor.substr(1);
  }

  if (hexColor.length === 3) {
    r = parseInt(hexColor.charAt(0) + hexColor.charAt(0), 16);
    g = parseInt(hexColor.charAt(1) + hexColor.charAt(1), 16);
    b = parseInt(hexColor.charAt(2) + hexColor.charAt(2), 16);
  } else {
    r = parseInt(hexColor.substr(0, 2), 16);
    g = parseInt(hexColor.substr(2, 2), 16);
    b = parseInt(hexColor.substr(4, 2), 16);
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? 'black' : 'white';
}