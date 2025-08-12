# Expense Tracker – Step-by-step Improvement Plan

This plan consolidates a project-wide review (bugs, cleanup, structure) plus a roadmap aligned with items in `README1.md`. Each phase is bite-sized, testable, and reversible.

## Goals and guardrails
- Keep 0 Sonar problems and 0 lint errors (warnings allowed where intentional).
- Preserve green tests at each step; add guard tests where behavior changes.
- Gate risky changes behind feature flags; prefer progressive enhancement.

## Phase 0 – Immediate fixes (1–2 PRs)
- Enhanced Category Manager modal sizing
  - Make inner list fully visible with its own scroll; header/toolbar/footer remain fixed. (Done)
  - Verify across breakpoints (<=480px, <=768px) and dark mode.
  - Add a tiny visual smoke test (screenshot diff optional) or DOM height assertions.
- Worker parsing tests consistency
  - Ensure XLSX worker-client tests pass in worker and non-worker environments. (Done)

Acceptance criteria
- Manual smoke: category list scrolls; no body scroll jumps; footer visible.
- CI: all suites pass; no new lint/Sonar problems.

## Phase 1 – Codebase cleanup (2–4 PRs)
- Remove or consolidate duplicate/legacy files (with usage checks)
  - Parsers
    - Consolidate on `src/parsers/fileHandler.js` + shared utils in `src/utils/`.
    - Migrate/retire `src/parsers/xmlParser.js` and `src/parsers/excelParser.js` if fully superseded.
  - Core/file handlers
    - Verify usage of `src/core/fileHandlers.js` vs `src/parsers/fileHandler.js`; deprecate the unused one.
  - HTML
    - `src/src/index.html` appears duplicate of root `index.html`; validate and remove duplicate.
  - Styles
    - Identify unused: `filters_clean.css`, `table-fixes.css`, `smartUploadWizard.css`, `category-manager.css` vs `enhanced-category-manager.css`.
  - Tests
    - Deduplicate CJS/ESM pairs where both exist with identical assertions (keep ESM-first; convert CJS when useful).
- Logging and debug surface
  - Centralize console logging behind `debugManager` and build-time flag; reduce noisy warnings incrementally.
- Dependency hygiene
  - Add `depcheck` script; remove unused deps; pin versions where drifting.

Acceptance criteria
- All removals backed by grep/reference checks and PR notes.
- CI remains green; no user-visible behavior change.

## Phase 2 – Type safety and contracts (2–3 PRs)
- Introduce minimal types for hot paths
  - Expand `types/index.ts` to define shared shapes: Transaction, Category, Mapping, ParsedRow.
  - Add JSDoc typedefs to JS modules that import from `types/index.ts` (via d.ts) for editor support.
- Public contracts
  - Document inputs/outputs for `fileHandler`, `csv/xml` utils, and worker client (error modes, fallbacks).

Acceptance criteria
- Editor intellisense for core modules.
- No runtime behavior changes.

## Phase 3 – Performance and UX polish (3–5 PRs)
- Virtualization deeper integration
  - Wire the virtualization flag through main transaction table path; add a large-dataset regression test.
- Lazy-load heavy bundles
  - Defer chart libraries and non-critical UI modules until needed.
- Parsing off-main-thread
  - Keep CSV/XML in worker by default; evaluate bundling XLSX into a dedicated worker build or maintain main-thread fallback with progress indicator.
- Accessibility
  - Keyboard navigation for the Enhanced Category Manager; focus traps and ARIA labels audit.

Acceptance criteria
- Large dataset render stays responsive (<~100ms UI thread stutter budget in tests).
- Axe-lite audit passes for modal interactions.

## Phase 4 – Roadmap features from README1.md (ongoing; behind flags)
- Recurring Transactions & Scheduling
  - Detect patterns; store recurrence rules; generate entries on load; in-app banner for new entries.
- Goal-based Budgeting & Alerts
  - Targets per category/overall; visual goal overlays; 80%/100% thresholds.
- ML-powered Categorization Trainer (lightweight)
  - Naive Bayes/decision tree over description/amount/date with user feedback loop.
- Enhanced Interactive Visualizations
  - Drill-downs, date sliders, simple moving-average projections.
- Progressive Onboarding
  - First-run tutorial; contextual tooltips; replayable help.
- Theming & Accessibility
  - CSS variables for themes; high-contrast and font-size controls.
- Exportable, Shareable Reports
  - Printable summaries; URL-hash config for sharing; basic PDF via print CSS.
- PWA & Notifications
  - Service worker caching; manifest; optional reminders.

Acceptance criteria
- Feature-flagged; opt-in via APP_FEATURES.
- Tests per feature (unit + integration); docs updated.

## Phase 5 – Quality gates hardening (1–2 PRs)
- Make lint warnings targeted
  - Move console allowances near debugging modules; tighten `no-unused-vars` gradually.
- Sonar connected mode (optional)
  - Keep `sonar-project.properties`; ensure CI ignores third-party folders.

Acceptance criteria
- No regressions; clearer signal-to-noise on warnings.

## Candidate deletions (to validate)
- `src/src/index.html` (duplicate) – verify and remove.
- `src/parsers/xmlParser.js`, `src/parsers/excelParser.js` – if fully wrapped by shared utils and `fileHandler`.
- Legacy styles: `filters_clean.css`, `category-manager.css`, `smartUploadWizard.css`, `table-fixes.css` – remove if unused.
- Root `test.js` – remove if not referenced.

Process
- For each candidate: search references, add test if needed, deprecate, delete, and note in PR.

## Test plan additions
- Modal layout guard tests: assert scrollable regions and fixed header/footer via computed styles.
- Large CSV/XML parsing timing test (budget, not absolute time).
- Duplicate detection edge cases (empty rows, BOMs, mixed encodings;
  smoke with synthetic data).
- Worker availability matrix tests (with/without Worker and localStorage flag).

## Rollout and tracking
- Each PR updates TECH-REVIEW.md.
- Use feature flags for any behavior change.
- Keep a running checklist in this file; check off as merged.
