# Expense Tracker - Developer Guide

## Project Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Modules

- **appState.js**: Central state management
- **chartManager.js**: Chart rendering and visualization
- **fileHandler.js**: File parsing and signature generation
- **transactionManager.js**: Transaction processing and display
- **categoryManager.js**: Category management and filtering
- **mappingsManager.js**: Format mapping storage and retrieval
- **uiManager.js**: UI utilities and toast notifications
- **utils.js**: Shared utility functions
- **debug.js**: Debugging tools and functions

### Data Flow

1. User uploads a file → `fileHandler.js` parses it
2. Application generates signatures → `mappingsManager.js` checks for existing formats
3. User maps columns or auto-mapping is applied → Format stored for future use
4. File is merged into AppState → `transactionManager.js` processes transactions
5. `renderTransactions()` updates UI and triggers chart updates

## File Signature System

The application uses multiple signature types to track files and formats:

- **formatSig**: Identifies file structure (for format recognition)
- **contentSig**: Identifies file contents (for duplicate detection)
- **mappingSig**: Ties a specific header mapping to a file format
- **structureSig**: Legacy signature (maintained for backward compatibility)

When modifying signature generation, ensure all signature types are updated consistently in:
- `generateFileSignature()` in fileHandler.js
- `getMappingBySignature()` in mappingsManager.js
- `saveHeadersAndFormat()` in mappingsManager.js

## Chart Rendering System

The chart system uses Chart.js with several safeguards against common issues:

- **Throttling**: Prevents too many chart updates in rapid succession
- **Canvas Management**: Ensures proper cleanup before rendering new charts
- **Error Boundaries**: Catches and logs errors without crashing the application

When modifying charts:
1. Always destroy existing chart instances before creating new ones
2. Use the chart toggle buttons for testing
3. Keep the chart debug tools accessible during development

## Known Challenges

### XML File Handling
XML files require special treatment:
- Header and data rows are often the same (index 0)
- Column structure may vary between files
- Special date format handling is required

### Date Parsing
The application handles multiple date formats:
- Excel numeric dates (e.g., 44927 = 2023-01-01)
- ISO strings (YYYY-MM-DD)
- Various localized formats (DD/MM/YYYY, MM/DD/YYYY)

## Testing

### Manual Testing Checklist
1. Upload XML and XLSX files to verify parsing
2. Verify format recognition when uploading similar files
3. Test chart rendering with different data sets
4. Test category assignment and filtering
5. Verify dark mode toggle works correctly
6. Test debug tools (Debug Files, Debug Signatures)

### Performance Testing
- Test with large files (1000+ rows)
- Test with multiple merged files (5+)
- Verify chart performance with numerous data points

## Debugging Tools

The application includes several debugging tools:
- `debug.js`: Provides window.debugMergedFiles() and window.debugSignatures()
- Chart debug mode: Toggle with debugChartsBtn
- Transaction inspector: Available through window.inspectTransactionData()

## Coding Standards

### File Organization

- Each file should focus on a single responsibility
- Keep files under 300 lines if possible
- Use clear, descriptive file names

### Function Design

- Functions should do one thing well
- Use descriptive function names (verb + noun)
- Add JSDoc comments for all public functions
- Return values consistently (avoid mixing returns)

### Variable Naming

- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Avoid abbreviations unless very common (e.g., ID, UI)

### Error Handling

- Use try/catch blocks for critical operations
- Provide meaningful error messages
- Log errors with context information
- Handle edge cases gracefully

### Performance Best Practices

- Avoid DOM manipulation in loops
- Batch DOM updates when possible
- Use debounce for frequent events (resize, scroll)
- Limit chart data points to prevent browser freezing

## Testing Strategy

- Add unit tests for core business logic
- Test edge cases and error scenarios
- Use test-driven development for complex features
- Manual testing checklist for UI components

## Debugging

- Use the built-in debug mode for charts (`setChartDebugLevel(2)`)
- Check browser console for detailed logs
- Use the transaction inspector (`window.inspectTransactionData()`)
- Look for red highlighted validation errors

## Common Issues and Solutions

