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
// filepath: backend/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const xmlParser_1 = require("../src/parser/xmlParser");
const excelParser_1 = __importDefault(require("../src/parser/excelParser"));
const path = __importStar(require("path"));
const multer_1 = __importDefault(require("multer"));
const fs = __importStar(require("fs")); // Import the 'fs' module
const app = (0, express_1.default)();
const port = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path.join(__dirname, '../../public')));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type'));
    }
};
const upload = (0, multer_1.default)({ storage: storage, fileFilter: fileFilter });
const projectRoot = path.resolve(__dirname, '../../');
const excelFilePath = path.join(projectRoot, 'data', 'transactions.xlsx');
const xmlFilePath = path.join(projectRoot, 'data', 'transactions.xml');
app.get('/transactions', (req, res) => {
    let transactions = [];
    try {
        if (fs.existsSync(excelFilePath)) {
            const excelParser = new excelParser_1.default();
            const excelFileContent = fs.readFileSync(excelFilePath, 'utf-8');
            transactions = transactions.concat(excelParser.parse(excelFileContent));
        }
    }
    catch (error) {
        console.error('Error parsing Excel file:', error);
    }
    try {
        if (fs.existsSync(xmlFilePath)) {
            const xmlParser = new xmlParser_1.XmlParser();
            const xmlFileContent = fs.readFileSync(xmlFilePath, 'utf-8');
            transactions = transactions.concat(xmlParser.parse(xmlFileContent));
        }
    }
    catch (error) {
        console.error('Error parsing XML file:', error);
    }
    res.json(transactions);
});
app.post('/upload', upload.single('file'), (req, res, next) => {
    var _a;
    try {
        const multerReq = req;
        const file = multerReq.file;
        if (!file) {
            res.status(400).send('No file uploaded.');
            return;
        }
        // Save uploaded file to disk
        const ext = (_a = file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        let savePath = '';
        if (ext === 'xml') {
            savePath = path.join(projectRoot, 'data', 'transactions.xml');
        }
        else if (ext === 'xlsx') {
            savePath = path.join(projectRoot, 'data', 'transactions.xlsx');
        }
        if (savePath) {
            // Ensure directory exists
            fs.mkdirSync(path.dirname(savePath), { recursive: true });
            fs.writeFileSync(savePath, file.buffer);
        }
        const fileType = ext || '';
        let transactions = [];
        if (fileType === 'xml') {
            const xmlParser = new xmlParser_1.XmlParser();
            transactions = transactions.concat(xmlParser.parse(file.buffer.toString('utf-8')));
        }
        else if (fileType === 'xlsx') {
            const excelParser = new excelParser_1.default();
            transactions = transactions.concat(excelParser.parse(file.buffer.toString('utf-8')));
        }
        else {
            res.status(400).send('Unsupported file type.');
            return;
        }
        console.log('Parsed transactions:', transactions);
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    }
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
