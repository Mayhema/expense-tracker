/**
 * Date utility functions
 */

/**
 * Format date for display
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return date; // Return original if invalid

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'iso':
      return dateObj.toISOString().split('T')[0];
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Parse date from various formats
 */
export function parseDate(dateString) {
  if (!dateString) return null;

  // Try parsing as-is first
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  // Try common formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      // Determine order based on format
      if (format.source.startsWith('\\d{4}')) {
        // Year first: YYYY/MM/DD or YYYY-MM-DD
        date = new Date(match[1], match[2] - 1, match[3]);
      } else {
        // Month first: MM/DD/YYYY or MM-DD-YYYY
        date = new Date(match[3], match[1] - 1, match[2]);
      }

      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Convert Excel date number to JavaScript date
 */
export function convertExcelDate(excelDate) {
  if (typeof excelDate !== 'number') return null;

  // Excel date serial number (days since 1900-01-01, with leap year bug)
  const excelEpoch = new Date(1900, 0, 1);
  const days = excelDate - 1; // Excel starts at 1, not 0
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const date = new Date(excelEpoch.getTime() + (days * millisecondsPerDay));

  // Adjust for Excel's leap year bug (1900 is not a leap year)
  if (excelDate > 59) {
    date.setTime(date.getTime() - millisecondsPerDay);
  }

  return date;
}

/**
 * Get date range from array of dates
 */
export function getDateRange(dates) {
  if (!dates || dates.length === 0) return null;

  const validDates = dates
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a - b);

  if (validDates.length === 0) return null;

  return {
    start: validDates[0],
    end: validDates[validDates.length - 1],
    range: validDates.length > 1 ?
      `${formatDate(validDates[0])} - ${formatDate(validDates[validDates.length - 1])}` :
      formatDate(validDates[0])
  };
}

/**
 * Check if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
  if (!date) return false;

  const checkDate = new Date(date);
  if (isNaN(checkDate.getTime())) return false;

  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime()) && checkDate < start) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime()) && checkDate > end) return false;
  }

  return true;
}
