# Changelog

## Unreleased

### Added

- **Tử Vi**: Nam Phái Cấu trúc 12 cung Scoring Formula V2 (điểm nội tại,
  đảo chiều Tuần/Triệt, mạng Tam Phương Tứ Chính / VCD). Trung Châu giữ V1.
  Rollback: `?ziweiPalaceOverviewV2=0`. Cách cục multiplier chưa bật.
  Trục Tật Ách vẫn chỉ là điểm cấu trúc, không phán bệnh.

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
