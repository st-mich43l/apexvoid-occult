# Monthly Flow / Lưu Nguyệt

The module currently has two explicit release roles:

- `production.ts` is the stable V0.3 user-facing resolver.
- `analyze.ts` is the evidence-based V1 RC1 candidate evaluated by tests and `release:monthly-flow-v1:gate`.

V1 is **not** silently executed on the production request path. Until comparison telemetry and promotion gates exist, candidate evaluation is explicit and deterministic.

## Core invariants

- Monthly focus palace and calendar stem/branch are independent coordinate systems.
- Calendar identity comes from the injected `MonthlyCalculationProvider.stemBranchForLunarMonth`, never from `palace.stem` / `palace.branch`.
- Monthly Tứ Hóa resolves from the monthly calendar stem to exact physical natal-star targets.
- V1 scores physical temporal evidence rather than previous-module final scores.
- Overall month scoring uses the explicit `overall` scope and monthly geometry; it does not fabricate an Annual Axes domain.
- Score, coverage, and confidence are separate outputs. Coverage/confidence never alter the numeric score.

## Legacy runtime

`v0.2/` and `v0.3-production/` remain only because stable production still depends on them. They are not the V1 implementation and must not be copied into another version tree. When V1 is explicitly promoted after a real shadow/comparison gate, delete the obsolete runtime cluster rather than archiving it in source control.
