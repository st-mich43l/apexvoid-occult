# ADR: Palace Overview scalar score semantics

Status: accepted for infrastructure; numeric calibration **not** accepted.

## Decision

The public 0–100 **score** is **net quality from two axes**:

```
qualityRaw = support_raw − pressure_raw − offset
score      = 100 / (1 + exp(−qualityRaw / scale))   # scale = 8, offset ≈ 7.4
```

When `support_raw − pressure_raw === offset`, score is **50**.

The radar **displays four axes**. Only support and pressure enter the score.
`stability` and `activation` are contextual (plus intensity for activation).

Example: VCD `voidContext = {support: 0, pressure: 0.3, stability: -1.0,
activation: 0.5}` changes qualityRaw by −0.3 only. The stability −1.0 is
dropped. That is why void-major palaces barely move on the scalar.

## Not the score

| Concept | Role |
|---|---|
| Activation | Separate axis + contributes to **intensity**, not quality |
| Intensity | `support + pressure + max(activation, 0)` then saturating map |
| Stability | Separate axis (logistic display). Not folded into production score |
| Band | Label of the quality score (quantile-derived in v1.3) |
| evidenceCompleteness | Metadata |
| confidence / calibration | Metadata; **must not multiply score** |
| Semantic annotations | Display only |

## Research candidate (not default)

`candidates/four-axis-v1` experiments with

`qualityRaw = support − pressure − offset + 0.15 × stability`

CLI: `npm run research:palace-overview:compare-four-axis`. **NO_GO**. Production
unchanged.

## Rejected alternatives

A weighted blend such as `0.4·support − 0.3·pressure + 0.2·stability + 0.1·activation` is another heuristic, not an improvement, and is forbidden as production without expert-benchmark evidence.

## Radar

Keep radar radius = net-quality score (option A). Option B (structural-strength radius) is not chosen: it would invent another composite.

## Honesty

Until expert-reviewed charts exist, coefficients remain **heuristic seeds**. The product must not call this production-ready.