1. **Charts not rendering**: Check date formats and data point count
2. **Format not recognized**: Verify signature generation algorithm
3. **Category colors not updating**: Force re-render with `renderTransactions()`
4. **Excel dates incorrect**: Ensure proper conversion via `parseToDateString()`

## Adding New Features

1. Identify which module should contain the feature
2. Update state management in AppState if needed
3. Add UI components in HTML
4. Implement business logic in appropriate module
5. Connect UI to logic via event handlers
6. Add documentation and update this guide

## Deployment

The application is designed to run as a client-side web app with no server dependencies.
All data is stored in localStorage and processed in the browser.


# Expense Tracker - Project Definitions

## Purpose
The Expense Tracker application helps users manage their expenses by uploading transaction files, categorizing transactions, and visualizing expenses. It provides intelligent features to simplify the process of managing and analyzing financial data.

## Core Functionality
1. **File Upload and Parsing**:
   - Users can upload `.xls`, `.xlsx`, or `.xml` files containing transaction data.
   - The application parses the files and extracts headers and data rows.
   - Each uploaded file is assigned a unique identifier (e.g., SHA-256 hash) to prevent duplicate uploads.

2. **Header Mapping**:
   - Users can map file headers to predefined fields (`Date`, `Income`, `Expenses`, `Description`, etc.).
   - If a file with the same header structure is uploaded again, it is automatically recognized, and the user does not need to define the headers again.

3. **File Merging**:
   - Users can merge multiple files into a unified dataset.
   - Merged files are stored in `localStorage` and can be managed (e.g., added, removed).
   - If a file is removed from the merged list, its associated transaction data is also removed.

4. **Category Management**:
   - Users can define and manage categories for transactions (e.g., `Food`, `Transport`, `Utilities`).
   - Categories are used for filtering and grouping transactions.
   - Rows with descriptions that match previously categorized rows are automatically assigned the same category.

5. **Transaction Management**:
   - Transactions are displayed in a table or list format.
   - Users can filter transactions by category or view uncategorized rows.
   - Users can assign categories to rows, and the assignments are saved persistently in `localStorage`.

6. **Visualization**:
   - A pie chart shows income vs. expenses for selected time periods (e.g., month, quarter, half-year, year).
   - A pie chart shows expenses by category for the same time periods.
   - A timeline chart shows income vs. expenses over time (e.g., by year or half-year).

7. **Smart Features**:
   - **Smart Header Mapping**:
     - The application uses AI to suggest header mappings based on the content of the file.
     - For example, columns with dates are automatically recognized as `Date`, and numeric columns are suggested as `Income` or `Expenses`.
   - **Smart Category Guessing**:
     - The application learns from user input to suggest categories for new rows based on their descriptions.

8. **Dark Mode**:
   - Users can toggle between light and dark themes.

## Future Enhancements (Version 2.0)
1. **Advanced AI Auto-Categorization**:
   - Use machine learning to predict categories for rows based on historical data and user behavior.
2. **Validation**:
   - Validate uploaded files to ensure they meet the required format and structure.
3. **User Accounts**:
   - Add user authentication to allow multiple users to manage their expenses.
4. **Export Functionality**:
   - Allow users to export merged files or transaction data in `.xls` or `.csv` formats.
5. **Mobile Responsiveness**:
   - Optimize the UI for mobile devices.

## Notes
- All major functionality must align with the definitions outlined here.
- Any new major functionality must be added to this file to ensure consistency and clarity.

# AI-Friendly Definitions for Expense Tracker

### ✅ Transaction
An object representing a row in a merged financial dataset.
```json
{
  "date": "2024-01-01",
  "description": "Grocery Store",
  "amount": "-35.99",
  "category": "Food",
  "fileName": "expenses.xlsx"
}
```

### ✅ Category
A label (with a hex color) for grouping transactions.
Stored in `AppState.categories` and localStorage.
```json
{
  "Food": "#FF6384",
  "Transport": "#36A2EB"
}
```

### ✅ Merged File
A single uploaded file, parsed and mapped to transaction fields.
```json
{
  "fileName": "report.csv",
  "headerMapping": ["Date", "Description", "Expenses"],
  "data": [...],
  "headerRow": 1,
  "dataRow": 2,
  "signature": "[\"Date\",\"Amount\"]"
}
```

