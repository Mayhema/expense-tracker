/**
 * Currency definitions with symbols and names
 */
export const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  MXN: { name: 'Mexican Peso', symbol: '$' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  RUB: { name: 'Russian Ruble', symbol: '₽' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft' },
  ILS: { name: 'Israeli Shekel', symbol: '₪' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  RON: { name: 'Romanian Leu', symbol: 'lei' },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв' },
  HRK: { name: 'Croatian Kuna', symbol: 'kn' },
  ISK: { name: 'Icelandic Krona', symbol: 'kr' }
};

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Get currency symbol by code
 * @param {string} currencyCode - The currency code
 * @returns {string} The currency symbol
 */
export function getCurrencySymbol(currencyCode) {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
}

/**
 * Get currency name by code
 * @param {string} currencyCode - The currency code
 * @returns {string} The currency name
 */
export function getCurrencyName(currencyCode) {
  return CURRENCIES[currencyCode]?.name || currencyCode;
}

/**
 * Format amount with currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code
 * @returns {string} Formatted amount with currency symbol
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY) {
  if (amount === null || amount === undefined || amount === '') return '';

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return amount;

  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${Math.abs(numAmount).toFixed(2)}`;
}
