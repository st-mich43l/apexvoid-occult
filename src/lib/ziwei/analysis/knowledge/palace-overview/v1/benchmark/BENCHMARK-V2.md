# Palace Overview Benchmark V2

Separate **CASE**, **REVIEW**, and **ADJUDICATION**.

- Cases have no expert labels.
- Reviews are immutable, school-specific, `blindedToEngine: true`.
- Pairwise judgments always include `reviewerId`, `school`, `caseId`.
- Reliability unit: `caseId + school + palaceName + axis`.
- Do not mix Nam Phái and Trung Châu into one reliability row.
- Do not infer pairwise from ordinals.

## Static Review Boundary

Blind packs are **not** `chart.palaces[*].stars`.

```
Calculation Core chart
        ↓
normalizeNatalFacts(chart, { school })
        ↓
ExpertReviewNatalPack
```

`normalizeNatalFacts` is the single natal/static fact policy. The pack generator only projects those facts. Temporal overlays (`annual`, `annual-mutagen`, `major-mutagen`, `monthly-flow`) cannot appear. Changing `annualYear` must not change the pack.

Experts see: palace name/branch, Mệnh/Thân, natal principal and minor stars, brightness, natal Tứ Hóa (once), Tuần/Triệt, Chang Sinh, school.

They must not see: engine scores, bands, axes, drivers, parameters, other reviewers’ labels, or adjudications.

Generate: `npm run research:palace-overview:review-pack` (`.research-artifacts/`, gitignored).

## Reviewer Overlap

A usable reliability unit is one `caseId + school + palaceName + axis` with a judgment other than `unable-to-judge`.

An overlapping unit has usable judgments from ≥ 2 distinct reviewers.

A case-school counts as multi-reviewer only if it has at least `minOverlappingUnitsPerMultiReviewerCaseSchool` overlapping units (policy v3: **3**). Two reviewers rating disjoint palaces is not overlap.

## Pairwise Usability

Usable: `LEFT | RIGHT | TIE`. Missing for readiness: `UNABLE_TO_JUDGE`.

Logical pair identity sorts palace names so Mệnh vs Quan and Quan vs Mệnh are one pair. Stored rows keep original orientation. Duplicate unordered pairs in one review/axis are rejected. Self-pairs are rejected.

Readiness uses `usablePairwiseCount`, not raw row count. Graph diagnostics (`nodes`, `edges`, `components`) show whether comparisons are concentrated on one edge.

## Reliability

Implemented statistic: **Krippendorff α — fixed quadratic rank distance**.
`δ²(i,j) = (rank_i − rank_j)²`. See [KRIPPENDORFF.md](./KRIPPENDORFF.md).

Reported for global and for Nam Phái / Trung Châu, on support, pressure, stability, activation, netQuality.

GO_FOR_CALIBRATION Stage A requires computable global **support, pressure, netQuality**, plus school slices: each school needs computable (support OR netQuality) **and** (pressure OR netQuality). Weak but computable α is reported honestly. A single 0.67 floor is not the GO rule.

## Calibration Readiness

```
collection-ready  ≠  calibration-ready  ≠  shadow-ready  ≠  production-ready
```

Empty human reviews can still be **READY_FOR_EXPERT_DATA_COLLECTION** if infrastructure and validators pass. Calibration stays **NO_GO** until overlap, pairwise, holdout, and reliability gates in `readiness-policy.v3.json` are met with real data.

Status: `npm run research:palace-overview:status`.

Validate committed files: `npm run research:palace-overview:validate-reviews`.

## Holdout

Split is whole-case SHA-256 (see [SPLIT.md](./SPLIT.md)). Do not reassign after inspecting engine output.

`loadCalibrationReviews()` returns only calibration-split cases. `loadHoldoutReviews()` is explicit. Default calibration accessors must not stream holdout labels into a tuner.

## Expert collection workflow

1. Add a benchmark case (birth input + eligible schools + cohort tags).
2. Store deterministic `splitAssignment` (recompute must match).
3. Validate cases / split.
4. Register a real expert in `reviewer-registry.v2.json` (id, schools, status, addedAt — no unnecessary PII).
5. Generate a blind review pack.
6. Give the expert the pack plus [REVIEW-RUBRIC.md](./REVIEW-RUBRIC.md). No engine scores before the first submission.
7. Receive the completed review.
8. Append an immutable review record (`expert-reviews.v2.json`). Do not overwrite raw rows with adjudications.
9. `npm run research:palace-overview:validate-reviews`
10. `npm run research:palace-overview:status`
11. Repeat until calibration readiness thresholds are actually met.
