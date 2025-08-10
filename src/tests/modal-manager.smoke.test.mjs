import { showModal, closeAllModals, isModalOpen } from '../ui/modalManager.js';

describe('modalManager smoke', () => {
  beforeEach(() => {
    // Use Jest's jsdom environment and global polyfills from setupTests.cjs
    document.body.innerHTML = '';
  });

  it('opens and closes a modal', () => {
    expect(isModalOpen()).toBe(false);
    const modal = showModal({ title: 'Test', content: '<p>Hi</p>', showCloseButton: false });
    expect(isModalOpen()).toBe(true);
    expect(modal).toBeTruthy();
    expect(document.querySelector('.modal-overlay')).toBeTruthy();

    closeAllModals();
    expect(isModalOpen()).toBe(false);
    expect(document.querySelector('.modal-overlay')).toBeFalsy();
  });
});
