# Palace Overview scoring baseline (V1.2 numeric / V1.3 infrastructure)

Baseline commit on this branch's parent: `87c9de5` (master at branch creation).

## What the previous engine did

Pipeline: natal facts → static TP4C frame → evidence (majors, natal Tứ Hóa, minors with diminishing returns, Tràng Sinh, VCD/void) → structural interaction evidence → sum axes → normalize.

**Scalar score** = logistic(`support_raw - pressure_raw`, scale=8). At net 0 the score is 50.

**Not in the scalar:** stability, activation, intensity, evidence completeness, profile.confidence.

Axis display uses saturating maps (support/pressure/activation) and a logistic map (stability). Intensity saturates `support + pressure + max(activation,0)`.

Bands were hardcoded (`≤24 low`, `<50 guarded`, `<60 balanced`, `<75 supportive`, else strong). They are now declared on the profile with the **same** cuts.

## Problems found (software / contract, not “radar looks unbalanced”)

1. `qualityNormalization.method` and `midpoint` were declared but unread. Logistic(0) happened to be 50.
2. `profile.voidMajorBorrowFactor` duplicated `void-environment.json`; runtime used only the latter.
3. Band thresholds lived in code, not the parameter registry.
4. Completeness/confidence could be mistaken for score quality.
5. Structural rules added `baseAxes` on top of participant stars without an explicit “interaction-delta” identity (the numbers were already extras, but the contract was implicit).
6. Expert benchmark seed is a single unreviewed chart. No calibration is defensible.
7. Distribution smoke only checked exact 0/100 rate.

## Parameter registry

Canonical machine-readable registry: `buildParameterRegistry()` in
`src/lib/ziwei/analysis/modules/palace-overview/scoring/parameter-registry.ts`.

Numeric provenance for **all** current coefficients: **heuristic-seed**. Trainable in principle; **frozen** until ≥20 expert-reviewed charts exist.

### Geometry

| Parameter ID | Current | File | Constraint |
|---|---|---|---|
| geometry.focus | 1.0 | profile.json | focus ≥ opposite ≥ trine > 0 |
| geometry.opposite | 0.5 | profile.json | |
| geometry.trine | 0.3 | profile.json | |

### Normalization

| Parameter ID | Current | Trainable? |
|---|---|---|
| quality.method | logistic | no (only implemented method) |
| quality.scale | 8.0 | yes, with evidence |
| quality.midpoint | 50 | no (logistic identity) |
| supportScale / pressureScale | 14 | yes |
| activationScale | 12 | yes |
| stabilityScale | 8 | yes |
| intensity.scale | 22 | yes |
| band.* | 24 / 50 / 60 / 75 | presentation labels |

### VOID

| Parameter ID | Current | Used by |
|---|---|---|
| vcd.borrowFactor | 0.65 | void-environment.json (SSOT) |
| voidContext / doubleVoidContext | see JSON | VCD context axes |
| singleVoid.* / doubleVoid.* | see JSON | local Tuần/Triệt attenuation |

### STRUCTURE (interaction deltas)

| Rule | support | pressure | stability | activation |
|---|---|---|---|---|
| Tử Phủ Vũ Tướng | 3.0 | 0 | 2.0 | 1.0 |
| Cơ Nguyệt Đồng Lương | 2.5 | 0 | 1.5 | 1.0 |
| Sát Phá Tham | 0 | 0 | -0.5 | 3.0 |

Major-star, brightness, Tứ Hóa, minor-family, and Chang Sinh seeds remain in their JSON catalogs; the registry function enumerates them. **None were retuned.**

## UI consumers

`PalaceOverviewRadar` plots **net-quality score** as radar radius (option A). Activation/stability/support/pressure remain in the detail panel.
