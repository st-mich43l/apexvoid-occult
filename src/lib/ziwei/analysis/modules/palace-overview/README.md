# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Numeric scoring knowledge: **1.2.0-experimental** (heuristic seeds).
Engine: **1.3.0** (trace, confidence metadata, calibration tooling).
Release stage: **experimental**. Research: **READY_FOR_EXPERT_DATA_COLLECTION**.
Collection: **READY** (infrastructure; zero invented expert reviews).
Calibration / shadow / production: **NO_GO**.

Feature flag `ziweiPalaceOverviewV1`.

The 0–100 score is **net quality** (support minus pressure, logistic). It is
not probability, certainty, or destiny strength.

## Layout

```text
palace-overview/
  analyze-all-palaces.ts
  analyze-palace.ts
  collect-evidence.ts
  aggregate-evidence.ts
  normalize-result.ts
  evaluate-structural-rules.ts
  *annotations*.ts          semantic layer (does not change scores)
  types.ts
  benchmark.ts              seed-case runner (dev/test only)
  scoring/                  traces, dedup, parameter registry, invariants
  calibration/              split, metrics, sensitivity, distribution
  __tests__/
```

Knowledge: `src/lib/ziwei/analysis/knowledge/palace-overview/v1/`
UI: `src/components/ziwei/analysis/`
Docs: `docs/research/palace-overview-score-semantics.md`
Gate: `npm run release:palace-overview:gate`

Pipeline: natal facts → static frame → evidence → structural interaction
deltas → aggregation → normalization.

Calibration and sensitivity tools are scripts/tests. They are not run in the UI.
