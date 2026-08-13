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

## Modules

| Module | Status |
|--------|--------|
| palace-overview | V1, default ON |
| annual-axes | V0.8 Nam Phái / V0.2 Trung Châu |
| major-fortune | V0.5 integration, default ON |
| monthly-flow | V0.3 Nam Phái / V0.1.2 Trung Châu, default ON |

## Share rules

May share: typed facts, frame geometry, source registry, school profile, explanation primitives.

Must not share directly: weights, normalization scale, final score formula, acceptance ranges, domain projection.
