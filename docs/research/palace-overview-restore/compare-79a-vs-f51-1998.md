# Palace Overview restore — 79a vs f51 (1998 male Dần Nam Phái)

79a baseline: `79a39c9a6d2b7342e73e1a13c2c93ac0a315d4ae` (PO-PRE-V2-79A39C9 / pre-PR#215)
f51 baseline: `f51ff20c40f9354cd7872ae259bb5e7485d1f3a2` (current #238 V2)

## Decision hint

**PRE_V2_BASELINE_DOES_NOT_RESOLVE_RADAR**

Stop rule: if 79a still shows the same near-ceiling Dần–Ngọ–Tuất cluster (≥2 palaces ≥85), do **not** restore production.

## Dần–Ngọ–Tuất

| Palace | Branch | 79a (pre-V2) | f51 (V2) | Δ score |
|---|---|---:|---:|---:|
| **Tật Ách** | Dần | **93.6** | 90.3 | 3.3 |
| **Huynh Đệ** | Ngọ | **86.5** | 84.6 | 1.9 |
| **Điền Trạch** | Tuất | **85.2** | 85.8 | -0.6 |

## All 12 palaces

| Palace | Branch | 79a | f51 | Δ | band79a | bandF51 |
|---|---|---:|---:|---:|---|---|
| Tật Ách ** | Dần | 93.6 | 90.3 | 3.3 | strong | strong |
| Tài Bạch | Mão | 38.3 | 66.9 | -28.6 | balanced | balanced |
| Tử Tức | Thìn | 54.3 | 77.5 | -23.2 | supportive | supportive |
| Phu Thê | Tỵ | 14.2 | 48.6 | -34.4 | guarded | guarded |
| Huynh Đệ ** | Ngọ | 86.5 | 84.6 | 1.9 | strong | strong |
| Mệnh | Mùi | 37.9 | 76.6 | -38.7 | balanced | supportive |
| Phụ Mẫu | Thân | 71.9 | 76.2 | -4.3 | strong | supportive |
| Phúc Đức | Dậu | 31.3 | 35.2 | -3.9 | balanced | guarded |
| Điền Trạch ** | Tuất | 85.2 | 85.8 | -0.6 | strong | strong |
| Quan Lộc | Hợi | 20.8 | 55.6 | -34.8 | guarded | balanced |
| Nô Bộc | Tý | 55.8 | 76.1 | -20.3 | supportive | supportive |
| Thiên Di | Sửu | 21.4 | 66.9 | -45.5 | guarded | balanced |

## Final decision

**PRE_V2_BASELINE_DOES_NOT_RESOLVE_RADAR**

Production restore was **not** performed. 79a still shows ≥2 Dần–Ngọ–Tuất palaces ≥85 (actually all three ≥85), with Tật Ách higher than f51 V2.

No new scoring formula was invented in this PR.

## Three-way 1998 scores (historical fixtures only)

| Palace | Branch | V1.2/0ac | V1.3/79a | V2/f51 |
|---|---|---:|---:|---:|
| Tật Ách ** | Dần | 92.2 | 93.6 | 90.3 |
| Tài Bạch | Mão | 69.0 | 38.3 | 66.9 |
| Tử Tức | Thìn | 62.7 | 54.3 | 77.5 |
| Phu Thê | Tỵ | 41.4 | 14.2 | 48.6 |
| Huynh Đệ ** | Ngọ | 86.8 | 86.5 | 84.6 |
| Mệnh | Mùi | 66.3 | 37.9 | 76.6 |
| Phụ Mẫu | Thân | 73.4 | 71.9 | 76.2 |
| Phúc Đức | Dậu | 60.0 | 31.3 | 35.2 |
| Điền Trạch ** | Tuất | 86.5 | 85.2 | 85.8 |
| Quan Lộc | Hợi | 53.2 | 20.8 | 55.6 |
| Nô Bộc | Tý | 61.9 | 55.8 | 76.1 |
| Thiên Di | Sửu | 48.1 | 21.4 | 66.9 |

Production remains the current #238 f51 V2 restore pending human direction.
**No production code changed in this stop commit.**

