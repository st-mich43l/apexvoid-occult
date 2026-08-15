# Palace Overview scoring rebuild (v2.1) — sources

Calibration / shadow / production remain **NO_GO**. Numeric seeds stay
heuristic. This note records **why** v2 scores were too harsh and which
primary/school texts the rebuild follows.

## Why the previous numbers were skewed

1. **武/暗 stars were encoded as negative quality.** Phá Quân Bình was
   net −3, Thất Sát −2, Cự Môn −1.5. Every Sát Phá Tham or Cự Nhật palace
   then scored ~15–18 even before Hãm.
2. **Hybrid brightness deltas reversed 吉/殺 identity** (Phá Quân Miếu
   forced above Thiên Phủ Hãm). That was an engineering test, not doctrine.
3. **Cự Nhật + Thái Dương Hãm** added `pressureDeltaWhenHam: 3.5` on top
   of already-negative Cự/Nhật seeds. Nam Phái calls that 口舌, not a
   ruined career palace.

## Sources used (no invented scripture quotes)

### Chinese / classical (三合, *Nam phái gốc Hán*)

- 《紫微斗數全書》卷一 *太微賦* (public text, iztro ancientBook-1):
  **「吉星入垣則為吉，兇星失地則為兇」**; **「行限逢乎弱地未必為災」**.
- 《全書》卷二 star essays (iztro ancientBook-2):
  - 巨門: **北鬥化暗，主是非**; 入廟可和平; 陷地 口舌/官非.
  - 七殺: **廟旺有謀略，遇帝為權**; 陷+羊陀火鈴 mới **殘疾下局**.
  - 太陽: **廟旺終身富貴，陷地雖化權祿也兇** — Hãm matters, but as
    *失地 of a 貴 star*, not a license to invert a 殺星 over a 吉星.
- School map: 三合/南派 = 《全書》《全集》+ 三方四正 + 格局; 中州 =
  星系 (bibliographic only in this repo); 四化派 weights 四化 over 14
  majors. Palace Overview remains a 三合-style TP4C frame.

### Nam Phái Việt Nam (in-repo KB, not numeric)

- `backend/app/kb/data/nam_phai/cach_cuc_kinh_dien.md`: four styles
  (Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật). SPT is
  **hành động / mạo hiểm**, đắc địa = nghiệp lớn, hãm+sát = giang hồ —
  not “low score by default”.
- `trang_thai_va_tuong_tac_sao.md`: Miếu/Vượng = ưu điểm; Hãm = mặt trái.
  Cự Môn **cần Hóa Lộc/Khoa** (口才 sinh tài). Sát tinh **đắc địa** can be
  暴發, not automatic phá bại.
- `tu_hoa_tam_phap.md`: Hóa Lộc is opportunity, not a second star.
- `nguyen_tac_luan_giai.md`: never judge one palace in isolation (TP4C).

Locator for 全書 sections already in `doctrine/source-registry.json`
(`src-ziwei-quanshu-juan-er`, `src-ziwei-quanshu-miao-wang-xian`).
Nam Phái VCD remains `UNRESOLVED_NAM_PHAI_VCD`.

## What changed in the model

| Layer | v2.0 (skewed) | v2.1 (this rebuild) |
|---|---|---|
| Brightness | multiply + additive polarity | **multiply only** (amplitude) |
| 武/暗 Bình net | strongly negative | **≈ 0**, high activation |
| Cự Nhật Hãm | pressure +3.5, support ×0.2 | pressure +1.0, support ×0.5 (口舌) |
| SPT ham | pressure +2.0 | pressure +1.0 |
| Tứ Hóa as transform | kept | kept |
| Formation recognition | kept | kept |
| Calibration | null | still null |

Cần thầy duyệt: 武-star seed rebalance and Cự Nhật ham magnitudes. No
expert reviews added.
