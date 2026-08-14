# Changelog

## Unreleased

### Added

- Palace Overview Stage 3: 紫微斗數全書卷二 conditional palace claims with
  exact section locators, honest coverage (not fake 168/168), Benchmark V2
  (case / review / adjudication), blind review-pack CLI, review validator,
  Split V2 SHA-256 holdout rule, and Krippendorff α from real review
  matrices. Decision: **READY_FOR_EXPERT_DATA_COLLECTION**. Calibration,
  shadow, and production remain **NO_GO**. Numeric scores unchanged.
- Palace Overview Stage 2 doctrine layer: source registry, twelve-palace
  matrix, sparse 14×12 claims, star-system recognition, school VCD policy,
  coverage components, conflict diagnostic, Krippendorff alpha, and
  `validate:palace-overview` vs `release:palace-overview:shadow`. Numeric
  scores remain frozen. Decision: **RESEARCH_READY_FOR_EXPERT_REVIEW**.
- Palace Overview scoring validation infrastructure: parameter registry,
  net-quality score semantics, evidence traces, expert-benchmark workflow,
  frozen chart-level split, sensitivity and distribution gates, and
  `npm run release:palace-overview:gate`. Numeric coefficients are unchanged
  heuristic seeds. Release decision remains **NO_GO** until expert review
  exists (`NO_GO_FOR_CALIBRATION`).

### Changed

- **Tử Vi**: Opening palace-overview detail no longer stretches the Lưu Niên
  (annual-axes) card to the same height; each analysis card keeps its own
  content height.
- Updated the root and analysis READMEs to match the current Calculation Core /
  Analysis module tree, UI folders, docs, and release-gate commands.
- Consolidated frontend validation into one CI job: whitespace, dead-code audit,
  typecheck, tests, production build, and source-tree cleanliness.
- Updated the CI runtime to Node.js 22 and Python 3.12 with current GitHub
  Actions.
- Kept only runtime analysis modules and their regression coverage; archived
  research generators, generated reports, preview-only UI, and obsolete audit
  workflows were removed.
- Tightened the public TypeScript surface by removing unused barrel exports and
  declaring Tailwind CSS as a direct build dependency.

### Fixed

- Removed a Node-only dynamic `eval("require")` path from the browser bundle.
- Removed dangling knowledge references to deleted research files.

### Current analysis integrations

- Annual axes: `0.8.0`
- Major fortune: `0.5.0`
- Monthly flow: `0.3.0`

Older changes remain available in Git history.
