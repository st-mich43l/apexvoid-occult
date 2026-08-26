# Zi Wei Analysis

Analysis modules interpret facts from Calculation Core. They do **not** an sao.

**Architecture SSOT:** [`docs/architecture/`](../../../../docs/architecture/README.md)

## Calculation vs Analysis

```text
Calculation Core:
- an lá số / an cung / an sao / lịch pháp / lưu hạn
- không đưa ra điểm vận khí

Analysis Modules:
- diễn giải facts từ Calculation Core
- độc lập theo từng scope
- có version / school policy / data governance
```

## Layout

```text
analysis/
  facts/        natal fact identity (Calculation Core → typed facts)
  frame/        static TP4C geometry
  knowledge/    JSON catalogs (palace-overview, annual-axes, major-fortune, monthly-flow)
  modules/      one folder per product module
  contracts/    availability / version surface for UI
  feature-flags.ts
```

## Modules (current)

| Module | Runtime | Notes |
|--------|---------|-------|
| palace-overview | **V1.2 FROZEN** (`1.2.0-experimental`) | Static 12-palace structure. Year-invariant. See module README. |
| annual-axes | **V0.11** Nam Phái / **V0.2** Trung Châu | Released experimental/uncalibrated. V0.12 = immutable control; V0.13 = doctrine research. Canonical: [`docs/architecture/annual-axes.md`](../../../../docs/architecture/annual-axes.md). |
| major-fortune | ordinal runtime | Decade evidence; may project into Annual Axes decade layer |
| monthly-flow | Stable production path; V1 gated | Must not contaminate natal static evidence. Gate: `npm run release:monthly-flow-v1:gate` |

## Share rules

May share: typed facts, frame geometry, source registry, school profile, explanation primitives.

Must not share as numeric inputs across products: weights, normalization scale, final score formula, acceptance ranges, domain projection, Palace Overview scores/`rawAxes` into Annual Axes.
