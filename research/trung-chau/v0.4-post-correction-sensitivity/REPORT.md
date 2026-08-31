# Post-Trung-Châu Correction Sensitivity (v0.4)

## Research question

How does the approved Trung Châu Mậu/Nhâm Hóa Khoa physical correction propagate
through existing Analysis modules when all other variables are held constant?

## Authority boundaries

Calculation Core remains physical truth. School policy remains doctrine.
Analysis interprets physical facts. This generation is research-only and is not
runtime authority.

- No Calculation Core changes
- No released school-policy changes
- No scoring formula / weight / band changes
- No Monthly production routing changes
- Research artifacts ≠ runtime authority

## PRE vs POST definition

```text
Mậu Khoa: Hữu Bật → Thái Dương
Nhâm Khoa: Tả Phụ → Thiên Phủ
Canh Khoa: Thiên Phủ (unchanged)
TOTAL_POLICY_CELL_DIFF = 2
```

Base SHA: `09fb7803aad201d8db8e4f02311efbb0354a1073`

## Experimental constants

Current source code, chart geometry, star placement, temporal coordinates,
knowledge packs, scoring models/bands/weights, release policy, and feature flags
are held constant. Only PRE mutagen / monthly `tuHoaTargets` mappings differ.

## Counterfactual generation

1. `POST_CHART = calculateTrungChau(goldenInput)` under live released policy
2. `PRE_CHART = structuredClone(POST_CHART)` then rebuild natal/annual/major
   mutagen arrays via `resolveMutagenRecords(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, …)`
3. Source chart mutagen arrays remain unchanged
4. Monthly lane: same POST chart + PRE/POST providers that share calendar identity
   and differ only in `tuHoaTargets`

## Corpus & coverage

- Total TC cases: **55**
- Historical non-annual-stem: 45
- Annual stem coverage: 10
- Mậu annual case included: true (`annual-stem-2018`)
- Nhâm annual case included: true (`annual-stem-2022`)
- Historical #261/#262 45-case impact artifacts remain untouched

## Exposure model

A temporal layer is exposed iff its stem is Mậu or Nhâm (Khoa target differs).
Palace Overview exposure uses natal stem only. Major Fortune V0.5 correction
sensitivity uses natal exposure (adapter disables luck-stem XF). Monthly V1
shadow exposure uses monthly calendar stem.

## Global sensitivity summary

| Module | Observations | Exposed | Changed | Control Δ | Median \|Δ\| | P95 \|Δ\| | Max \|Δ\| | Band flips | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Palace Overview | 660 | 228 | 139 | 0 | 1.8 | 7.6 | 7.7 | 36 | coherent |
| Annual Axes | 330 | 162 | 75 | 0 | 0 | 1.3 | 2.9 | 5 | coherent |
| Major Fortune V0.5 | 55 | 19 | 2 | 0 | 0 | 4.3 | 4.3 | 2 | coherent |
| Major Fortune V1 | 55 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | COVERAGE_GAP (V1 unscored XF) |
| Monthly V1 shadow | 660 | 116 | 13 | 0 | 0 | 0.1 | 0.3 | 0 | coherent |

## Module notes

### Palace Overview
Natal mutagen fact swap only. Control Δ exact zero. Exposed median |Δ| =
1.8.

### Annual Axes
TC V0.2 released path. Cohort counts:
{"NATAL_ONLY":96,"ANNUAL_ONLY":0,"MAJOR_ONLY":48,"MULTI_LAYER":18,"NO_EXPOSURE":168}.
Coverage gaps: ["ANNUAL_ONLY"].

### Major Fortune V0.5
Correction sensitivity (MF-A). Natal XF only per adapter policy.

### Major Fortune V1
Shadow path; Tứ Hóa not scored → XF score sensitivity classified COVERAGE_GAP.
MF-C model deltas are recorded separately and not merged into correction stats.

### Monthly Flow V1 Shadow
Label: `MONTHLY_FLOW_V1_SHADOW_CANDIDATE_SENSITIVITY`.
TC production remains unavailable. Calendar/focus invariants:
failures=0.

## Negative controls

All unexposed expected deltas exact-zero: **true**

- PO unexpected: 0
- AA unexpected: 0
- MF V0.5 unexpected: 0
- Monthly unexpected: 0
- Monthly calendar invariant failures: 0

## Classification tallies

- PHYSICAL_CORRECTION_PROPAGATION: 284
- EXPECTED_ANALYSIS_RESPONSE: 1421
- MODEL_INSTABILITY: 0
- COVERAGE_GAP: 55
- UNEXPECTED_DELTA: 0

No `MODEL_INSTABILITY` claims were made without structural evidence.

## Limitations

- Major Fortune V0.5 TC adapter scores natal year-stem XF only (scoreLuckStemMutagens=false).
- Major Fortune V1 does not score luck-stem or natal year-stem Tứ Hóa → XF score sensitivity is COVERAGE_GAP.
- Monthly experiment varies provider.tuHoaTargets only on POST chart geometry.
- TC Monthly production remains unavailable (unsupported-school).
- No arbitrary abs(delta) instability threshold invented.
- Annual Axes cohort coverage gaps: ANNUAL_ONLY

## Runtime impact

Expected protected runtime delta: **0**. This PR measures; it does not tune.

## Outcome / next recommendation

- Kind: `A_COHERENT_SENSITIVITY`
- Recommended next: #266 refactor(research): consolidate deterministic analysis shadow-comparison tooling

