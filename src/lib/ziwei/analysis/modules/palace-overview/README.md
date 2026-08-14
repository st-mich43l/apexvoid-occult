# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Numeric scoring knowledge: **1.2.0-experimental** (V1 heuristic seeds) and
**2.0.0-experimental** (Nam Phái Scoring Formula V2 teacher seeds).
Engine: **1.3.0** (V1) / **2.0.0** (Nam Phái V2).
Release stage: **experimental**. V1 research: **READY_FOR_EXPERT_DATA_COLLECTION**.
Calibration / shadow / production: **NO_GO**.

Nam Phái radar uses V2 by default (`ziweiPalaceOverviewV2`). Trung Châu and
`?ziweiPalaceOverviewV2=0` stay on V1.

The 0–100 score is **net quality** (V1: support minus pressure; V2: logistic of
S_cung). It is not probability, certainty, or destiny strength. Tật Ách is a
structural axis, not a health prognosis.

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
  v2/                       Nam Phái Scoring Formula V2
  __tests__/
```

Knowledge: `src/lib/ziwei/analysis/knowledge/palace-overview/v1/` (archived for
rollback) and `.../v2/formula.json`.
UI: `src/components/ziwei/analysis/`
Docs: `docs/research/palace-overview-score-semantics.md`
Gate: `npm run release:palace-overview:gate`

Pipeline: natal facts → static frame → evidence → structural interaction
deltas → aggregation → normalization.

Calibration and sensitivity tools are scripts/tests. They are not run in the UI.
