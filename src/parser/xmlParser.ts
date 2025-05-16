import { Transaction } from '../transaction';
import * as xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';

interface XmlTransaction {
    date: string[];
    description: string[];
    amount: string[];
}

export class XmlParser {
    parse(xmlData: string): Transaction[] {
        try {
            if (!this.validate(xmlData)) {
                console.error('XML validation failed.');
                return [];
            }

            let transactions: Transaction[] = [];
            xml2js.parseString(xmlData, (err: Error | null, result: any) => {
                if (err) {
                    console.error('Error parsing XML:', err);
                    return;
                }

                if (result?.transactions?.transaction) {
                    transactions = result.transactions.transaction.map((item: XmlTransaction) => ({
                        id: uuidv4(),
                        date: item.date[0],
                        description: item.description[0],
                        amount: parseFloat(item.amount[0]),
                    }));
                }
            });
            return transactions;
        } catch (error) {
            console.error('Error reading or parsing XML file:', error);
            return [];
        }
    }

    validate(xmlData: string): boolean {
        if (xmlData && xmlData.length > 0) {
            // Basic check if the XML data starts with the <transactions> tag
            if (xmlData.trim().startsWith('<transactions>')) {
                return true;
            } else {
                return false;
            }
        } else {
            return false; // Return false for empty or null XML data
        }
    }
}

// Helper function for parsing XML node values
function getValueFromNode(node: { value?: string }): string {
    return node?.value?.trim() ?? '';
}
