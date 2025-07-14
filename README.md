# Personal Expense Tracker

A modern, client-side personal finance management application that helps you analyze and categorize your financial transactions with privacy-first local storage.

## ✨ Features

### 📁 File Import & Processing

- **Multi-Format Support**: Import CSV, Excel (.xlsx, .xls), and XML transaction files
- **Automatic Format Detection**: Smart detection of file structure and data patterns
- **Drag & Drop Upload**: Modern file upload with drag-and-drop interface
- **Format Mapping System**: Save and reuse column mappings for different file formats
- **Duplicate Detection**: Prevents importing the same file multiple times
- **Excel Date Conversion**: Automatic conversion of Excel serial dates to readable format
- **Data Validation**: Comprehensive validation of imported data integrity

### 💰 Multi-Currency Support

- **Per-File Currency Assignment**: Each imported file can have its own currency
- **Currency-Specific Summaries**: Financial overviews grouped by currency
- **Major Currency Support**: USD, EUR, GBP, ILS with proper symbols and formatting
- **Mixed Currency Transactions**: Handle multiple currencies in one workspace

### 🏷️ Advanced Categorization System

- **Hierarchical Categories**: Support for categories with subcategories
- **Visual Category Management**: Color-coded categories with intuitive UI
- **Auto-Categorization**: Smart categorization based on transaction descriptions
- **Pattern-Based Rules**: Create rules for automatic transaction categorization
- **Category Filtering**: Quick filter transactions by category with visual buttons
- **Default Categories**: Pre-configured categories for common expense types

### 📊 Transaction Management

- **Interactive Transaction Table**: View, sort, and filter all transactions
- **Inline Editing**: Edit transaction details directly in the table
- **Edit History Tracking**: Track changes with ability to revert modifications
- **Advanced Filtering**: Filter by date range, amount, category, currency, and description
- **Bulk Operations**: Select and modify multiple transactions at once
- **Transaction Counter**: Sequential numbering for easy reference

### 📈 Visual Analytics & Reports

- **Expense Breakdown Charts**: Pie charts showing spending by category
- **Income vs Expenses**: Bar charts comparing income and expenses over time
- **Timeline Analysis**: Line charts showing spending trends across periods
- **Real-time Updates**: Charts automatically update when data changes
- **Interactive Charts**: Click and hover interactions for detailed insights
- **Export Capabilities**: Save charts and export transaction data

### 🎨 User Experience

- **Dark/Light Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Debug Mode**: Advanced debugging tools for troubleshooting
- **Toast Notifications**: User-friendly notifications for all actions
- **Modal System**: Clean modal dialogs for various operations
- **Keyboard Shortcuts**: Efficient keyboard navigation support

### 🔒 Privacy & Security

- **Local Storage Only**: All data processed and stored locally in your browser
- **No Server Communication**: Complete offline functionality
- **Data Export**: Export your data anytime in CSV format
- **Reset Functionality**: Clean reset option to start fresh

## 🚀 Getting Started

1. **Download or Clone** the repository
2. **Open** `index.html` in a modern web browser
3. **Upload** your transaction files using the "Upload" button in the sidebar
4. **Map Columns** if this is a new file format (or use auto-detection)
5. **Categorize** transactions and start analyzing your finances!

## 📁 Project Structure

```text
expense-tracker/
├── src/
│   ├── index.html                    # Main HTML file
│   ├── main.js                       # Application entry point
│   │
│   ├── core/                         # Core application logic
│   │   ├── appState.js              # Central state management
│   │   ├── eventHandlers.js         # Global event handlers
│   │   └── debugManager.js          # Debug functionality
│   │
│   ├── ui/                          # User Interface modules
│   │   ├── sidebarManager.js        # Sidebar functionality
│   │   ├── transactionManager.js    # Transaction display and editing
│   │   ├── modalManager.js          # Modal dialog system
│   │   ├── uiManager.js             # Toast notifications and UI utils
│   │   ├── fileUpload.js            # File upload and processing
│   │   ├── fileUploadModal.js       # File mapping modal
│   │   ├── fileListUI.js            # Merged files management
│   │   ├── categoryManager.js       # Category management
│   │   ├── headerMapping.js         # Column mapping logic
│   │   ├── charts.js                # Chart initialization
│   │   └── filters/
│   │       └── advancedFilters.js   # Advanced filtering system
│   │
│   ├── parsers/                     # File parsing modules
│   │   └── fileHandler.js           # Multi-format file parsing
│   │
│   ├── mappings/                    # Format mapping system
│   │   └── mappingsManager.js       # Save/load column mappings
│   │
│   ├── constants/                   # Application constants
│   │   ├── categories.js            # Default categories
│   │   ├── currencies.js            # Currency definitions
│   │   └── fieldMappings.js         # Field detection patterns
│   │
│   ├── utils/                       # Utility functions
│   │   ├── dateUtils.js             # Date parsing and formatting
│   │   ├── debug.js                 # Debug utilities
│   │   └── console-logger.js        # Console logging system
│   │
│   ├── exports/                     # Data export functionality
│   │   └── exportManager.js         # CSV export functionality
│   │
│   └── styles/                      # CSS stylesheets
│       ├── styles.css               # Main stylesheet
│       ├── transactions.css         # Transaction table styles
│       ├── filters.css              # Filter component styles
│       └── charts.css               # Chart styling
│
├── docs/                            # Documentation
│   └── CONTRIBUTING.md              # Developer guide
│
└── README.md                        # This file
```

