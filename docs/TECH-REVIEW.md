# Expense Tracker – Technical Review, Fix List, and Roadmap

This document captures the current state, concrete fixes, and a prioritized execution plan. It is meant to be actionable.

- Scope reviewed: src/, ui/, charts/, styles/, tests/.
- Primary immediate focus: modal height/scrolling and toolbar overflow.

---

## 1) Executive Summary

- Solid modular structure, good separation of concerns, strong test culture.
- Immediate issues: modal height/scrolling, CSS conflicts, duplicated directories, a11y/CI noise.
- Short-term gains: fix modal/toolbar, consolidate folders, tooling hygiene, PWA completion.
- Medium-term: performance (parsing worker, table virtualization), testing & CI consolidation, DX tooling.
- Features: budgets, recurring detection, splits, analytics, improved i18n.

---

## 2) Strengths

- Clear domain separation: core, ui, charts, utils, constants.
- Tests with multiple suites and artifacts.
- CSS broken into topical files, dark theme support present.
- Client-side privacy-first processing; PWA groundwork exists.

---

## 3) Issues and Actionable Fixes (expanded)

### 3.1 Modal height, scrolling, and toolbar overflow

Symptoms observed:
- The modal is tall but not scrollable as expected.
- The toolbar stacks and overflows; content under it is clipped.
- Several CSS rules force fixed heights and hidden overflow.

Root causes:
- `.enhanced-category-manager { height: 100vh !important; max-height: 100vh !important; overflow-y: hidden; }`
- `.modal-content:has(.enhanced-category-manager) { height: 95vh; overflow-y: hidden; }`
- `.modal-body:has(.enhanced-category-manager) { overflow: hidden; }`
- Multiple duplicate `.enhanced-toolbar` rules, some switching to column unexpectedly.

Fix strategy:
- Keep modal width narrow (max-width: 700px). Let height be capped by viewport (90–95vh).
- Disable height:100vh on the inner manager; let the modal body own the scroll.
- Ensure modal body is flex:1 and overflow-y:auto; min-height:0 to allow flexbox scrolling.
- Make toolbar a single row with wrap (no horizontal scroll); reduce padding vertically.

Verification:
- No horizontal page scroll. Modal content scrolls vertically inside body.
- Toolbar stays visible, wraps to another line if needed.
- Cards list scrolls while header/toolbar remain visible.

Key CSS (reference patch shown in Section 5.1).

---

### 3.2 Accessibility: missing lang attribute in archived test HTML

- Warning in `src/tests/archive/automated-test-report.html`.
- Add `lang="en"` to `<html>`. See Section 5.2.

---

### 3.3 CI/linter noise from vendor files in node_modules

- Errors/warnings from a third-party workflow YAML under node_modules.
- Adjust linter/test scanners to ignore `node_modules/` and `src/tests/archive/`.
- Do not edit vendor files. See Section 5.3 for ignore configs.

---

### 3.4 Directory duplication and naming ambiguities

- Duplicate “parser/” vs “parsers/”; “charts/chartManager.js” vs “ui/chartManager.js”; duplicate `src/src/`.
- Consolidate to:
  - Keep `src/parsers/` (move excel/xml parsers here; delete `src/parser/`).
  - Keep `src/charts/` as the only Chart orchestration; UI should import from charts.
  - Remove `src/src/` after confirming unused.
- Provide a migration commit that updates all imports (grep for import paths).

---

### 3.5 CSS specificity and duplication

- Multiple `.enhanced-toolbar` blocks conflict (row vs column; padding resets).
- Normalize in one canonical file (enhanced-category-manager.css) and remove duplicates elsewhere.
- Introduce tokens (CSS variables) and consistent BEM-like naming to reduce overrides.
- Add `min-width:0` and `min-height:0` to flex children that must shrink.

---

### 3.6 Service Worker and PWA setup incomplete

- `service-worker.js` present; missing manifest link and clear caching strategy.
- Add `manifest.webmanifest`, register SW from main.js, use a simple cache-first for static assets and network-first for data.
- Provide update UX (message from SW to refresh).

---

### 3.7 Testing and CI sprawl

