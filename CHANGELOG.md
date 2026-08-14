# Changelog

## Unreleased

### Added

- Palace Overview scoring validation infrastructure: parameter registry,
  net-quality score semantics, evidence traces, expert-benchmark workflow,
  frozen chart-level split, sensitivity and distribution gates, and
  `npm run release:palace-overview:gate`. Numeric coefficients are unchanged
  heuristic seeds. Release decision remains **NO_GO** until expert review
  exists (`NO_GO_FOR_CALIBRATION`).

### Changed

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