## 🔧 Technical Features

### File Processing Engine

- **Multi-format Parser**: Unified parsing for CSV, Excel, and XML files
- **Signature Generation**: Create unique signatures for file format recognition
- **Header Detection**: Automatically detect header rows and data start positions
- **Data Validation**: Comprehensive validation of imported data

### State Management

- **Centralized AppState**: Single source of truth for application data
- **LocalStorage Integration**: Automatic persistence of all user data
- **Transaction Uniqueness**: Ensure all transactions have unique identifiers
- **Category Hierarchy**: Support for complex category relationships

### Advanced Filtering

- **Date Range Filters**: Preset and custom date range filtering
- **Multi-field Search**: Search across descriptions, categories, and amounts
- **Real-time Filtering**: Instant results as you type or select filters
- **Filter Persistence**: Remember filter settings across sessions

### Chart System

- **Chart.js Integration**: Professional charts with Chart.js library
- **Multiple Chart Types**: Pie, bar, and line charts for different insights
- **Responsive Charts**: Charts adapt to screen size and container
- **Data Synchronization**: Charts automatically update with data changes

## 🌐 Browser Support

### Fully Supported

- **Chrome** (latest)
- **Firefox** (latest)
- **Edge** (latest)
- **Safari** (latest)

### Features Used

- ES6 Modules
- LocalStorage API
- FileReader API
- Chart.js library
- Modern CSS Grid/Flexbox

## 💾 Data Management

### Storage

- **Client-side Only**: No data leaves your browser
- **LocalStorage**: Persistent storage across browser sessions
- **JSON Format**: Human-readable data storage format
- **Backup Friendly**: Easy to backup browser data

### Export Options

- **CSV Export**: Export transactions in CSV format
- **Debug Logs**: Export detailed logs for troubleshooting
- **Full Data Export**: Complete application state export

## 🐛 Debug Features

### Debug Mode

- **Debug Toggle**: Enable/disable debug mode from sidebar
- **Console Logging**: Detailed logging of all operations
- **Data Inspection**: View internal data structures
- **Performance Monitoring**: Track application performance
- **Error Tracking**: Comprehensive error logging and reporting

### Debug Tools

- **File Debugging**: Inspect merged files and their properties
- **Signature Analysis**: View file signatures and format mappings
- **Transaction Inspector**: Detailed transaction data analysis
- **Log Export**: Save console logs for external analysis
- **Application Reset**: Clean reset functionality for testing

## 🔄 Future Enhancements

### Planned Features

- **Budget Tracking**: Set and monitor spending budgets by category
- **Recurring Transaction Detection**: Identify and manage recurring payments
- **Enhanced Analytics**: More sophisticated financial analysis tools
- **Data Sync**: Optional cloud sync while maintaining privacy
- **Mobile App**: Progressive Web App (PWA) features for mobile
- **Bank Integration**: Secure bank connection APIs (when available)

### Machine Learning Integration

- **Smart Categorization**: Learn from user categorization patterns
- **Spending Predictions**: Forecast future expenses based on history
- **Anomaly Detection**: Identify unusual spending patterns
- **Recommendation Engine**: Suggest budget optimizations

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed development guidelines, coding standards, and architecture documentation.

### Development Setup

1. Clone the repository
2. Open `index.html` in a browser
3. Enable debug mode for development tools
4. Refer to CONTRIBUTING.md for detailed guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Privacy Statement

Your financial data privacy is our top priority:

- **No data collection**: We don't collect any personal or financial data
- **Local processing only**: All operations happen in your browser
- **No analytics**: No tracking or analytics are implemented
- **Open source**: Complete transparency in code and functionality

---

*Built with privacy, simplicity, and powerful functionality in mind.*
