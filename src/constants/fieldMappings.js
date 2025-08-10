/**
 * Available transaction fields for mapping
 */
export const TRANSACTION_FIELDS = [
  "Date",
  "Description",
  "Category",
  "Subcategory",
  "Income",
  "Expenses",
  "Balance",
  "Currency",
  "Reference",
  "Notes",
  "Account",
  "Payee",
  "Check Number",
  "Transaction ID",
];

/**
 * Common field patterns for auto-detection
 */
export const FIELD_PATTERNS = {
  Date: /date|day|time|datum|fecha|תאריך|день/i,
  Description:
    /desc|note|memo|detail|comment|text|narrative|beschreibung|descripcion|תאור|פרטים/i,
  Income: /income|credit|deposit|revenue|in|receipt|einnahmen|ingreso|זכות/i,
  Expenses: /expense|debit|cost|payment|out|withdrawal|ausgaben|gasto|חובה/i,
  Category: /category|type|class|gruppe|categoria|קטגוריה/i,
  Subcategory: /subcategory|subtype|subclass|untergruppe|subcategoria/i,
  Balance: /balance|total|sum|saldo|equilibrio|יתרה/i,
  Currency: /currency|curr|money|währung|moneda|מטבע/i,
  Reference: /ref|reference|referenz|referencia|אסמכתא/i,
  Notes: /notes|comments|remarks|notizen|notas|הערות/i,
  Account: /account|acc|konto|cuenta|חשבון/i,
  Payee: /payee|vendor|supplier|empfänger|beneficiario|נמען/i,
  "Check Number": /check|cheque|scheck|cheque/i,
  "Transaction ID": /id|transaction.?id|trans.?id|identifier/i,
};

/**
 * Required fields for a valid transaction
 */
export const REQUIRED_FIELDS = ["Date"];

/**
 * Monetary fields that should be treated as numbers
 */
export const MONETARY_FIELDS = ["Income", "Expenses", "Balance"];

/**
 * Auto-detect field type based on header text
 */
export function autoDetectFieldType(headerText) {
  if (!headerText) return "–";

  const text = String(headerText).toLowerCase().trim();

  for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
    if (pattern.test(text)) {
      return field;
    }
  }

  return "–";
}

/**
 * Validate if a transaction has required fields
 */
export function validateTransaction(transaction) {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (!transaction[field.toLowerCase()]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // At least one monetary field should have a value
  const hasMonetaryValue = MONETARY_FIELDS.some((field) => {
    const value = parseFloat(transaction[field.toLowerCase()]) || 0;
    return value !== 0;
  });

  if (!hasMonetaryValue) {
    errors.push(
      "Transaction must have at least one monetary value (Income, Expenses, or Balance)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
