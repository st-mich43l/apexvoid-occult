# Palace Overview v2 knowledge model

Status: experimental. Calibration / shadow / production: **NO_GO**.
`calibrationVersion` remains `null`. Zero expert reviews added.

This note describes the **knowledge-layer** change. Numeric scores move
because Tứ Hóa, formations, void-on-rules, and a re-derived offset changed
— not because a palace was tuned.

## Tứ Hóa is a transform of the host star

Previously the engine emitted two independent evidence rows (e.g. `Cự Môn
Hãm` plus `Hóa Lộc→Cự Môn`) and added them. Hóa Lộc is not a neighbour star;
it changes Cự Môn.

Runtime order (locked by test):

```
seed → brightness (multiply) → brightness (additive delta) → Tứ Hóa delta
     → clamp support/pressure ≥ 0 → × geometryWeight → diminishing → void
```

Catalog: `transformation-matrix.v1.json`. 40 cells = union of Nam Phái and
Trung Châu `TU_HOA` (read-only). Thiên Tướng and Thất Sát have no cells.
Unknown `(star, hóa)` at runtime → `diagnostics.unmappedTransformations`.

Fallback cells copy the old four-constant seeds in `transformations.json`.

### Fill status: 12 / 40

Filled (`usesFallback: false`), heuristic, Cần thầy duyệt:

| Star | Hóa | Notes |
|---|---|---|
| Cự Môn | Lộc | Ám tinh → tài khẩu thiệt. `pressureDelta` negative. |
| Cự Môn | Kỵ | Khẩu thiệt nặng hơn. |
| Thái Dương | Lộc / Kỵ | |
| Thái Âm | Lộc / Kỵ | |
| Vũ Khúc | Lộc / Kỵ | |
| Liêm Trinh | Lộc / Kỵ | |
| Tham Lang | Lộc / Kỵ | |

Still `usesFallback: true` (28 cells): Tử Vi Quyền/Khoa; Thiên Cơ Lộc/Quyền/Khoa/Kỵ;
Thái Dương Quyền; Vũ Khúc Quyền/Khoa; Thiên Đồng Lộc/Quyền/Kỵ; Thiên Phủ Khoa;
Thái Âm Quyền/Khoa; Tham Lang Quyền; Cự Môn Quyền; Thiên Lương Lộc/Quyền/Khoa;
Phá Quân Lộc/Quyền; Văn Xương Khoa/Kỵ; Văn Khúc Khoa/Kỵ; Tả Phụ Khoa; Hữu Bật Khoa.

## Formations (3 → 8)

| id | Recognition | Đắc cách | Phá cách |
|---|---|---|---|
| rule-tu-phu-vu-tuong | four principals in TP4C | ≥2 Miếu/Vượng/Đắc | weak factors if not |
| rule-co-nguyet-dong-luong | four principals in TP4C | — | hamThreshold on participants |
| rule-sat-pha-tham | three principals in TP4C | good brightness + benefic hóa | Kỵ / ham |
| rule-cu-nhat | Cự Môn + Thái Dương in TP4C | Thái Dương Miếu/Vượng | Thái Dương Hãm (`pressureDeltaWhenHam` strong); Tuần/Triệt attenuation |
| rule-song-loc | Lộc Tồn + Hóa Lộc in TP4C | presence | Tuần/Triệt |
| rule-loc-quyen-hoi | Hóa Lộc + Hóa Quyền in TP4C | presence | Tuần/Triệt |
| rule-khoa-quyen-loc | Lộc + Quyền + Khoa in TP4C | all three | Tuần/Triệt |
| rule-kinh-da-giap-ky | Hóa Kỵ on focus; Kình + Đà on adjacent palaces | n/a (phá cách) | support 0 |

All formation `baseAxes` are **interaction deltas**, not a second star copy.

Structural-rule evidence now goes through `applyLocalVoidAttenuation` in the
same pass as other evidence (`localStructuralMagnitudeFactor` 0.6 / 0.4).

## Brightness

Hybrid multiply + additive delta (already in v1.3). Apply order vs Tứ Hóa is
now locked: brightness first, then hóa.

## Offset and bands

After Phases 1–3, nam-phai 500-chart corpus median `(support − pressure)` was
**+7.75**. `quality.offset` set to **7.8** (engineering correction).

Band cuts copied from `research:palace-overview:derive-bands` (not hand-tuned):

`low ≤13`, `guarded <30.8`, `balanced <49.1`, `supportive <69`, else `strong`.

Pre-v1.3 (additive Tứ Hóa, no offset): median score ~65.5.
Post-v2 (this model + offset 7.8): median ~50 on the invariant corpus.

## Score is still 2-axis

Production `computeRadarScore` uses support and pressure only. Radar shows
four axes. Four-axis candidate (`w_st=0.15`) remains off by default.

## Freeze

`score-freeze-v1-3` snapshots were regenerated because the knowledge model
changed. That is expected. Do not treat a REGRESSION palace score as a
tuning target. Quan Lộc with Thái Dương Hãm at Tý is not đắc cách Cự Nhật.
