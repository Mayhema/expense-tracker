import ExcelParser from './parser/excelParser';
import { XmlParser } from './parser/xmlParser';
import { Transaction } from './transaction';
import * as fs from 'fs';
import * as path from 'path';

const dataDirectory = path.join(__dirname, '../data');

function main() {
    const excelFilePath = path.join(dataDirectory, 'transactions.xlsx');
    const xmlFilePath = path.join(dataDirectory, 'transactions.xml');

    // Check for Excel file
    try {
        if (fs.existsSync(excelFilePath)) {
            const excelParser = new ExcelParser();
            const transactions = excelParser.parse(excelFilePath);
            console.log('Parsed Excel Transactions:', transactions);
        }
    } catch (error) {
        console.error('Error parsing Excel file:', error);
    }

    // Check for XML file
    try {
        if (fs.existsSync(xmlFilePath)) {
            const xmlParser = new XmlParser();
            const transactions = xmlParser.parse(xmlFilePath);
            console.log('Parsed XML Transactions:', transactions);
        }
    } catch (error) {
        console.error('Error parsing XML file:', error);
    }
}

main();