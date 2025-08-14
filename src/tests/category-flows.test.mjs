import { showCategoryManagerModal, addCategory, addSubcategory, updateCategory, deleteCategory } from '../ui/categoryManager.js';
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
  const modal1 = await showCategoryManagerModal();

  // Add category via API (enhanced UI uses a modal flow). Verify via UI after refresh.
  addCategory('Travel', '#3498db');
  await new Promise((r) => setTimeout(r, 0));
  modal1.close();
  const modal2 = await showCategoryManagerModal();
  const grid = document.querySelector('#categoriesGrid');
  expect(grid).toBeTruthy();
  const travelCard = grid.querySelector('.enhanced-category-card[data-category="Travel"]');
  expect(travelCard).toBeTruthy();

    // Add subcategory to Travel via exported API to avoid brittle DOM in jsdom
    addSubcategory('Travel', 'Flights', '#e74c3c');
    await new Promise((r) => setTimeout(r, 0));
    expect(AppState.categories['Travel']?.subcategories?.Flights).toBeTruthy();
    // Reveal and assert via UI
  // Refresh UI to see subcategory preview
  modal2.close();
  const modal3 = await showCategoryManagerModal();
  const updatedGrid = document.querySelector('#categoriesGrid');
  const updatedTravelCard = updatedGrid.querySelector('.enhanced-category-card[data-category="Travel"]');
  expect(updatedTravelCard).toBeTruthy();
  expect(updatedTravelCard.textContent).toMatch(/Flights/);

    // Rename using API to avoid brittle inline edit in JSDOM
    updateCategory('Travel', 'Travel & Trips', '#3498db');
    await new Promise((r) => setTimeout(r, 0));
    expect(AppState.categories['Travel & Trips']).toBeTruthy();
    // Re-open modal to reflect latest state in UI
    // Close and reopen to refresh DOM
  modal3.close();
  const modal4 = await showCategoryManagerModal();
  const gridAfterEdit = document.querySelector('#categoriesGrid');
  const updatedTripsCard = gridAfterEdit.querySelector('.enhanced-category-card[data-category="Travel & Trips"]');
    expect(updatedTripsCard).toBeTruthy();

  // Delete category via API and verify via UI
  deleteCategory('Travel & Trips');
  await new Promise((r) => setTimeout(r, 0));
  modal4.close();
  const modal5 = await showCategoryManagerModal();
  const finalGrid = document.querySelector('#categoriesGrid');
  const deletedCard = finalGrid.querySelector('.enhanced-category-card[data-category="Travel & Trips"]');
  expect(deletedCard).toBeFalsy();

  modal5.close();
  });
});
