"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
        if (xmlData && xmlData.length > 0) {
            // Basic check if the XML data starts with the <transactions> tag
            if (xmlData.trim().startsWith('<transactions>')) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false; // Return false for empty or null XML data
        }
    }
}
exports.XmlParser = XmlParser;
