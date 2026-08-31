# Monthly Flow / Lưu Nguyệt

The module currently has three explicit release roles:

- **Stable released production (Nam Phái):** `production.ts` resolves through
  `release-policy.ts` to V0.3 (`v0.3-production/`).
- **Trung Châu:** no currently released Monthly Flow production implementation.
  Status and public resolver fail closed (`unavailable` / rebuilding).
- **V1 RC1:** `analyze.ts` is the evidence-based shadow / release-gated candidate
  evaluated by tests and `release:monthly-flow-v1:gate`. V1 is **not** silently
  executed on the production request path.

## Core invariants

- Monthly focus palace and calendar stem/branch are independent coordinate systems.
- Calendar identity comes from the injected `MonthlyCalculationProvider.stemBranchForLunarMonth`, never from `palace.stem` / `palace.branch`.
- Monthly Tứ Hóa resolves from the monthly calendar stem to exact physical natal-star targets.
- V1 scores physical temporal evidence rather than previous-module final scores.
- Overall month scoring uses the explicit `overall` scope and monthly geometry; it does not fabricate an Annual Axes domain.
- Score, coverage, and confidence are separate outputs. Coverage/confidence never alter the numeric score.

## Release policy

`release-policy.ts` is the SSOT for production availability:

```text
Nam Phái + V01 ON + V03 ON → available @ 0.3.0
Nam Phái + V01 OFF or V03 OFF → unavailable
Trung Châu → unavailable (unsupported school)
```

There is no live `0.1.2` production route. Historical V0.1.2 was deleted and
must not be resurrected by pointing old wrappers at current `analyze.ts` (V1).

## Legacy runtime

`v0.2/` and `v0.3-production/` remain only because stable Nam Phái production
still depends on them. They are not the V1 implementation and must not be
copied into another version tree. When V1 is explicitly promoted after a real
shadow/comparison gate, delete the obsolete runtime cluster rather than
archiving it in source control.
