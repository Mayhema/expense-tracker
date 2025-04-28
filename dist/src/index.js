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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const excelParser_1 = __importDefault(require("./parser/excelParser"));
const xmlParser_1 = require("./parser/xmlParser");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dataDirectory = path.join(__dirname, '../data');
function main() {
    const excelFilePath = path.join(dataDirectory, 'transactions.xlsx');
    const xmlFilePath = path.join(dataDirectory, 'transactions.xml');
    // Check for Excel file
    try {
        if (fs.existsSync(excelFilePath)) {
            const excelParser = new excelParser_1.default();
            const transactions = excelParser.parse(excelFilePath);
            console.log('Parsed Excel Transactions:', transactions);
        }
    }
    catch (error) {
        console.error('Error parsing Excel file:', error);
    }
    // Check for XML file
    try {
        if (fs.existsSync(xmlFilePath)) {
            const xmlParser = new xmlParser_1.XmlParser();
            const transactions = xmlParser.parse(xmlFilePath);
            console.log('Parsed XML Transactions:', transactions);
        }
    }
    catch (error) {
        console.error('Error parsing XML file:', error);
    }
}
main();
