# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Feature flag `ziweiPalaceOverviewV1`.

The 0–100 score is **net quality** (support minus pressure, logistic). It is
not probability, certainty, or destiny strength.

## Numeric freeze

Baseline commit:

  `0ac04ad0875dd3de5b03036d8a673fa6b00b8a08`

Baseline ID:

  `PO-FROZEN-0ac04ad`

Status:

  **FROZEN**

Frozen:

- scoring formula (`logistic(support - pressure)`)
- numeric star evidence behavior (production `collect-evidence`)
- rawAxes production aggregation
- normalization / score / band / intensity
- radar score → radius mapping (`radius = score / 100`)

Not frozen:

- source registry improvements
- bibliography
- semantic annotations
- research-only doctrine candidates (`palace-overview-research-v2`)
- non-numeric explainability
- Calculation Core chart generation (fixtures use current engine inputs
  under the frozen scoring modules)

Calibration:

  Historical heuristic seeds only. **No claim of expert calibration.**

Semantic doctrine:

  May continue evolving without changing production scores.

Numeric changes:

  Require an explicit **`REOPEN_PALACE_OVERVIEW_NUMERIC`** proposal PR.
  Research / semantic PRs must not mutate the frozen 12-palace numeric
  contract. `"experimental"` release stage is **not** permission to change
  frozen numbers.

Hard CI guard:

  `src/lib/ziwei/analysis/modules/palace-overview/__tests__/frozen-numeric-baseline.test.ts`

## Layout

```text
palace-overview/
  analyze-all-palaces.ts
  analyze-palace.ts
  collect-evidence.ts
  aggregate-evidence.ts
  normalize-result.ts
  evaluate-structural-rules.ts
  numeric-baseline.ts       freeze provenance constants
  *annotations*.ts          semantic layer (does not change scores)
  research/                 research-only V2 scoring helpers (not production)
  types.ts
  benchmark.ts
  scoring/
  calibration/
  __fixtures__/             PO-FROZEN-0ac04ad numeric contracts
  __tests__/
```

Knowledge (production numeric): `src/lib/ziwei/analysis/knowledge/palace-overview/v1/`
Research V2 (detached): `src/lib/ziwei/analysis/knowledge/palace-overview-research-v2/`
UI: `src/components/ziwei/analysis/`
Docs: `docs/research/palace-overview-score-semantics.md`
Gate: `npm run release:palace-overview:gate`

Pipeline: natal facts → static frame → evidence → structural interaction
deltas → aggregation → normalization.

Calibration and sensitivity tools are scripts/tests. They are not run in the UI.
