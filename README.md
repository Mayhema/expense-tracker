# Expense Tracker

A modern, client-side expense tracker that helps you analyze and categorize your financial transactions.

## Features

- **File Import**: Import transaction data from CSV, Excel, XML files with automatic format detection
- **Format Mapping**: Save and reuse file format mappings for easier imports
- **Transaction Management**: View, filter, edit, and categorize all your transactions
- **Currency Support**: Support for multiple currencies in transactions
- **Categories Management**: Create, edit and manage expense categories with subcategories
- **Auto-Categorization**: Automatically categorize transactions based on description patterns
- **Transaction Editing**: Edit transaction details with history tracking and revert capability
- **Financial Summary**: Get a clear overview of income, expenses and balance
- **Visual Reports**: Analyze your spending with time-series and pie charts

## Key Features Added

### Modal Preview System
File upload preview now opens in a modal dialog that adapts its size to the number of columns in the file, making it easier to work with wide files.

### Enhanced Currency Support
Each file can have its own currency setting, and transactions maintain their original currency information.

### Improved Auto-categorization
The system now more accurately identifies transaction types based on content analysis and learns from your categorizations.

### Responsive Charts
All charts are now properly sized and can be toggled on/off for better customization of your dashboard view.

### Optimized Timeline Visualization
Timeline chart now uses a mixed bar/line format for better visual distinction between income and expenses.

### Improved Date Handling
The application now properly handles various date formats including Excel serial dates, ISO dates, and localized formats.

## Project Structure
```
expense-tracker/
├── src/
│   ├── components/       # UI Components
│   │   ├── charts/       # Chart-related components
│   │   ├── transactions/ # Transaction-related components
│   │   └── ui/           # General UI components
│   ├── core/             # Core app functionality
│   │   ├── state/        # State management
│   │   └── services/     # Business logic services
│   ├── parsers/          # File parsing logic
│   │   ├── excel.js
│   │   ├── xml.js
│   │   └── csv.js
│   ├── utils/            # Utility functions
│   │   ├── dates.js
│   │   ├── validation.js
│   │   └── formatting.js
│   ├── constants.js      # App constants
│   └── index.js          # Entry point
├── tests/                # Test files
│   ├── unit/
│   └── integration/
├── docs/                 # Documentation
│   ├── api.md
│   └── usage.md
└── README.md             # Project overview
```

## Getting Started

1. Clone the repository
2. Open index.html in your browser
3. Upload your transaction files using the Import button
4. Map the file format if this is a new file type
5. Start categorizing and analyzing your expenses!

## Browser Support

The application works best in modern browsers:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Privacy

All your data is processed locally in your browser. No data is sent to any server.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.

## Future Enhancements

### Machine Learning for Auto-Categorization
The current auto-categorization system uses pattern matching based on transaction descriptions. A future enhancement could implement machine learning capabilities to improve categorization accuracy by:
- Learning from user categorization patterns
- Recognizing complex relationships between transaction attributes
- Using embedded ML models that keep all processing local for privacy
- Supporting incremental learning as more transactions are categorized