### ✅ Header Mapping
Maps spreadsheet columns to: `Date`, `Income`, `Expenses`, or `Description`.
Used to normalize different spreadsheet formats.

### ✅ Signature
A stringified version of the header row that uniquely identifies a file format.
```js
const signature = JSON.stringify(headerRow);
```

### ✅ AppState (Shared Global State)
Centralized object to store all session-related data:
```js
AppState = {
  categories: { ... },
  mergedFiles: [ ... ],
  transactions: [ ... ],
  currentCategoryFilters: [ ... ],
  currentFileData: [...],
  currentFileName: "...",
  currentFileSignature: "...",
  savePromptShown: false
};
```

### ✅ Local Storage Keys
- `expenseCategories`
- `mergedFiles`
- `fileFormatMappings`
- `userDefinedHeaders`

### ✅ Component Responsibilities
- `fileHandler.js`: file parsing & merging
- `categoryManager.js`: category CRUD & rendering
- `transactionManager.js`: process, render, assign
- `chartManager.js`: pie and timeline chart rendering
- `mappingsManager.js`: header format management
- `uiManager.js`: UI utilities and merged file list
- `main.js`: initialization, event bindings, glue

### ✅ Toast
Temporary floating UI element for alerts/notifications.
```js
showToast("Upload complete")
```

---
Use these conventions when modifying or extending the app.
All modules should work independently and use `AppState` where needed.

### File Signature
- A JSON-stringified version of the first header row.
- Used to detect file format identity and deduplicate uploads.

### suggestMapping(data)
- Guesses a column's role based on sample data and header name.
- Supports: "Date", "Income", "Expenses", "Description"

### renderHeaderPreview()
- Renders a table with:
  1. First row as headers
  2. Second row as dropdowns for mapping
  3. Third row as sample data

### onSaveHeaders()
- Saves header mapping to localStorage
- Merges file if not already added
- Re-renders transactions

### File Deduplication
- On upload, if a file has the same header signature, it will be:
  - Auto-merged without asking the user again
  - Skipped if already in merged list

### Categories Section
- Add Category button (`➕`)
- Future: Edit modal with rename, color, delete

### New Functions
- `openEditTransactionsModal`: Opens a modal for editing transactions.
- `renderCategoryList`: Renders the categories in the "Categories" section.
- `toggleCategoryFilter`: Toggles the visibility of transactions by category.
- `renderTransactions`: Centralized function for rendering transactions.
- `deleteTransaction`: Deletes a transaction from the list.

## File Handling

### Format Recognition
- The application identifies file formats based on:
  1. File extension (XML, XLS, XLSX)
  2. Number of columns
  3. Header names (normalized)
- Files with identical structures generate the same signature
- When a file with a known signature is uploaded, its format mapping is applied automatically

### XML Files
- XML files are parsed using multiple strategies to extract data
- The parser attempts to find structured rows in various XML formats
- Date recognition is improved for multiple date formats and languages

### Excel Files
- Excel files may contain empty rows which are filtered out
- Excel dates (numeric values 40000-50000) are automatically converted to YYYY-MM-DD format
- Header detection looks for the first non-empty row

## Transaction Management

### Data Normalization
- Fields are normalized before validation:
  - "expenses" field is mapped to "amount"
  - "income" field is also mapped to "amount"
- Negative values are properly handled for expenses

### Transaction Validation
- Each transaction requires a date, description, and valid amount
- Invalid transactions are filtered out with warnings
- All displayed transactions are validated

## User Interface

### File Mapping
- Users can map columns from imported files to standard fields
- Default mappings are suggested based on column content
- Mappings are saved for future use with similar files

### Format Management
- Users can delete saved formats
- When deleting a format, associated files are also removed after confirmation

### Export
- Transactions can be exported to CSV format
- Export includes Date, Description, Category, and Amount fields
- All transaction data is normalized before export

## Changes & Improvements

### Fixed Issues
- XML parsing now supports multiple file structures
- Excel date values are properly converted to human-readable dates
- File signatures are more reliable for format detection
- Field normalization prevents "Invalid amount" warnings
- Export includes all transactions with proper headers

### Removed Features
- Keyboard shortcuts removed due to conflicts with Chrome browser defaults
