import { Transaction } from '../transaction';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export default class ExcelParser {
    parse(fileContent: string): Transaction[] {
        try {
            const workbook = XLSX.read(fileContent, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

            const transactions: Transaction[] = rawData.map((item: any) => ({
                id: uuidv4(), // Generate a unique ID
                date: item['Date'],
                description: item['Description'],
                amount: item['Amount'],
            }));

            return transactions;
        } catch (error) {
            console.error('Error parsing Excel data:', error);
            return [];
        }
    }
}