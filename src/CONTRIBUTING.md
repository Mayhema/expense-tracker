# Expense Tracker - Developer Guide

## Project Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Modules

- **appState.js**: Central state management for the entire application
- **fileManager.js**: Handles file operations, merging, and storage
- **chartManager.js**: Chart rendering and visualization with Chart.js
- **fileHandler.js**: File parsing, format detection, and signature generation
- **transactionManager.js**: Transaction processing, display, and filtering
- **categoryManager.js**: Category and subcategory management
- **categoryMapping.js**: Auto-categorization and description-to-category mapping
- **mappingsManager.js**: Format mapping storage, retrieval, and management
- **modalManager.js**: Modal dialog system for all application modals
- **headerMapping.js**: Column mapping for uploaded files
- **uiManager.js**: UI utilities, toast notifications, and DOM manipulation

### Data Flow

1. User uploads a file → `fileHandler.js` detects format and parses it
2. Application generates signatures → `mappingsManager.js` checks for existing formats
3. User maps columns or auto-mapping is applied → Format stored for future use
4. File is merged into AppState → `transactionManager.js` processes transactions
5. `categoryMapping.js` automatically applies categories based on descriptions
6. `renderTransactions()` updates UI and triggers chart updates via `updateChartsWithCurrentData()`

## Category System

The category system supports a hierarchical structure:

```javascript
{
  "Food": {
    "color": "#FF6384",
    "subcategories": {
      "Groceries": "#FF9999",
      "Restaurants": "#FF6666"
    }
  },
  "Transport": "#36A2EB"
}
```

Categories can be either:
1. Simple (string color value)
2. Complex (object with color and subcategories)

## File Signature System

The application uses multiple signature types:

- **formatSig**: Based on file structure (for format recognition)
- **contentSig**: Based on file contents (for duplicate detection)
- **mappingSig**: Ties header mapping to a file format (includes currency)

## Transaction System

Transactions have the following structure:
```javascript
{
  "date": "2023-01-15",         // ISO date format
  "description": "Grocery store", // Transaction description
  "income": null,               // Income amount (if applicable)
  "expenses": 45.99,            // Expense amount (if applicable)
  "category": "Food",           // User-assigned category
  "subcategory": "Groceries",   // Optional subcategory
  "fileName": "bank_statement.xlsx", // Source file
  "currency": "USD",            // Transaction currency
  "edited": true,               // Whether it's been edited
  "originalData": {             // Original values if edited
    "description": "Store",
    "expenses": 45.00
  }
}
```

## Modal System

The application uses a centralized modal system:
- `showModal()` creates and manages modal dialogs
- Modals support custom sizing based on content needs
- The file preview modal adapts to column count

## Chart Rendering System

The chart system uses Chart.js with several enhancements:
- **Mixed chart types**: Timeline chart combines bars and lines
- **Dynamic resizing**: Charts adjust to container size
- **Toggle visibility**: Charts can be hidden/shown
- **Period selection**: Data can be filtered by time period

## Known Challenges

### XML File Handling
XML files require special treatment:
- Header and data rows often have the same index
- Complex nested structures require recursive parsing
- Multiple XML formats must be supported

### Date Parsing
The application handles multiple date formats:
- Excel numeric dates (e.g., 44927 = 2023-01-01)
- ISO strings (YYYY-MM-DD)
- Various localized formats (DD/MM/YYYY, MM/DD/YYYY)

## Testing

### Manual Testing Checklist
1. Upload XML, XLSX, and CSV files to verify parsing
2. Test format recognition when uploading similar files
3. Verify chart rendering with different data sets
4. Test category assignment and filtering
5. Check auto-categorization with new transactions
6. Verify transaction editing and reverting functionality
7. Test currency selection and display

## Debugging Tools

The application includes several debugging tools:
- `debugMergedFiles()`: Displays current merged files data
- `debugSignatures()`: Shows file signatures and format mappings
- `inspectTransactionData()`: Displays transaction data

## Coding Standards

### File Organization
- Each file should focus on a single responsibility
- Keep files under 400 lines
- Use clear, descriptive file names

### Function Design
- Functions should do one thing well
- Use descriptive names (verb + noun)
- Add JSDoc comments for public functions
- Keep functions under 50 lines if possible

### Error Handling
- Use try/catch blocks for critical operations
- Provide meaningful error messages
- Log errors with context information
- Handle edge cases gracefully

## Performance Best Practices

- Batch DOM updates using document fragments
- Use throttle/debounce for frequent events
- Limit chart data points (max 500)
- Use pagination for large transaction lists

## Common Issues and Solutions

1. **Charts not rendering**: Check date formats and validate data
2. **Format not recognized**: Verify signature generation matches expected format
3. **Missing modal elements**: Ensure DOM elements are created before accessing
4. **Excel dates incorrect**: Use proper Excel date conversion (serial number to date)
5. **Duplicate mappings**: Clear browser storage and reset mappings

## Adding New Features

1. Identify which module should contain the feature
2. Update state management in AppState if needed
3. Add UI components in appropriate modules
4. Implement business logic
5. Connect UI to logic via event handlers
6. Add documentation and error handling

## Repository Structure
