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
| palace-overview | V1 numeric knowledge `1.2.0-experimental`, engine `1.3.0` | Score = net quality. Scoring calibration **NO_GO** until expert labels. See `modules/palace-overview/README.md`. |
| annual-axes | V0.8 Nam Phái / V0.2 Trung Châu | School-split knowledge packs |
| major-fortune | V0.5 integration (`0.5.0`) | Four-pillar ordinal formula version is independent |
| monthly-flow | Stable `production.ts` V0.3; V1 RC1 is `analyze.ts` | V1 is not silently executed on the production path. Gate: `npm run release:monthly-flow-v1:gate` |

## Share rules

May share: typed facts, frame geometry, source registry, school profile, explanation primitives.

Must not share directly: weights, normalization scale, final score formula, acceptance ranges, domain projection.
