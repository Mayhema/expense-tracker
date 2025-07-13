# Category Manager Test Setup

## Overview

This directory contains comprehensive unit tests for the Category Manager functionality of the expense tracker application.

## Test Files

### `categoryManager.test.js`

Tests the core Category Manager functionality including:

- Adding, updating, and deleting categories
- Managing subcategories
- Real-time UI updates
- Modal behavior
- Data persistence to localStorage

## Test Coverage

The tests cover the following scenarios:

### Category Management

- ✅ Adding new categories with validation
- ✅ Updating category names and colors
- ✅ Deleting categories and cleaning up related data
- ✅ Preventing duplicate categories
- ✅ Order management for categories

### Subcategory Management

- ✅ Adding subcategories to existing categories
- ✅ Deleting subcategories
- ✅ Converting string categories to object format
- ✅ Validation and duplicate prevention

### UI Integration

- ✅ Modal creation and singleton behavior
- ✅ Real-time dropdown updates
- ✅ Preserving selected values during updates
- ✅ Transaction area integration

### Data Persistence

- ✅ localStorage synchronization
- ✅ Transaction updates when categories change
- ✅ State management consistency

## Running Tests

To run these tests, you'll need to set up a testing framework like Jest:

```bash
# Install Jest
npm install --save-dev jest @babel/preset-env @babel/core babel-jest

# Add to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/tests/setup.js"]
  }
}

# Run tests
npm test
```

## Test Results Expected

All tests should pass, validating that:

1. The Category Manager modal works correctly
2. All CRUD operations function properly
3. Real-time UI updates work as expected
4. Data persistence is reliable
5. Edge cases are handled gracefully

## Manual Testing Checklist

After running automated tests, also verify manually:

- [ ] Modal opens without duplicate headlines
- [ ] Adding categories updates dropdowns immediately
- [ ] Edit, delete, and subcategory buttons all work
- [ ] Category colors and orders are preserved
- [ ] Transaction area dropdowns update live
- [ ] No console errors during category operations
- [ ] Modal closes properly
- [ ] Data persists across page refreshes
