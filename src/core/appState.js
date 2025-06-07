import { DEFAULT_CATEGORIES } from '../constants/categories.js';

/**
 * Application State Management
 * Centralized state management for the expense tracker application
 */

// Global application state
export const AppState = {
  transactions: [],
  mergedFiles: [],
  categories: {},
  currentFileName: null,
  currentPreviewData: null,
  currentFileSignature: null,
  currentSuggestedMapping: null,
  currentPreviewModal: null
};

/**
 * Initialize the application state
 */
export function initialize() {
  console.log("Initializing AppState...");

  try {
    // Load transactions from localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      AppState.transactions = JSON.parse(savedTransactions);
      console.log(`Loaded ${AppState.transactions.length} transactions from localStorage`);
    }

    // Load merged files from localStorage
    const savedMergedFiles = localStorage.getItem('mergedFiles');
    if (savedMergedFiles) {
      AppState.mergedFiles = JSON.parse(savedMergedFiles);
      console.log(`Loaded ${AppState.mergedFiles.length} merged files from localStorage`);
    }

    // FIXED: Load categories from localStorage with consistent key
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      AppState.categories = JSON.parse(savedCategories);
      console.log(`Loaded categories from localStorage`);
    } else {
      // Initialize with default categories if none exist
      initializeDefaultCategories();
    }

    console.log("AppState initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing AppState:", error);
    return false;
  }
}

/**
 * Initialize application state
 */
export function initializeAppState() {
  console.log("Initializing application state...");

  // Load merged files
  try {
    const savedMergedFiles = localStorage.getItem('mergedFiles');
    if (savedMergedFiles) {
      AppState.mergedFiles = JSON.parse(savedMergedFiles);
      console.log(`Loaded ${AppState.mergedFiles.length} merged files`);
    }
  } catch (error) {
    console.error('Error loading merged files:', error);
    AppState.mergedFiles = [];
  }

  // CRITICAL FIX: Load transactions directly from localStorage
  try {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      AppState.transactions = JSON.parse(savedTransactions);
      console.log(`Loaded ${AppState.transactions.length} transactions from localStorage`);
    } else if (AppState.mergedFiles && AppState.mergedFiles.length > 0) {
      // If no saved transactions, process from merged files
      console.log("No saved transactions found, processing from merged files...");
      AppState.transactions = [];

      AppState.mergedFiles.forEach(file => {
        if (file.transactions && Array.isArray(file.transactions)) {
          AppState.transactions = AppState.transactions.concat(file.transactions);
        }
      });

      console.log(`Processed ${AppState.transactions.length} transactions from merged files`);

      // Save the processed transactions
      if (AppState.transactions.length > 0) {
        localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
      }
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    AppState.transactions = [];
  }

  // Load categories
  try {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      AppState.categories = JSON.parse(savedCategories);
      console.log(`Loaded categories from localStorage:`, Object.keys(AppState.categories));
    } else {
      // Initialize with default categories
      console.log("No saved categories found, initializing with defaults...");
      AppState.categories = { ...DEFAULT_CATEGORIES };
      localStorage.setItem('categories', JSON.stringify(AppState.categories));
      console.log(`Initialized ${Object.keys(AppState.categories).length} default categories`);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    AppState.categories = { ...DEFAULT_CATEGORIES };
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  }

  console.log("AppState initialized:", {
    transactions: AppState.transactions.length,
    mergedFiles: AppState.mergedFiles.length,
    categories: Object.keys(AppState.categories).length
  });
}

// FIXED: Add function to set current file signature
export function setCurrentFileSignature(signature) {
  AppState.currentFileSignature = signature;
  console.log('CRITICAL: Set current file signature:', signature);
}

/**
 * Ensure all transactions in AppState have unique IDs
 */
export function ensureAllTransactionIds() {
  if (!AppState.transactions || !Array.isArray(AppState.transactions)) {
    return;
  }

  const usedIds = new Set();
  let idsAdded = 0;

  AppState.transactions.forEach((tx, index) => {
    if (!tx.id || usedIds.has(tx.id)) {
      // Generate new unique ID
      let newId;
      do {
        newId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      } while (usedIds.has(newId));

      tx.id = newId;
      idsAdded++;
    }

    usedIds.add(tx.id);
  });

  if (idsAdded > 0) {
    console.log(`Added ${idsAdded} unique IDs to transactions`);
    // Save updated transactions
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
  }
}

