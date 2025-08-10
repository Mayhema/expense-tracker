/**
 * Format a Date or ISO string in the user’s locale.
 */
export function formatLocalDate(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(navigator.language, options).format(date);
}

/**
 * Format a number as currency in the user’s locale.
 */
export function formatLocalCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
