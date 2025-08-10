Expense Tracker – Technical Review

P1 status (Complete)
- Modal UX: Max width capped at 700px; height constrained via scrollable content area; toolbar wraps without overflowing.
- CSS hygiene: Consolidated styles under `src/styles`; removed inline style injections; dark mode and responsive behavior verified.
- Modal infra: Single reusable overlay/container; immediate visibility; ESC to close; validated by tests.
- Testing: Jest + jsdom headless; polyfills for TextEncoder/TextDecoder, requestAnimationFrame; minimal canvas/Chart stubs; fully unattended runs.
- Lint/format: ESLint + Prettier stable (no blocking errors).

What changed (highlights)
- UI: `src/ui/modalManager.js`, `src/ui/categoryManager.js`, `src/ui/headerMapping.js` hardened.
- Charts: `src/charts/timelineChart.js` exports fixed; no‑data paths resilient in `expenseChart.js` and `incomeExpenseChart.js`.
- Tests: Added overlay reuse, category flows, chart formatting helpers, header mapping duplicate handling; re-enabled legacy CJS placeholders.
- Styles: Consolidated CSS under `src/styles`, ensured modal constraints and toolbar wrapping.

Current test results
- 17 suites, 42 tests — all passing, 0 skipped.
- jsdom canvas limitations surfaced as logged warnings only (expected with stubs).

Developer commands
- Format: npm run format
- Lint: npm run lint (or npm run lint:fix)
- Test: npm test (headless, unattended)

Quality gates
- Build: N/A (static app)
- Lint/Typecheck: ESLint OK (0 errors). Some console usage intentional for debug; can be gated later.
- Unit tests: PASS. Modal CSS constraints and charts no‑data covered by regressions.

P2 roadmap (proposed)
1) Performance and UX
  - Virtualize large transaction tables (windowing) to keep DOM light.
  - Debounced filters and incremental rendering.
  - Lazy-load charts/heavy modules only when canvases are present.
2) Import pipeline
  - Move Excel/XML parsing to a Web Worker to keep UI responsive.
  - Stronger header mapping heuristics; persist mappings per source.
  - Validation/reporting: row-level issues with recovery suggestions.
3) Category manager
  - Keyboard navigation and ARIA focus management; finalize focus trap.
  - Bulk edit ergonomics; undo/redo for category operations.
4) Charts and analytics
  - Consistent color palettes by category; improved no-data UX.
  - Timezone-safe date handling across charts and filters.
5) Testing/CI
  - Expand unit tests for transaction editing and revert flows.
  - Add smoke E2E (Playwright) for import → map → list → charts.
  - Wire CI (GitHub Actions) for lint + unit + E2E on PRs.
6) Code health
  - Continue ESM-first test migration; tighten types with JSDoc/TS for utilities.
  - Extract UI utilities and reduce duplication in chart modules.

Notes
- Prefer calling exported APIs in tests over brittle DOM event simulations.
- Maintain single-overlay modal contract to avoid stacking issues.
- Keep chart/canvas stubs minimal and noise-gated in tests.
