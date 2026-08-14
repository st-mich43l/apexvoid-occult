# ADR: Palace Overview scalar score semantics

Status: accepted for infrastructure; numeric calibration **not** accepted.

## Decision

The public 0–100 **score** is **net quality / support-versus-pressure balance**:

```
qualityRaw = support_raw − pressure_raw
score      = 100 / (1 + exp(−qualityRaw / scale))   # scale = 8
```

When `support_raw === pressure_raw`, score is **50** (documented midpoint).

## Not the score

| Concept | Role |
|---|---|
| Activation | Separate axis + contributes to **intensity**, not quality |
| Intensity | `support + pressure + max(activation, 0)` then saturating map |
| Stability | Separate axis (logistic display). Not folded into score |
| Band | Label of the quality score |
| evidenceCompleteness | Metadata |
| confidence / calibration | Metadata; **must not multiply score** |
| Semantic annotations | Display only |

## Rejected alternatives

A weighted blend such as `0.4·support − 0.3·pressure + 0.2·stability + 0.1·activation` is another heuristic, not an improvement, and is forbidden without expert-benchmark evidence.

## Radar

Keep radar radius = net-quality score (option A). Option B (structural-strength radius) is not chosen: it would invent another composite.

## Honesty

Until expert-reviewed charts exist, coefficients remain **heuristic seeds**. The product must not call this production-ready.
