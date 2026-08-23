# Annual Axes V0.10 — Layered Fortune (research candidate)

**Status:** `EXPERIMENTAL` · `UNCALIBRATED` · `ENGINEERING_HYPOTHESIS`

## Why V0.10 (not another V0.9)

Annual Axes **V0.9** (historical, mostly deleted) evaluated bounded incremental
star-shape candidates (notably Lưu Thiên Mã) on top of frozen V0.8 mechanics.
Decision: **KEEP_V0_8_PRODUCTION**.

**V0.10** tests a different hypothesis:

> Annual domain state = Natal foundation + Major Fortune context + Annual
> trigger + Cross-layer resonance

It is **not** a revival of rejected V0.9 star rules.

## Production freeze

Production Nam Phái Annual Axes remains **V0.8.2**
(`analyzeAnnualAxesNamPhaiV08`). This candidate must never become the default
route.

## Layer ownership

| Layer | Source module | Notes |
|-------|---------------|--------|
| Natal foundation | Palace Overview | rawAxes only; no re-scoring of natal stars |
| Major Fortune | `analyzeMajorFortune` (v0.5 → v0.3 ordinal) | No annual/monthly facts |
| Annual trigger | V0.8.2 `scoreV08Domain` | Reused, not rewritten |
| Resonance | V0.10 config | State-based; does not clone physical facts |

Monthly Flow is **forbidden**.

## Score mapping freeze

Final display mapping reuses V0.8:

`score = clamp(50 + 50 × tanh(compositeRaw / tanhScale), 10, 90)`

with `tanhScale` and raw clamp read from V0.8 knowledge. This PR does **not**
tune normalization.

## Profiles

Hypothesis seeds (weights sum to 1.00):

- `layered-balanced` — 0.30 / 0.25 / 0.35 / 0.10
- `annual-heavy` — 0.20 / 0.20 / 0.50 / 0.10
- `structure-heavy` — 0.35 / 0.30 / 0.25 / 0.10

## Romance mapping sensitivity

- `legacy` — Phu Thê 0.60 / Tử Tức 0.40 (production-aligned)
- `expanded` — Phu Thê 0.50 / Phúc Đức 0.20 / Mệnh 0.15 / Tử Tức 0.15 (research only)

Career mapping stays Quan Lộc 0.60 / Thiên Di 0.20 / Mệnh 0.20.
