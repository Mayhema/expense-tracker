/**
 * Debug Categories Test - Verify categories are loaded and displayed correctly
 */

const { describe, test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Debug Categories', () => {
  test('should verify categories data structure and availability', () => {
    // Check if AppState is properly initialized with categories
    const appStatePath = path.join(__dirname, '../core/appState.js');
    const appStateContent = fs.readFileSync(appStatePath, 'utf8');

    expect(appStateContent).toContain('DEFAULT_CATEGORIES');
    expect(appStateContent).toContain('initializeDefaultCategories');

    // Check if constants file has the expected categories
    const categoriesPath = path.join(__dirname, '../constants/categories.js');
    const categoriesContent = fs.readFileSync(categoriesPath, 'utf8');

    expect(categoriesContent).toContain('Food & Dining');
    expect(categoriesContent).toContain('Transportation');
    expect(categoriesContent).toContain('subcategories');

    // Verify the enhanced category manager imports AppState correctly
    const enhancedManagerPath = path.join(__dirname, '../ui/enhancedCategoryManager.js');
    const enhancedManagerContent = fs.readFileSync(enhancedManagerPath, 'utf8');

    expect(enhancedManagerContent).toContain('import { AppState');
    expect(enhancedManagerContent).toContain('AppState.categories');
    expect(enhancedManagerContent).toContain('buildEnhancedCategoriesGrid');

    console.log('✅ All category-related imports and references found');
  });

  test('should verify that categories display correctly in enhanced manager', () => {
    const enhancedManagerPath = path.join(__dirname, '../ui/enhancedCategoryManager.js');
    const enhancedManagerContent = fs.readFileSync(enhancedManagerPath, 'utf8');

    // Check if the categories grid is properly built
    expect(enhancedManagerContent).toContain('Object.entries(categories)');
    expect(enhancedManagerContent).toContain('enhanced-category-card');
    expect(enhancedManagerContent).toContain('subcategories-preview');

    // Check if empty state is handled
    expect(enhancedManagerContent).toContain('Object.keys(categories).length === 0');
    expect(enhancedManagerContent).toContain('empty-state');

    console.log('✅ Categories display logic found in enhanced manager');
  });

  test('should verify the categories data loading process', () => {
    const appStatePath = path.join(__dirname, '../core/appState.js');
    const appStateContent = fs.readFileSync(appStatePath, 'utf8');

    // Check if categories are loaded from localStorage (accept both single/double quotes)
    expect(appStateContent).toMatch(/localStorage\.getItem\(['"]categories['"]\)/);
    expect(appStateContent).toContain('AppState.categories = JSON.parse');

    // Check if default categories are used as fallback
    expect(appStateContent).toContain('initializeDefaultCategories()');

    console.log('✅ Categories loading process verified');
  });
});
