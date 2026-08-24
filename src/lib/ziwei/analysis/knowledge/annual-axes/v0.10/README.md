# Annual Axes V0.10 — Layered Fortune

**Runtime status:** `CURRENT_NAM_PHAI` · `EXPERIMENTAL` · `UNCALIBRATED`

## Release policy

Annual Axes **V0.10** is the current Nam Phái runtime. The public
`analyzeAnnualAxes()` route and the chart radar consume the V0.10
`layered-balanced` result directly.

Experimental means the coefficients still require validation/calibration; it
does **not** mean the engine is detached from the runtime.

Historical V0.8.2 is not a public runtime anymore. Its frozen scoring kernel is
retained only where V0.10 reuses the annual-trigger formula, and the complete
V0.8 analyzer is opt-in only for research/control comparisons.

## Why V0.10 (not another V0.9)

Annual Axes **V0.9** (historical, mostly deleted) evaluated bounded incremental
star-shape candidates (notably Lưu Thiên Mã) on top of frozen V0.8 mechanics.
V0.10 uses a different architecture:

> Annual domain state = Natal foundation + Major Fortune context + Annual
> trigger + Cross-layer resonance

It is not a revival of rejected V0.9 star rules.

## Layer ownership

| Layer | Source module | Notes |
|-------|---------------|--------|
| Natal foundation | Palace Overview | rawAxes only; no re-scoring of natal stars |
| Major Fortune | `analyzeMajorFortune` | No annual/monthly facts |
| Annual trigger | frozen V0.8 `scoreV08Domain` kernel | Reused as a component, not a runtime route |
| Resonance | V0.10 config | State-based; does not clone physical facts |

Monthly Flow is **forbidden**.

## Score mapping

Final display mapping currently reuses the frozen V0.8 normalization:

`score = clamp(50 + 50 × tanh(compositeRaw / tanhScale), 10, 90)`

with `tanhScale` and raw clamp read from V0.8 knowledge. This keeps the display
scale stable while the layered composition changes the input signal.

## Current runtime profile

`layered-balanced` is the released Nam Phái profile:

- Natal foundation: `0.30`
- Major Fortune: `0.25`
- Annual trigger: `0.35`
- Resonance: `0.10`

The following remain comparison profiles, not public runtime routes:

- `annual-heavy` — 0.20 / 0.20 / 0.50 / 0.10
- `structure-heavy` — 0.35 / 0.30 / 0.25 / 0.10

## Projection variants

The current runtime uses `legacy` projection. `romance-expanded` remains a
research sensitivity variant until separately approved.

Career mapping stays Quan Lộc 0.60 / Thiên Di 0.20 / Mệnh 0.20.
