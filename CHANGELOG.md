# Changelog

## Unreleased

### Changed

- **Tử Vi**: Palace Overview scoring rebuilt against Nam Phái KB + 《紫微斗數全書》: brightness is amplitude only (no polarity deltas); 武/暗 stars net≈0 at Bình; Cự Nhật hãm is 口舌 not a +3.5 dump. Numeric scores **change**. Cần thầy duyệt. Calibration / shadow / production stay **NO_GO**.
- **Tử Vi**: `quality.offset` re-derived after v2.1 = **7.1**. Bands from derive-bands: low≤24.9, guarded<38.7, balanced<49.3, supportive<63.4.
- **Tử Vi**: Palace Overview Tứ Hóa is a transform of the host star
  (40-cell matrix), not a separate additive evidence row. 12 / 40 cells
  have star-specific heuristic deltas; the rest keep the old four-constant
  fallback. Numeric scores **change**. Cần thầy duyệt on filled cells.
- **Tử Vi**: Palace Overview formations expanded 3 → 8 (Cự Nhật, Song Lộc,
  Lộc Quyền hội, Khoa Quyền Lộc, Kình Đà giáp Kỵ). Interaction deltas only.
- **Tử Vi**: Structural rules now pass through Tuần/Triệt attenuation
  (`localStructuralMagnitudeFactor` 0.6 / 0.4) in the same void pass as
  stars. Exactly one `void-attenuate` evidence id per voided palace in the
  frame.
- **Tử Vi**: Annual-axes Trung Châu lock fixture refreshed because natal
  major-star seeds are shared with Palace Overview.

### Added

- **Tử Vi**: Palace Overview scoring-rebuild note
  (`docs/research/palace-overview-scoring-rebuild-v2-1.md`).
- **Tử Vi**: Palace Overview v2 knowledge-model note
  (`docs/research/palace-overview-v2-knowledge-model.md`).
- **Tử Vi**: Research-only four-axis Palace Overview score candidate
  (`w_st=0.15`, CLI `compare-four-axis`). Production remains 2-axis.
  Calibration / shadow / production stay **NO_GO**.
- **Tử Vi**: Palace Overview distribution invariants now fail closed if
  median/mean scores inflate away from 50 on a 500-chart deterministic
  corpus. Calibration remains **NO_GO**.

- Palace Overview pilot execution hardening: canonical rubric 2.1 enums,
  assignment-only review forms, assignment-aware ingest, and no fabricated
  confidence. Pilot remains unaccepted. Calibration, shadow, and production
  stay **NO_GO**. Numeric scores unchanged.
- Palace Overview expert corpus pipeline: deterministic structural case
  discovery, natal fingerprints, coverage/promotion, compact pairwise
  assignment, research-only review form, validated ingest, and a five-case
  blinded pilot corpus. Decision: **PILOT_READY**. Calibration, shadow, and
  production stay **NO_GO**. Numeric scores unchanged.
- Palace Overview Benchmark V2 integrity (Stage 3.1): review packs from
  `normalizeNatalFacts`, real reviewer-overlap units, school-sliced
  Krippendorff readiness, usable pairwise counts, strict raw-review
  validation, calibration/holdout accessors, and
  `research:palace-overview:status`. Decision remains
  **READY_FOR_EXPERT_DATA_COLLECTION**. Calibration, shadow, and production
  stay **NO_GO**. Numeric scores unchanged.
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

- **Tử Vi**: Restored the original analysis card grid: 12 cung beside Lưu
  Niên, Đại vận beside Lưu Nguyệt.
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
