/**
 * XML Parser for transaction data
 */

/**
 * Parse XML content to extract transaction data
 * @param {string} xmlContent - Raw XML content
 * @returns {Array<Array>} 2D array of parsed data
 */
export function parseXML(xmlContent) {
  try {
    console.log("Parsing XML content...");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing failed: ' + parseError.textContent);
    }

    // Find transaction elements (try different common element names)
    const transactionSelectors = ['transaction', 'Transaction', 'record', 'Record', 'row', 'Row'];
    let transactions = [];
    let elementName = '';

    for (const selector of transactionSelectors) {
      transactions = xmlDoc.querySelectorAll(selector);
      if (transactions.length > 0) {
        elementName = selector;
        break;
      }
    }

    if (transactions.length === 0) {
      console.warn("No transaction elements found. Trying to parse all child elements...");
      const rootElement = xmlDoc.documentElement;
      if (rootElement && rootElement.children.length > 0) {
        transactions = rootElement.children;
        elementName = 'child elements';
      }
    }

    console.log(`Found transactions using element name: ${elementName}`);
    console.log(`Found ${transactions.length} transaction elements`);

    if (transactions.length === 0) {
      throw new Error('No transaction data found in XML file');
    }

    // Extract field names from the first transaction
    const firstTransaction = transactions[0];
    const fieldNames = Array.from(firstTransaction.children).map(child => child.tagName.toLowerCase());
    console.log(`Detected field names:`, fieldNames);

    // Convert transactions to 2D array format
    const result = [];

    // Add header row
    result.push(fieldNames);
    console.log(`Added header row: [${fieldNames.join(', ')}]`);

    // Add transaction data rows
    for (const transaction of transactions) {
      const row = fieldNames.map(fieldName => {
        const element = transaction.querySelector(fieldName);
        return element ? element.textContent.trim() : '';
      });
      result.push(row);
    }

    console.log(`Extracted ${result.length} rows of data (including header)`);
    console.log(`Transaction rows: ${result.length - 1}`);
    console.log(`Sample data:`, result.slice(0, 3));

    return result;

  } catch (error) {
    console.error('Error parsing XML:', error);
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Default export for compatibility
 */
export default {
  parseXML
};
