# PR #263 — Zi Wei temporal contract hardening audit

## Scope

Post-#262 engineering hardening only:

1. Annual Heavenly Stem golden coverage (10/10, including Mậu/Nhâm)
2. FlowMonthEntry legacy stem/branch contract characterization + deprecation docs
3. Monthly focus vs calendar independence tests
4. Annual Axes `isAnnualAxesEnabled()` kill-switch wired into `getAnalysisStatus`

No doctrine table changes. No Analysis formula/weight changes.

## Baseline

```text
Baseline SHA: 945fc063019aec2b0a6e1cd4936f4e88e33a7f1a
```

## Golden migration

| Metric | Value |
| --- | --- |
| Existing golden cases before | 45 |
| Existing golden cases after | 45 (IDs preserved) |
| New golden cases | +10 (`annual-stem-2014`…`annual-stem-2023`) |
| Total after | 55 per school |
| Annual stem coverage before | 2 / 10 (Bính, Canh) |
| Annual stem coverage after | **10 / 10** |
| Mậu annual coverage | absent → **present** (`annual-stem-2018`) |
| Nhâm annual coverage | absent → **present** (`annual-stem-2022`) |
| `EXPECTED_NEW_CORPUS` | 10 per school |
| `UNEXPECTED_EXISTING_CASE_DELTA` | **0** |

Append-only migration via `scripts/pr263-append-annual-stem-goldens.ts`.
Existing case outputs were deep-compared against baseline before append.

## Temporal contract

| Field | Posture |
| --- | --- |
| `FlowMonthEntry.month` | lunar month ordinal |
| `FlowMonthEntry.palace` | monthly focus placement |
| `FlowMonthEntry.stem/branch` | legacy palace-derived; `@deprecated` for calendar |
| Calendar identity | `stemBranchForLunarMonth(annualStem, lunarMonth)` |
| Runtime value delta | **0** |

Consumer map confirmed Monthly Flow already ignores legacy fields for calendar.
No production consumer treats them as calendar authority.

## Annual Axes kill-switch

```text
getAnalysisStatus("annual-axes")
  → isAnnualAxesEnabled()?
       false → unavailable / rebuilding
       true  → school knowledge resolution (unchanged)
```

Applies to both Nam Phái and Trung Châu. Formulas/versions unchanged.

## Impact matrix (expected)

| Surface | Delta |
| --- | --- |
| FlowMonthEntry runtime values | 0 |
| Monthly Flow V1 numeric | 0 |
| Annual Axes numeric | 0 |
| Major Fortune numeric | 0 |
| Palace Overview numeric | 0 |
| Nam Phái Calculation Core (existing cases) | 0 |
| Trung Châu Calculation Core (existing cases) | 0 |
| API / OpenAPI | 0 |
| Backend | 0 |
| UI scoring | 0 |
| Workflows | 0 |
| Dependencies | 0 |

## Research provenance

- `CTR-TC-004`: remains `open` with `resolution: null` (validator rule); PR #263
  note appended to description (`@deprecated` for calendar interpretation)
- `RQ-TC-012`: `partially_resolved` (deprecated + test-guarded; removal deferred)
- Historical evidence text preserved; research pack still non-runtime
- V0.3 impact-compare corpus scoped to pre-`annual-stem-*` 45 cases

## Cần thầy duyệt

None — no doctrine decision intended.

## Nghi vấn bug engine cũ

None observed.

## Phát hiện thêm

None blocking.

## Recommended next PR

`#264 research(analysis): measure post-Trung-Chau correction sensitivity across temporal modules`
