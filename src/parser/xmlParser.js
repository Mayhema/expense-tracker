"use strict";
let __createBinding = (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
let __setModuleDefault = (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
let __importStar = (function () {
    let ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            const ar = [];
            for (const k in o) if (Object.hasOwn(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (const k of ownKeys(mod)) if (k !== "default") __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlParser = void 0;
const xml2js = __importStar(require("xml2js"));
const uuid_1 = require("uuid");
class XmlParser {
    parse(xmlData) {
        try {
            if (!this.validate(xmlData)) {
                console.error('XML validation failed.');
                return [];
            }
            let transactions = [];
            xml2js.parseString(xmlData, (err, result) => {
                if (err) {
                    console.error('Error parsing XML:', err);
                    return;
                }
                if (result && result.transactions && result.transactions.transaction) {
                    transactions = result.transactions.transaction.map((item) => ({
                        id: (0, uuid_1.v4)(),
                        date: item.date[0],
                        description: item.description[0],
                        amount: parseFloat(item.amount[0]),
                    }));
                }
            });
            return transactions;
        }
        catch (error) {
            console.error('Error reading or parsing XML file:', error);
            return [];
        }
    }
    validate(xmlData) {
        return xmlData && xmlData.length > 0 ? xmlData.trim().startsWith('<transactions>') : false;
    }

    /**
     * Parses XML data into a 2D array format compatible with the file handler
     * @param {string} xmlData - Raw XML string
     * @returns {Array<Array>} 2D array of table-like data
     */
    parseToArray(xmlData) {
        if (!this.validate(xmlData)) {
            console.error('XML validation failed.');
            return [];
        }

        try {
            // Try to find transaction elements
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, "application/xml");

            // Check for parse errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error("Invalid XML format");
            }

            // Try multiple tag types that might represent rows
            const possibleRowTags = ['transaction', 'row', 'entry', 'record', 'item'];
            let rowElements = null;

            for (const tag of possibleRowTags) {
                const elements = xmlDoc.getElementsByTagName(tag);
                if (elements.length > 0) {
                    rowElements = elements;
                    break;
                }
            }

            if (!rowElements || rowElements.length === 0) {
                return [];
            }

            // Extract field names from the first element
            const firstElement = rowElements[0];
            const fieldNames = Array.from(firstElement.children).map(child => child.tagName);

            // Create the 2D array with header row first
            const result = [fieldNames];

            // Add data rows
            for (const rowElement of rowElements) {
                const dataRow = [];

                // For each field in our field names, extract the value
                for (const field of fieldNames) {
                    const fieldElement = rowElement.getElementsByTagName(field)[0];
                    dataRow.push(fieldElement ? fieldElement.textContent.trim() : '');
                }

                result.push(dataRow);
            }

            return result;
        } catch (error) {
            console.error('Error converting XML to array:', error);
            return [];
        }
    }
}

// Replace usage of Object.prototype.hasOwnProperty with Object.hasOwn
if (Object.hasOwn(obj, key)) {
    // Property exists
}

exports.XmlParser = XmlParser;
