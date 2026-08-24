# Zi Wei Analysis

Analysis modules interpret facts from Calculation Core. They do **not** an sao.

## Calculation vs Analysis

```text
Calculation Core:
- an lá số;
- an cung;
- an sao;
- lịch pháp;
- lưu hạn;
- không đưa ra điểm vận khí.

Analysis Modules:
- diễn giải facts từ Calculation Core;
- độc lập theo từng scope;
- có version;
- có school policy;
- có data governance.
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

## Modules

| Module | Runtime | Notes |
|--------|---------|-------|
| palace-overview | V2 numeric knowledge `2.0.0-experimental`, engine `1.3.0` | Score = net quality after empirical offset. Tứ Hóa is a host-star transform. Scoring calibration **NO_GO** until expert labels. See `modules/palace-overview/README.md`. |
| annual-axes | V0.10.0 Nam Phái / V0.2 Trung Châu | Nam Phái layered fortune (experimental/uncalibrated). Frozen V0.8 remains annual-trigger kernel + research control only. |
| major-fortune | V0.5.5 (`0.5.5`) | Four-pillar ordinal; Tứ Hóa = natal chiếu only (both schools) |
| monthly-flow | Stable `production.ts` V0.3; V1 RC1 is `analyze.ts` | V1 is not silently executed on the production path. Gate: `npm run release:monthly-flow-v1:gate` |

## Share rules

May share: typed facts, frame geometry, source registry, school profile, explanation primitives.

Must not share directly: weights, normalization scale, final score formula, acceptance ranges, domain projection.
