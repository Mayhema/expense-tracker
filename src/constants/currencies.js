/**
 * Currency definitions with symbols and codes
 */
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  CHF: { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  ILS: { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble" }
};

export const DEFAULT_CURRENCY = "USD";

/**
 * Formats a number with the appropriate currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (USD, EUR, etc.)
 * @returns {string} Formatted amount with currency symbol
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY) {
  if (!amount && amount !== 0) return '';

  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const numAmount = parseFloat(amount);

  // Format with appropriate decimals
  let formatted;
  if (currencyCode === 'JPY' || currencyCode === 'RUB') {
    // These currencies typically don't use decimal places
    formatted = Math.round(numAmount).toLocaleString();
  } else {
    formatted = numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Add symbol in correct position
  if (currencyCode === 'USD' || currencyCode === 'CAD' || currencyCode === 'AUD') {
    return currency.symbol + formatted;
  } else {
    return formatted + ' ' + currency.symbol;
  }
}
