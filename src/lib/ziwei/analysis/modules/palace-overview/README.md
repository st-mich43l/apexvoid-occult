# palace-overview

Khí vận tổng thể 12 cung — static natal analysis.

## Production (Nam Phái)

**Scoring Formula V2** from closed PR #211 (`8161476`, `PO-SCORING-FORMULA-V2-PR211`):

- `S_base` (Miếu/Vượng/Đắc/Bình/Hãm + natal Tứ Hóa + Lục Cát/Sát)
- Tuần/Triệt sign-flip
- TP4C / VCD network weights (self 0.6 / opposite 0.25 / each trine 0.075)
- Logistic map, scale **12**, midpoint 50
- Formation multiplier **K off**

Display path: `analyzePalaceOverviewDisplay()` → `analyzeAllPalacesV2()` for Nam Phái
when `isPalaceOverviewV2Enabled()` (default ON).

Rollback: `?ziweiPalaceOverviewV2=0` or `VITE_ZIWEI_PALACE_OVERVIEW_V2=false`.

Trung Châu stays on the legacy evidence → `analyzeAllPalaces()` path.

Radar radius = `result.score / 100` with no React rescoring. Badge: **V2 FORMULA**.

Annual Axes / Major Fortune / Monthly Flow are **out of scope** for this module’s
numeric path.

## Historical controls (not production)

Fixtures under `__fixtures__/palace-overview.numeric-baseline.{0ac04ad,79a,f51,pr211}.*`
document prior restore attempts. Only `pr211` gates production equality.

## Layout

See `v2/` for Formula V2 engine; legacy evidence/structure-quality remain for
Trung Châu, research candidates, and historical comparison.