// FIXED: Add function to rebuild transactions from merged files
function rebuildTransactionsFromFiles() {
  console.log('Rebuilding transactions from merged files...');

  let allTransactions = [];

  AppState.mergedFiles.forEach(file => {
    if (file.transactions && Array.isArray(file.transactions)) {
      allTransactions = allTransactions.concat(file.transactions);
    }
  });

  // Ensure all transactions have unique IDs
  const usedIds = new Set();
  allTransactions.forEach((tx, index) => {
    if (!tx.id || usedIds.has(tx.id)) {
      let newId;
      do {
        newId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      } while (usedIds.has(newId));
      tx.id = newId;
    }
    usedIds.add(tx.id);
  });

  AppState.transactions = allTransactions;
  localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

  console.log(`Rebuilt ${allTransactions.length} transactions from merged files`);
}

/**
 * Initialize default categories from constants
 */
function initializeDefaultCategories() {
  console.log("Initializing default categories from constants...");

  // Use the imported DEFAULT_CATEGORIES directly
  AppState.categories = { ...DEFAULT_CATEGORIES };

  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
    console.log(`Initialized ${Object.keys(AppState.categories).length} default categories`);
  } catch (error) {
    console.error('Error saving default categories to localStorage:', error);
  }
}

/**
 * Save categories to localStorage
 */
export function saveCategories() {
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
    console.log("Categories saved to localStorage");
  } catch (error) {
    console.error("Error saving categories:", error);
  }
}

/**
 * Save merged files to localStorage
 */
export function saveMergedFiles() {
  try {
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
    console.log("Merged files saved to localStorage");
  } catch (error) {
    console.error("Error saving merged files:", error);
  }
}

/**
 * Save transactions to localStorage
 */
export function saveTransactions() {
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    console.log("Transactions saved to localStorage");
  } catch (error) {
    console.error("Error saving transactions:", error);
  }
}

/**
 * Reset file-related state
 */
export function resetFileState() {
  AppState.currentFileName = null;
  AppState.currentPreviewData = null;
  AppState.currentFileSignature = null;
  AppState.currentSuggestedMapping = null;
  AppState.currentPreviewModal = null;
  console.log("File state reset");
}

/**
 * Add a category to the state
 */
export function addCategory(name, color, order) {
  if (!name || typeof name !== 'string') {
    throw new Error('Category name is required and must be a string');
  }

  AppState.categories[name] = {
    color: color || '#cccccc',
    order: order || Object.keys(AppState.categories).length + 1
  };

  saveCategories();
  console.log(`Category '${name}' added`);
}

/**
 * Remove a category from the state
 */
export function removeCategory(name) {
  if (!name || !AppState.categories[name]) {
    throw new Error('Category not found');
  }

  delete AppState.categories[name];
  saveCategories();
  console.log(`Category '${name}' removed`);
}

/**
 * Update a category in the state
 */
export function updateCategory(name, updates) {
  if (!name || !AppState.categories[name]) {
    throw new Error('Category not found');
  }

  AppState.categories[name] = {
    ...AppState.categories[name],
    ...updates
  };

  saveCategories();
  console.log(`Category '${name}' updated`);
}

/**
 * Get all categories sorted by order
 */
export function getCategories() {
  return Object.entries(AppState.categories)
    .sort(([, a], [, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;
      return orderA - orderB;
    })
    .reduce((acc, [name, data]) => {
      acc[name] = data;
      return acc;
    }, {});
}

/**
 * Clear all application state
 */
export function clearState() {
  AppState.transactions = [];
  AppState.mergedFiles = [];
  AppState.categories = {};
  resetFileState();

  // Clear localStorage
  localStorage.removeItem('transactions');
  localStorage.removeItem('mergedFiles');
  localStorage.removeItem('categories');

  console.log("Application state cleared");
}

/**
 * Load app state from localStorage
 */
export async function loadAppState() {
  console.log("Loading app state from localStorage...");

  try {
    // Load transactions
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      AppState.transactions = JSON.parse(savedTransactions);
      console.log(`Loaded ${AppState.transactions.length} transactions from localStorage`);
    }

    // Load merged files
    const savedMergedFiles = localStorage.getItem('mergedFiles');
    if (savedMergedFiles) {
      AppState.mergedFiles = JSON.parse(savedMergedFiles);
      console.log(`Loaded ${AppState.mergedFiles.length} merged files from localStorage`);
    }

    // Load categories
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      AppState.categories = JSON.parse(savedCategories);
      console.log(`Loaded categories from localStorage`);
    }

  } catch (error) {
    console.error("Error loading app state:", error);
  }
}

// Export AppState as default for compatibility
export default AppState;
