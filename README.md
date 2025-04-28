# Expense Tracker

## Overview
The Expense Tracker project is designed to help users manage their financial transactions by parsing data from bank and credit card transactions. It supports input from both Excel and XML files, allowing for flexible data management.

## Project Structure
```
expense-tracker
├── src
│   ├── index.ts               # Entry point of the application
│   ├── parser
│   │   ├── excelParser.ts     # Parses Excel files
│   │   └── xmlParser.ts       # Parses XML files
│   ├── transaction.ts         # Defines the Transaction class
│   └── types
│       └── index.ts           # Defines data structures and interfaces
├── data
│   ├── transactions.xlsx       # Sample Excel data
│   └── transactions.xml        # Sample XML data
├── package.json                # npm configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## Setup Instructions
1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Compile TypeScript files:**
   ```
   npm run build
   ```

4. **Run the application:**
   ```
   npm start -- <path-to-input-file>
   ```
   Replace `<path-to-input-file>` with the path to either the `transactions.xlsx` or `transactions.xml` file in the `data` directory.

## Usage Examples
- To parse an Excel file:
  ```
  npm start -- data/transactions.xlsx
  ```
## JSON.parse(localStorage.getItem('fileFormatMappings'))
## localStorage.removeItem('fileFormatMappings')
## backend 
## npm install
## npm start
- To parse an XML file:
  ```
  npm start -- data/transactions.xml
  ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.