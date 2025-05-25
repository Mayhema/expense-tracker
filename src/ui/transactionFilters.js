// Add this new file to handle date format conversions

/**
 * Converts a date string from one format to another
 * @param {string} dateStr - The date string to convert
 * @param {string} fromFormat - The current format ('iso' for YYYY-MM-DD or 'local' for DD/MM/YYYY)
 * @param {string} toFormat - The target format ('iso' for YYYY-MM-DD or 'local' for DD/MM/YYYY)
 * @returns {string} The converted date string
 */
export function convertDateFormat(dateStr, fromFormat = 'iso', toFormat = 'local') {
  if (!dateStr) return '';

  try {
    let date;

    // Parse input date based on format
    if (fromFormat === 'iso') {
      // ISO format: YYYY-MM-DD
      date = new Date(dateStr);
    } else if (fromFormat === 'local') {
      // Local format: DD/MM/YYYY
      const [day, month, year] = dateStr.split('/');
      date = new Date(year, month - 1, day);
    } else {
      // Try to parse as is
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr;

    // Format output date
    if (toFormat === 'iso') {
      // ISO format: YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } else if (toFormat === 'local') {
      // Local format: DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  } catch (e) {
    console.error(`Error converting date format for "${dateStr}":`, e);
    return dateStr;
  }
}

/**
 * Parse date input value in DD/MM/YYYY format to a Date object
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
export function parseDateInput(dateStr) {
  if (!dateStr) return null;

  try {
    // Handle different formats
    if (dateStr.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else if (dateStr.includes('-')) {
      // YYYY-MM-DD format (ISO)
      return new Date(dateStr);
    } else {
      return new Date(dateStr);
    }
  } catch (e) {
    console.error(`Error parsing date "${dateStr}":`, e);
    return null;
  }
}

/**
 * Format a date string to DD/MM/YYYY format for display
 * @param {string} dateStr - Date string in ISO format
 * @returns {string} Formatted date string
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
    console.error(`Error formatting date: ${dateStr}`, e);
    return dateStr;
  }
}

/**
 * Initialize date input filters with proper formatting
 */
export function initializeDateFilters() {
  const startDateInput = document.getElementById('filterStartDate');
  const endDateInput = document.getElementById('filterEndDate');

  if (startDateInput) {
    startDateInput.addEventListener('change', (e) => {
      // Display the date in DD/MM/YYYY format if a date was selected
      if (e.target.value) {
        const formattedDate = formatDateForDisplay(e.target.value);
        e.target.setAttribute('data-display-value', formattedDate);
        // Create or update a visible display element
        let displayEl = document.getElementById('startDateDisplay');
        if (!displayEl) {
          displayEl = document.createElement('span');
          displayEl.id = 'startDateDisplay';
          displayEl.style.marginLeft = '10px';
          startDateInput.parentNode.appendChild(displayEl);
        }
        displayEl.textContent = formattedDate;
      }
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', (e) => {
      // Display the date in DD/MM/YYYY format if a date was selected
      if (e.target.value) {
        const formattedDate = formatDateForDisplay(e.target.value);
        e.target.setAttribute('data-display-value', formattedDate);
        // Create or update a visible display element
        let displayEl = document.getElementById('endDateDisplay');
        if (!displayEl) {
          displayEl = document.createElement('span');
          displayEl.id = 'endDateDisplay';
          displayEl.style.marginLeft = '10px';
          endDateInput.parentNode.appendChild(displayEl);
        }
        displayEl.textContent = formattedDate;
      }
    });
  }
}
