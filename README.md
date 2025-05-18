# Expense Tracker

A modern, client-side expense tracker that helps you analyze and categorize your financial transactions.

## Features

- **File Import**: Import transaction data from CSV, Excel, XML files with automatic format detection
- **Multi-Currency Support**: Handle transactions in different currencies with proper display and summaries
- **Format Mapping**: Save and reuse file format mappings for easier imports
- **Transaction Management**: View, filter, edit, and categorize all your transactions
- **Categories & Subcategories**: Create hierarchical categories with subcategories for detailed expense tracking
- **Auto-Categorization**: Automatically categorize transactions based on description patterns
- **Transaction Editing**: Edit transaction details with history tracking and revert capability
- **Financial Summary**: Get a clear overview of income, expenses, and balance by currency
- **Visual Reports**: Analyze your spending with time-series and pie charts

## Key Capabilities

### Enhanced File Processing
- Automatic file format detection
- Smart header mapping suggestions
- Duplicate file detection
- Support for Excel date formats

### Multi-Currency Support
- Assign currency to imported files
- Currency-specific transaction tracking
- Grouped financial summaries by currency
- Support for major currency symbols

### Interactive Data Visualization
- Income vs. Expenses overview chart
- Category breakdown pie chart
- Timeline chart with customizable periods
- Dark mode support for all visualizations

### Smart Categorization
- Hierarchical category system with subcategories
- Visual category filtering buttons
- Automatic transaction categorization
- Pattern-based rules for categorization

### User Experience
- Dark/light mode with system preference detection
- Responsive design for desktop and tablet
- Local data storage for privacy
- Export capabilities for data portability

## Getting Started

1. Clone the repository
2. Open index.html in your browser
3. Upload your transaction files using the Import button
4. Map the file format if this is a new file type
5. Start categorizing and analyzing your expenses!

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
