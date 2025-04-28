// filepath: backend/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { XmlParser } from '../src/parser/xmlParser';
import ExcelParser from '../src/parser/excelParser';
import { Transaction } from '../src/transaction';
import * as path from 'path';
import multer, { Multer, FileFilterCallback } from 'multer';
import * as fs from 'fs'; // Import the 'fs' module

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};

const upload: Multer = multer({ storage: storage, fileFilter: fileFilter });

interface MulterRequest extends Request {
    file: Express.Multer.File;
}

const projectRoot = path.resolve(__dirname, '../../');
const excelFilePath = path.join(projectRoot, 'data', 'transactions.xlsx');
const xmlFilePath = path.join(projectRoot, 'data', 'transactions.xml');

app.get('/transactions', (req: Request, res: Response) => {
    let transactions: Transaction[] = [];

    try {
        if (fs.existsSync(excelFilePath)) {
            const excelParser = new ExcelParser();
            const excelFileContent = fs.readFileSync(excelFilePath, 'utf-8');
            transactions = transactions.concat(excelParser.parse(excelFileContent));
        }
    } catch (error) {
        console.error('Error parsing Excel file:', error);
    }

    try {
        if (fs.existsSync(xmlFilePath)) {
            const xmlParser = new XmlParser();
            const xmlFileContent = fs.readFileSync(xmlFilePath, 'utf-8');
            transactions = transactions.concat(xmlParser.parse(xmlFileContent));
        }
    } catch (error) {
        console.error('Error parsing XML file:', error);
    }

    res.json(transactions);
});

app.post('/upload', upload.single('file'), (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const multerReq = req as MulterRequest;
        const file = multerReq.file;

        if (!file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        // Save uploaded file to disk
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        let savePath = '';
        if (ext === 'xml') {
            savePath = path.join(projectRoot, 'data', 'transactions.xml');
        } else if (ext === 'xlsx') {
            savePath = path.join(projectRoot, 'data', 'transactions.xlsx');
        }
        if (savePath) {
            // Ensure directory exists
            fs.mkdirSync(path.dirname(savePath), { recursive: true });
            fs.writeFileSync(savePath, file.buffer);
        }

        const fileType = ext || '';
        let transactions: Transaction[] = [];

        if (fileType === 'xml') {
            const xmlParser = new XmlParser();
            transactions = transactions.concat(xmlParser.parse(file.buffer.toString('utf-8')));
        } else if (fileType === 'xlsx') {
            const excelParser = new ExcelParser();
            transactions = transactions.concat(excelParser.parse(file.buffer.toString('utf-8')));
        } else {
            res.status(400).send('Unsupported file type.');
            return;
        }

        console.log('Parsed transactions:', transactions);
        res.status(200).json(transactions);

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});