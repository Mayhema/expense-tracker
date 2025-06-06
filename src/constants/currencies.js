/**
 * Currency definitions with symbols and names
 */
export const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', icon: '$' },
  EUR: { name: 'Euro', symbol: '€', icon: '€' },
  GBP: { name: 'British Pound', symbol: '£', icon: '£' },
  JPY: { name: 'Japanese Yen', symbol: '¥', icon: '¥' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', icon: 'C$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', icon: 'A$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', icon: 'CHF' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', icon: '¥' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', icon: 'kr' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', icon: 'kr' },
  MXN: { name: 'Mexican Peso', symbol: '$', icon: '$' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', icon: 'NZ$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', icon: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', icon: 'HK$' },
  KRW: { name: 'South Korean Won', symbol: '₩', icon: '₩' },
  TRY: { name: 'Turkish Lira', symbol: '₺', icon: '₺' },
  RUB: { name: 'Russian Ruble', symbol: '₽', icon: '₽' },
  INR: { name: 'Indian Rupee', symbol: '₹', icon: '₹' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', icon: 'R$' },
  ZAR: { name: 'South African Rand', symbol: 'R', icon: 'R' },
  PLN: { name: 'Polish Zloty', symbol: 'zł', icon: 'zł' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč', icon: 'Kč' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft', icon: 'Ft' },
  ILS: { name: 'Israeli Shekel', symbol: '₪', icon: '₪' },
  DKK: { name: 'Danish Krone', symbol: 'kr', icon: 'kr' },
  RON: { name: 'Romanian Leu', symbol: 'lei', icon: 'lei' },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв', icon: 'лв' },
  HRK: { name: 'Croatian Kuna', symbol: 'kn', icon: 'kn' },
  ISK: { name: 'Icelandic Krona', symbol: 'kr', icon: 'kr' }
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
