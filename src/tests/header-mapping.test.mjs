import { AppState } from '../core/appState.js';
import { renderHeaderPreview, suggestMapping, updateHeaderMapping } from '../ui/headerMapping.js';

describe('header mapping suggestions and duplicate handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="headerRowInput" value="1"/><input id="dataRowInput" value="2"/><div id="container"></div><button id="saveHeadersBtn"></button>';
    AppState.currentSuggestedMapping = null;
  });

  it('suggests mappings, resolves duplicates, and enables save', () => {
    const data = [
      ['Date', 'Description', 'Amount'],
      ['2024-01-01', 'Coffee', '-3.00'],
      ['2024-01-02', 'Salary', '1000.00'],
    ];

    renderHeaderPreview(data, 'container', 'headerRowInput', 'dataRowInput');

    const selectEls = Array.from(document.querySelectorAll('.header-map'));
    expect(selectEls.length).toBe(3);

    const initialMapping = suggestMapping(data);
    const incomeIndex = initialMapping.findIndex((v) => v === 'Income');
    const otherIndex = incomeIndex === 0 ? 1 : 0;
    selectEls[otherIndex].value = 'Income';
    updateHeaderMapping(selectEls[otherIndex], otherIndex);

    const previousIncomeSelect = document.querySelector(`select[data-column-index="${incomeIndex}"]`);
    expect(previousIncomeSelect.value).toBe('–');

    const saveBtn = document.getElementById('saveHeadersBtn');
    expect(saveBtn.disabled).toBe(false);
    expect(saveBtn.title).toBeTruthy();
  });
});
