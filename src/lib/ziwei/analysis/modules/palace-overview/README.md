# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

Numeric scoring knowledge: **2.0.0-experimental** (linear-net, ceiling 100).
Engine: **1.3.0** (trace, confidence metadata, calibration tooling).
Release stage: **experimental**. Research: **READY_FOR_EXPERT_DATA_COLLECTION**.
Collection: **READY** (infrastructure; zero invented expert reviews).
Corpus: **PILOT_READY** (five structural cases; no human reviews yet).
Calibration / shadow / production: **NO_GO**.

Feature flag `ziweiPalaceOverviewV1`.

The 0–100 **radar** is **per palace**: `50 + 50 tanh(net / (Miếu√2))`.
Geometry: bản cung 1.0, tam hợp 0.12, xung 0.1. Hãm is 失势 (|Hãm|=Đắc), not empty.
用 is capped at 0.5 Miếu and does not raise a palace already at one Miếu 体.
同宫 majors diminish (1 / 0.35 / 0.12) — Tử Phủ is not two Miếu stacked.

1. **Độ sáng** of majors on bản cung + tam hợp (Miếu…Hãm) and Tứ Hóa on the host.
2. **Xung chiếu** on those brightness nets (phá cách / cứu giải).
3. **Bộ sao** in `structural-rules.json` (Tử Phủ, SPT, Cự Nhật, …) — listed
   as `via-structural-rule` in `nam-phai-star-systems.v1.json` (no double count).
4. **Vòng Thái Tuế** — 4 tam hợp from `vong_thai_tue_tinh_cach.md`.
5. **Lộc Tồn** in this palace’s TP4C; Hao / Không Kiếp phá Lộc.
6. **Tổ hợp numeric** from the same catalog (Tả Hữu, Khôi Việt, Xương Khúc,
   Không Kiếp, Kình Đà, Hỏa Linh, Tham Hỏa/Linh, Lộc Mã, ngựa què, …).
   Bác Sĩ tam hợp is **discovery-only** until teacher polarity.

Example: Vô chính diệu `voidContext` `{support: 0, pressure: 0.3,
stability: -1.0, activation: 0.5}` moves quality by −0.3 raw (under 1
score point). The `stability: -1.0` term is invisible to the score.
Tuần/Triệt `stabilityDelta` and Hóa Quyền `activation: 2.0` likewise do
not enter the 0–100 number.

A research-only four-axis candidate (`w_st = 0.15`) exists behind CLI
`research:palace-overview:compare-four-axis`. It is **not** default.
Calibration / shadow / production remain **NO_GO**.

## Layout

```text
palace-overview/
  analyze-all-palaces.ts
  analyze-palace.ts
  collect-evidence.ts
  aggregate-evidence.ts
  normalize-result.ts
  evaluate-structural-rules.ts
  *annotations*.ts          semantic layer (does not change scores)
  types.ts
  benchmark.ts              seed-case runner (dev/test only)
  scoring/                  traces, dedup, parameter registry, invariants
  calibration/              split, metrics, sensitivity, distribution
  __tests__/
```

Knowledge: `src/lib/ziwei/analysis/knowledge/palace-overview/v1/`
UI: `src/components/ziwei/analysis/`
Docs: `docs/research/palace-overview-score-semantics.md`
Gate: `npm run release:palace-overview:gate`

Pipeline: natal facts → static frame → evidence (Tứ Hóa applied on the host
star after brightness) → structural interaction deltas (then Tuần/Triệt
attenuation once) → aggregation → normalization.

Tứ Hóa matrix: 12 / 40 cells filled with star-specific heuristic deltas;
the rest `usesFallback: true` (old four-constant seeds). See
`docs/research/palace-overview-v2-knowledge-model.md`.

Calibration and sensitivity tools are scripts/tests. They are not run in the UI.
