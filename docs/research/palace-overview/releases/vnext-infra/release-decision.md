# Palace Overview scoring vNext — release decision

Candidate: scoring infrastructure 1.0.0 (engine 1.3.0)  
Numeric knowledge: 1.2.0-experimental (unchanged seeds)  
Parent SHA: `87c9de5`

## 1–4. Versions

| Field | Value |
|---|---|
| Baseline engine | 1.2.0 |
| Candidate engine | 1.3.0 |
| Scoring knowledge | 1.2.0-experimental |
| Semantic knowledge | 1.2.0-experimental |
| Calibration version | null |
| Release stage | experimental |

## 5–8. Benchmark

| Item | Value |
|---|---|
| Cases | 1 seed chart (`female-1991-09-21-dau`) |
| Reviewer count | 0 |
| Schools in seed | nam-phai, trung-chau |
| Reviewed palace labels | 0 |
| Agreement | null (no labels) |
| Calibration split | that one case id |
| Holdout | empty (documented) |

## 9–10. Metrics

No expert ordinal/pairwise/rank metrics. Engine-only distribution on a compact matrix is non-pathological (not a calibration result).

## 11. Parameter changes

**None.** All astrology coefficients kept. Config fields that were dead are now enforced (`method`, `midpoint`) or cross-checked (`voidMajorBorrowFactor`) without changing values. Band cuts moved onto the profile with identical numbers.

## 12–16. Sensitivity / distribution / schools / weaknesses

±10% geometry and quality.scale on the seed chart is not explosive by the gate threshold. Nam Phái and Trung Châu share architecture; scores may differ with facts. Weakness: **no expert labels**, so none of the calibration questions can be answered.

## 17. Decision

**NO_GO** (`NO_GO_FOR_CALIBRATION`)

Not GO_SHADOW: shadow still implies a candidate coefficient set evaluated against labels.

## 18. Commit SHA

Filled at PR time (this file is updated if the merge-base commit differs).

## Expert data required next

20–30 (preferably 30–50) **human**-reviewed charts, both schools, mixed VCD/void/structure/cát/sát, ordinal axes + pairwise within chart, ≥2 reviewers on a subset, then freeze a chart-level holdout **before** any coefficient movement.
