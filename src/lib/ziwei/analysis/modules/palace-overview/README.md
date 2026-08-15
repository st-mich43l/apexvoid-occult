# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Numeric scoring knowledge: **2.0.0-experimental** (Tứ Hóa as star transform + empirical offset).
Engine: **1.3.0** (trace, confidence metadata, calibration tooling).
Release stage: **experimental**. Research: **READY_FOR_EXPERT_DATA_COLLECTION**.
Collection: **READY** (infrastructure; zero invented expert reviews).
Corpus: **PILOT_READY** (five structural cases; no human reviews yet).
Calibration / shadow / production: **NO_GO**.

Feature flag `ziweiPalaceOverviewV1`.

The 0–100 **score** is a function of **two raw axes only**: `support` and
`pressure` (minus empirical `offset`, then logistic). The radar **displays
four axes** (support, pressure, stability, activation). `stability` and
`activation` are context for display and intensity; they contribute **0**
to the production score.

Example: Vô chính diệu `voidContext` `{support: 0, pressure: 0.3,
stability: -1.0, activation: 0.5}` moves quality by −0.3 raw (under 1
score point). The `stability: -1.0` term is invisible to the score.
Tuần/Triệt `stabilityDelta` and Hóa Quyền `activation: 2.0` likewise do
not enter the 0–100 number.

A research-only four-axis candidate (`w_st = 0.15`) exists behind CLI
`research:palace-overview:compare-four-axis`. It is **not** default.
Calibration / shadow / production remain **NO_GO**.

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

Pipeline: natal facts → static frame → evidence (Tứ Hóa applied on the host
star after brightness) → structural interaction deltas (then Tuần/Triệt
attenuation once) → aggregation → normalization.

Tứ Hóa matrix: 12 / 40 cells filled with star-specific heuristic deltas;
the rest `usesFallback: true` (old four-constant seeds). See
`docs/research/palace-overview-v2-knowledge-model.md`.

Calibration and sensitivity tools are scripts/tests. They are not run in the UI.
