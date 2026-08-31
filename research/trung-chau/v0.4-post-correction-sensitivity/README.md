# Trung Châu v0.4 — Post-correction sensitivity (PR #265)

**STATUS:** RESEARCH_ONLY  
**Runtime authority:** false

## Question

Measure how the already-approved Trung Châu Mậu/Nhâm Hóa Khoa physical
corrections propagate through Analysis modules while holding scoring,
geometry, and release policy constant.

## Correction under test

```text
Mậu Khoa: Hữu Bật → Thái Dương
Nhâm Khoa: Tả Phụ → Thiên Phủ
Canh Khoa unchanged (Thiên Phủ)
```

## How to regenerate

```bash
npm run research:trung-chau:post-correction-sensitivity
```

Run twice and confirm `sensitivity-report.json` is byte-identical.

## Artifacts

- `sensitivity-report.json` — deterministic machine-readable report
- `REPORT.md` — human-readable summary generated from the same run

## Harness location

Executable research code lives under:

`src/lib/ziwei/analysis/research/trung-chau-post-correction-sensitivity/`

Historical #261/#262 blast-radius artifacts under
`trung-chau-research-v0/` remain immutable and continue to exclude
`annual-stem-*` cases. This generation uses the full current 55-case TC corpus.
