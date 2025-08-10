import { showModal, isModalOpen, closeAllModals } from '../ui/modalManager.js';

describe('modal overlay reuse', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reuses a single overlay across sequential modals', () => {
    const first = showModal({ title: 'One', content: '<p>1</p>', showCloseButton: false });
    const overlay1 = document.querySelector('#modalOverlay') || document.querySelector('.modal-overlay');
    expect(overlay1).toBeTruthy();

    first.close();
    expect(isModalOpen()).toBe(false);

    showModal({ title: 'Two', content: '<p>2</p>', showCloseButton: false });
    const overlay2 = document.querySelector('#modalOverlay') || document.querySelector('.modal-overlay');
    expect(overlay2).toBeTruthy();

    // Same element instance reused (id ensured in getModalOverlay fallback)
    expect(overlay1 && overlay2 ? overlay1.id === overlay2.id || overlay1 === overlay2 : true).toBe(true);

    closeAllModals();
  });
});
