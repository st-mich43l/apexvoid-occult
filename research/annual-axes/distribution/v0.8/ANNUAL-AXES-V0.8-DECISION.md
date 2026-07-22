# Annual Axes V0.8 Decision

## Status

**Production default for Nam Phái.** Trung Châu remains on the isolated V0.2 pipeline.

`formulaVersion`: `v0.8-annual-palace-weighted-score`  
`engineVersion` / `knowledgeVersion`: `0.8.0`

## Model

Deterministic Lưu Niên palace-weighted scoring:

- Primary palace weight **0.60**, cooperating total **0.40** (engineering hypothesis).
- `palaceRaw = clamp(sum(pos) − sum(neg), −8, +8)`
- Unique physical palace scored once; role weights combine.
- `axisRaw` uses absolute configured weights (missing cooperating contributes nothing; no silent renormalization).
- **Lưu Thái Tuế** is a prominence multiplier (**×1.25**), never a positive point source. Bare natal `Thái Tuế` does not activate it. Zero raw stays zero after multiplication.
- Final score: `clamp(50 + 5 × clamp(axisRaw × thaiTueMult, −8, 8), 10, 90)`

## Temporal identity

- Exact star identity preserves `Lưu` meaning (`Hóa Kỵ` ≠ `Lưu Hóa Kỵ`).
- Matching uses exact name + `allowedTemporalLayers` (+ optional sources).
- Natal stars never satisfy annual-only rules.
- Aliases are spelling variants only; star **families** are not interchangeable.

## Missing data

| Condition | Axis status | Score |
|---|---|---|
| Primary palace unresolved | `unavailable` | `null` (never fabricated 50) |
| Primary ok, cooperating missing | `partial-data` | computed from resolved weights |
| All palaces missing | `unavailable` | `null` |

Coverage exposes `resolvedWeight` / `totalWeight` / `missingPalaces`.

## Self-containment

V0.8 loads only its own knowledge package (mapping, stars, aliases/families, point classes, score bands, distribution gates, source registry). It does **not** depend on V0.4 knowledge at runtime.

## Provenance

Numeric constants (60/40, point classes, clamps, scale, 1.25 multiplier, distribution gates) are **engineering hypotheses** — see `annual-source-registry.v0.8.json`. Do not cite them as classical formulas.

## Non-goals

No MAD/robust-Z, no candidate engines, no public confidence %, no rollback to deleted pre-V0.8 engines.
