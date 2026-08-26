# PR #249 — Runtime Contract Audit

Baseline: `master` @ `d1854266632ae6a3b7cc9d25715eccaa4fb6c6d8` (merged PR #248).

Scope: stateful Zi Wei engines, unvalidated Calculation Core inputs, school-aware
backend narrative routing, TS↔Python DTO parity. **Not** doctrine/calibration.

## Confirmed facts (pre-fix)

| Fact | Classification |
|------|----------------|
| Both engines keep module-global `lastData`; `calculate` mutates it | CONTRACT RISK → P0 fix |
| `getData()` exposes that mutable global; on `ChartEngine` | CONTRACT RISK → P0 remove |
| Only production caller of `getData()` is `ChartPage` AI `context` | BUG |
| UI already stores `chartData` in React state via `calculate()` | OK (SSOT for display) |
| AI path uses `getEngine(school)?.getData()` ≠ React `chartData` | BUG |
| `Number(timezone) \|\| 7` collapses `"0"` → 7 | BUG (golden-locked H4) |
| `birthHour \|\| "Tý"` | CONTRACT RISK |
| Invalid `annualYear` → `new Date().getFullYear()` | CONTRACT RISK |
| `flowBase` cast `as AnnualViewMode` | CONTRACT RISK |
| `parseDate` malformed → silent `1990-06-15` | BUG (golden-locked H2) |
| Backend KB corpus is `kb/data/nam_phai/` only | CONTRACT RISK |
| Retriever hardcodes Nam Phái directory | CONTRACT RISK |
| `SYSTEM_PROMPT` is Nam Phái-framed, school-neutral presentation | CONTRACT RISK |
| TS `ChartDto` omits `gender`; Python `ChartDTO.gender` defaults `""` | BUG |
| `annual_stars.py` is legacy, tests-only; not in narrative path | OK / HYGIENE |

## Discrepancy decisions (this PR)

1. **Remove** `lastData` / `getData` entirely; ChartPage serializes React `chartData`.
2. **Validated calculation input boundary** — engines reject malformed inputs; UI may still *offer* defaults before submit.
3. **Timezone `"0"`** — treat as valid UTC+0 (finite number). Golden H4 lock of bug behavior is retired; case removed from golden suite (covered by unit tests).
4. **Malformed solar date** — fail closed (no `1990-06-15` fallback). Golden H2 case removed; validation rejection tests cover it.
5. **Trung Châu narrative** — fail closed with `UNSUPPORTED_NARRATIVE_SCHOOL`; never map to Nam Phái KB.
6. **Gender on ChartDto** — add typed field; serialize explicitly from form.

## Post-fix status

All P0/P1 items above implemented on `fix/pr249-ziwei-runtime-contract`.

## Next architecture PR (document only — not extracted here)

Obvious shared-vs-school-specific seams for a future `ZiweiSchoolPolicy` PR
(do **not** unify tables in #249):

| Area | Shared today? | School-specific |
|------|---------------|-----------------|
| Tứ Hóa tables | No | Separate engine tables |
| Brightness | No | Separate |
| Secondary stars | Partial helpers | Placement differs |
| Annual placement semantics | Shared annual-flow helpers | Engine wiring differs |

## Explicit non-goals

- Palace Overview / Annual Axes / Major Fortune / Monthly Flow numeric changes
- Trung Châu KB pack invention
- Multi-year snapshot bundle to backend
- Full `ZiweiSchoolPolicy` extraction

## Expected numeric delta (valid inputs)

**ZERO**. Bug-lock golden cases H2/H4 removed (not regenerated as plausible charts).