- Archives are scanned; some suites redundant.
- Keep 3–5 core suites; exclude archive from runners and linters.
- Consider Playwright smoke E2E for critical flows; keep unit/integration for logic.

---

## 4) Improvements and Features (expanded “how to”)

### 4.1 Performance

- Parsing on Web Worker:
  - Add `src/workers/parserWorker.js` to offload XLSX/XML/CSV parsing.
  - UI posts ArrayBuffer; worker returns parsed JSON.
  - Benefit: main thread remains responsive when importing big files.

- Virtualized transaction table:
  - Window rows based on scroll position (simple manual virtualization).
  - Render only visible + overscan buffer; maintain keyboard navigation.

- Chart update batching:
  - When filters change, batch dataset mutations and call `chart.update()` once per tick.
  - Debounce rapid filter changes to 16–32ms.

### 4.2 Developer Experience

- Vite dev server + build:
  - Fast HMR, modern ES module bundling, easy static deploys.
  - Use `vite.config.js`, move entry to `src/main.js`.

- Gradual TypeScript:
  - Keep JS with JSDoc types first; add `types/index.ts` as central contracts.
  - Convert parsers and appState first.

### 4.3 Testing and CI

- Jest/Vitest for unit/integration, Playwright for E2E.
- Exclude archive from test discovery; consistent `npm test` experience.
- Add GitHub Actions workflow for PR checks (lint + test + build).

### 4.4 Accessibility & UX

- Keyboard navigation: ensure tab order, focus traps in modals, ESC to close.
- ARIA: proper roles (dialog, button, list), labels, `aria-expanded` on toggles.
- Contrast: verify dark/light tokens hit WCAG AA.

### 4.5 Core Features

- Budgets per category:
  - Extend appState with budgets; UI to set monthly limits.
  - Charts display actual vs budget, with alerts when exceeding.

- Recurring transaction detection:
  - Heuristics on payee/amount/frequency; suggestions surfaced in UI.

- Transaction splits:
  - Add Split modal to allocate parts of a transaction to different categories.

- i18n expansion:
  - Centralize strings in `utils/i18n.js`; add language switcher and persistence.

---

## 5) Concrete Changes and Snippets (copy/paste ready)

### 5.1 Modal/Toolbar CSS fixes (height/scroll focus, keep width <= 700px)

Place in the canonical modal-related stylesheet (prefer `src/styles/enhanced-modal.css` and remove conflicting duplicates elsewhere).

````css
// filepath: [enhanced-modal.css](http://_vscodecontentref_/0)
/* 1) Modal content sizing: narrow width, height capped by viewport */
.modal-content:has(.enhanced-category-manager) {
  /* width: narrow, no horizontal scroll */
  width: min(700px, calc(100vw - 20px));
  max-width: 700px;
  min-width: 320px;

  /* height: capped, body scrolls */
  max-height: min(95vh, calc(100vh - 20px));
  height: auto;

  display: flex !important;
  flex-direction: column !important;

  /* do NOT hide inner scroll */
  overflow: hidden; /* keep header/foot hidden overflow, body will scroll */
}

/* 2) The modal body must own the vertical scroll */
.modal-body:has(.enhanced-category-manager) {
  padding: 0;              /* avoid double padding */
  flex: 1 1 auto;          /* occupy remaining space under header */
  min-height: 0;           /* allow flexbox children to shrink */
  overflow-x: hidden;
  overflow-y: auto;        /* vertical scroll happens here */
}

/* 3) The inner manager must not force viewport height */
.enhanced-category-manager {
  height: auto !important;     /* override previous 100vh */
  max-height: none !important; /* let parent control height */
  overflow: visible;           /* content flows; body scrolls */
}

/* 4) Toolbar: single row with wrapping, compact vertical footprint */
.enhanced-toolbar {
  display: flex;
  flex-direction: row;         /* horizontal by default */
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.75rem 1rem;       /* compact height */
  flex-wrap: wrap;             /* wrap instead of growing height too much */
  background: var(--secondary-color);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem 0.75rem;
  flex-wrap: wrap;
  min-width: 0;                /* allow shrink */
}

.search-container .search-input {
  width: min(100%, 420px);
}

/* On very narrow screens, stack gracefully */
@media (max-width: 480px) {
  .enhanced-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
