console.log("Executing coreBundle.js - Version: 2024-07-29_01"); // Diagnostic log
/**
 * Core Bundle - Consolidates core application functionality
 * This reduces the number of separate HTTP requests
 */

// Import from individual core modules
import {
  AppState,
  saveCategories,
  saveMergedFiles,
  saveAppState,
  resetFileState,
  loadMergedFiles,
  loadTransactions,
  categoriesInitialized // Ensure this is imported
} from '../core/appState.js';
import { DEFAULT_CATEGORIES, HEADERS } from '../core/constants.js';
import { addMergedFile } from '../core/fileManager.js';

/**
 * Initialize all core components in one call
 */
export function initializeCore() {
  console.log("coreBundle: Initializing core services...");
  // AppState is initialized by its own IIFE when appState.js is imported.
  // Categories (including defaults) are handled within appState.js.

  if (!categoriesInitialized.value) {
    console.warn("coreBundle: AppState categories not yet initialized. This might indicate an issue if other core services depend on them immediately.");
  }

  console.log("coreBundle: Core services initialized.");
}

// Export all functions
export {
  AppState,
  saveCategories,
  saveMergedFiles,
  saveAppState,
  resetFileState,
  loadMergedFiles,
  loadTransactions,
  categoriesInitialized, // This should now be defined due to the import
  DEFAULT_CATEGORIES,
  HEADERS,
  addMergedFile,
};
