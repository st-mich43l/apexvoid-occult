# Palace Overview recentering v1.3

Status: engineering correction, **not** calibration. `calibrationVersion` remains `null`. `releaseStage` remains `experimental`. Zero expert reviews.

## Method

Measured on natal Palace Overview scores (engine `nam-phai`, later confirmed on `trung-chau`).

`computeRadarScore` mapped `qualityRaw = support − pressure` through logistic(scale=8) with midpoint 50. Raw `support − pressure` has median ≈ **+5.1**, not 0, so score 50 sat near the 30th percentile.

## Category bias (pre-offset, 1584 palaces)

| Category | avg support | avg pressure | net |
|---|---|---|---|
| major-star | 14.99 | 10.18 | **+4.81** |
| transformation | 1.24 | 0.75 | +0.49 |
| structural-rule | 0.66 | 0.32 | +0.34 |
| chang-sheng | 0.42 | 0.41 | +0.01 |
| void-environment | 0.00 | 0.05 | −0.05 |
| minor-star-family | 4.47 | 4.85 | −0.38 |

14 chính tinh catalog net = **+28.5**. Frame weights `1.0 + 0.5 + 0.3×2 = 2.1` over 12 palaces:

`28.5 × 2.1 / 12 = 4.99` ≈ measured +4.81.

## Offset

`qualityRaw = support − pressure − offset` with `offset = 7.4` after hybrid brightness deltas (re-derived: median raw net ≈ +7.38 on the 500-chart nam-phai corpus). Initial Phase 1 seed was 5.0.

After offset, median score on a 42-chart × 12 palace matrix (n=504/school):

| school | median | mean | strong | low |
|---|---|---|---|---|
| nam-phai | 51.6 | 51.93 | 14.5% | 8.1% |
| trung-chau | 50.1 | 50.57 | 13.1% | 8.3% |

## Freeze snapshot delta — 1991-09-21 Dậu female

V1.2 score = logistic((support−pressure)/8). V1.3 = logistic((support−pressure−5)/8). Raw axes unchanged.

### nam-phai

| Palace | V1.2 | V1.3 | band V1.3 |
|---|---|---|---|
| Phúc Đức | 68.2 | 53.4 | balanced |
| Điền Trạch | 44.3 | 29.9 | guarded |
| Quan Lộc | 38.9 | 25.4 | guarded |
| Nô Bộc | 63.0 | 47.7 | guarded |
| Thiên Di | 75.1 | 61.8 | supportive |
| Tật Ách | 42.1 | 28.0 | guarded |
| Tài Bạch | 45.4 | 30.8 | guarded |
| Tử Tức | 64.2 | 49.0 | guarded |
| Phu Thê | 52.3 | 36.9 | guarded |
| Huynh Đệ | 40.7 | 26.8 | guarded |
| Mệnh | 61.0 | 45.6 | guarded |
| Phụ Mẫu | 68.5 | 53.8 | balanced |

### trung-chau

| Palace | V1.2 | V1.3 | band V1.3 |
|---|---|---|---|
| Phúc Đức | 65.0 | 49.9 | guarded |
| Điền Trạch | 42.3 | 28.2 | guarded |
| Quan Lộc | 37.6 | 24.4 | guarded |
| Nô Bộc | 64.4 | 49.2 | guarded |
| Thiên Di | 74.3 | 60.8 | supportive |
| Tật Ách | 39.7 | 26.0 | guarded |
| Tài Bạch | 41.8 | 27.8 | guarded |
| Tử Tức | 64.8 | 49.7 | guarded |
| Phu Thê | 50.0 | 34.9 | guarded |
| Huynh Đệ | 39.4 | 25.8 | guarded |
| Mệnh | 59.2 | 43.7 | guarded |
| Phụ Mẫu | 71.3 | 57.0 | balanced |

## Distribution before / after (compact matrix n=504)

Before (published 672-chart nam-phai baseline): median 65.5, strong 29.1%, low 2.0%.

## Band thresholds

Copied from `score-distribution.v1.json` (1000 charts × 12 palaces, both schools) after review:

| cut | V1.2 | V1.3 (quantile) |
|---|---|---|
| lowMaxInclusive | 24 | 13.9 (p10) |
| guardedMaxExclusive | 50 | 31.3 (p30) |
| balancedMaxExclusive | 60 | 49.1 (p50) |
| supportiveMaxExclusive | 75 | 67.4 (p75) |

Do not hand-edit. Re-run `npm run research:palace-overview:derive-bands` when seeds change.

