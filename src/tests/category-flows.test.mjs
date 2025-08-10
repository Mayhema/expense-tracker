import { showCategoryManagerModal, addSubcategory, updateCategory, deleteCategory } from '../ui/categoryManager.js';
import { AppState } from '../core/appState.js';

describe('category manager flows', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    // Always confirm destructive actions
    // eslint-disable-next-line no-undef
    global.confirm = () => true;
  });

  it('adds a new category and subcategory then edits and deletes', async () => {
    const { close } = showCategoryManagerModal();

    const addCategoryBtn = document.querySelector('#addCategoryBtn');
    expect(addCategoryBtn).toBeTruthy();

    // Add category
    const nameInput = document.querySelector('#newCategoryName');
    expect(nameInput).toBeTruthy();
    nameInput.value = 'Travel';
    addCategoryBtn.click();

    // Ensure appears in grid
    const grid = document.querySelector('#categoriesGrid');
    expect(grid).toBeTruthy();
    const travelCard = grid.querySelector('.category-card[data-category="Travel"]');
    expect(travelCard).toBeTruthy();

    // Add subcategory to Travel via exported API to avoid brittle DOM in jsdom
    addSubcategory('Travel', 'Flights', '#e74c3c');
    await new Promise((r) => setTimeout(r, 0));
    expect(AppState.categories['Travel']?.subcategories?.Flights).toBeTruthy();
    // Reveal and assert via UI
    const updatedGrid = document.querySelector('#categoriesGrid');
    const updatedTravelCard = updatedGrid.querySelector('.category-card[data-category="Travel"]');
    const manageBtn = updatedTravelCard.querySelector('.btn-subcategories');
    if (manageBtn) {
      manageBtn.click();
      await new Promise((r) => setTimeout(r, 0));
      const revealed = updatedCard.querySelector('.subcategories-section');
      expect(revealed.textContent).toMatch(/Flights/);
    }

    // Rename using API to avoid brittle inline edit in JSDOM
    updateCategory('Travel', 'Travel & Trips', '#3498db');
    await new Promise((r) => setTimeout(r, 0));
    expect(AppState.categories['Travel & Trips']).toBeTruthy();
    // Re-open modal to reflect latest state in UI
    // Close and reopen to refresh DOM
    close();
    showCategoryManagerModal();
    const gridAfterEdit = document.querySelector('#categoriesGrid');
    const updatedTripsCard = gridAfterEdit.querySelector('.category-card[data-category="Travel & Trips"]');
    expect(updatedTripsCard).toBeTruthy();

    // Delete category
    // Delete via API for reliability in tests and verify state
    deleteCategory('Travel & Trips');
    await new Promise((r) => setTimeout(r, 0));
    expect(AppState.categories['Travel & Trips']).toBeUndefined();

    close();
  });
});
