// FIXED: Export default categories that should be loaded on startup
export const DEFAULT_CATEGORIES = {
  'Food & Dining': {
    color: '#FF6B6B',
    order: 1,
    subcategories: {
      'Restaurants': '#FF5252',
      'Groceries': '#FF7043',
      'Fast Food': '#FF8A65'
    }
  },
  'Transportation': {
    color: '#4ECDC4',
    order: 2,
    subcategories: {
      'Gas': '#26C6DA',
      'Public Transit': '#4DB6AC',
      'Parking': '#80CBC4'
    }
  },
  'Shopping': {
    color: '#45B7D1',
    order: 3,
    subcategories: {
      'Clothing': '#42A5F5',
      'Electronics': '#5C6BC0',
      'Home': '#7986CB'
    }
  },
  'Entertainment': {
    color: '#96CEB4',
    order: 4,
    subcategories: {
      'Movies': '#81C784',
      'Games': '#A5D6A7',
      'Events': '#C8E6C9'
    }
  },
  'Bills & Utilities': {
    color: '#FFEAA7',
    order: 5,
    subcategories: {
      'Electricity': '#FFF176',
      'Water': '#FFEB3B',
      'Internet': '#FFEE58'
    }
  },
  'Income': {
    color: '#6C5CE7',
    order: 6,
    subcategories: {
      'Salary': '#A29BFE',
      'Freelance': '#74B9FF',
      'Investment': '#0984E3'
    }
  }
};

export const TRANSACTION_FIELDS = [
  'Date',
  'Description',
  'Income',
  'Expenses',
  'Category',
  'Currency',
  'Balance'
];

// FIXED: Add function to add new category
export function addCategory(name, color) {
  if (!name.trim()) {
    import('../ui/uiManager.js').then(module => {
      module.showToast("Category name cannot be empty", "error");
    });
    return false;
  }

  if (AppState.categories[name]) {
    import('../ui/uiManager.js').then(module => {
      module.showToast("Category already exists", "error");
    });
    return false;
  }

  AppState.categories[name] = color;
  saveCategories();
  return true;
}

// FIXED: Add function to update category
export function updateCategory(oldName, newName, newColor) {
  if (!newName.trim()) return false;

  if (newName !== oldName && AppState.categories[newName]) {
    return false;
  }

  const currentValue = AppState.categories[oldName];
  let updatedValue;

  if (typeof currentValue === 'object') {
    updatedValue = { ...currentValue, color: newColor };
  } else {
    updatedValue = newColor;
  }

  if (oldName !== newName) {
    delete AppState.categories[oldName];
    AppState.categories[newName] = updatedValue;
  } else {
    AppState.categories[oldName] = updatedValue;
  }

  saveCategories();
  return true;
}

// FIXED: Add function to update subcategory
export function updateSubcategory(parentName, oldSubName, newSubName, newSubColor) {
  if (!newSubName.trim()) return false;

  const parentCategory = AppState.categories[parentName];
  if (!parentCategory || typeof parentCategory !== 'object' || !parentCategory.subcategories) {
    return false;
  }

  if (oldSubName !== newSubName && parentCategory.subcategories[newSubName]) {
    return false;
  }

  if (oldSubName !== newSubName) {
    delete parentCategory.subcategories[oldSubName];
    parentCategory.subcategories[newSubName] = newSubColor;
  } else {
    parentCategory.subcategories[oldSubName] = newSubColor;
  }

  saveCategories();
  return true;
}

function saveCategories() {
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}
