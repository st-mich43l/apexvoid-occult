# PR #261 — Trung Châu Tứ Hóa Impact Closure Audit

**Baseline:** `b9a2e2e033daa6038ca54c46e41f48fccabb7d69` (master after PR #260)  
**Branch:** `research/pr261-trung-chau-tu-hoa-impact-closure-v03`  
**STATUS:** CURRENT

## 1. Baseline

Master matches expected SHA. No intervening commits.

## 2. Mission

Turn the two-cell Wang candidate into a **migration-ready** decision packet by
exhaustively measuring shadow blast radius — **released runtime delta = 0**.

## 3. Authority boundaries

Research ≠ runtime. Candidate table lives only under the research pack.
Engines / `schools/**` unchanged. No second engine.

## 4. Previous V0.2 finding

`goldenCasesPotentiallyAffected = 9` was **direct natal stem-hit scope**
(yearStem Mậu×4 + Nhâm×5), not full ChartData/PhiFlow radius.
`goldenCasesInspected = 92` was incorrect (TC golden = **45**).
V0.2 file preserved as provenance.

## 5. Candidate table

| Stem | Runtime Khoa | Candidate Khoa |
| --- | --- | --- |
| Mậu | Hữu Bật | Thái Dương |
| Canh | Thiên Phủ | Thiên Phủ |
| Nhâm | Tả Phụ | Thiên Phủ |

Structural test: difference count = **2**.

## 6. Source/evidence additions

No new bibliographic sources in this PR (skip empty source commit).
Authority chain remains V0.2 lecture + published-work reproduction.

## 7. Natal impact

**9 / 45** golden cases (`yearStem` Mậu or Nhâm) change Khoa target.

## 8. Annual impact

**0 / 45** — **COVERAGE GAP**: no golden annualStem Mậu/Nhâm.

## 9. Major Fortune impact

**9 / 45** when active major palace stem is Mậu or Nhâm.

## 10. PhiFlows impact

**45 / 45** — every chart has Mậu and Nhâm palace stems; Khoa target star moves
(Hữu Bật→Thái Dương / Tả Phụ→Thiên Phủ). All current and candidate targets
resolved in golden.

## 11. Monthly Flow impact

10 annual stems × 12 months = 120 rows; **24** rows have calendarStem Mậu/Nhâm
and change Khoa. No Monthly Flow code/scoring change.

## 12. Golden corpus coverage

| Dimension | Covered? |
| --- | --- |
| Natal Mậu/Nhâm | Yes (4+5) |
| Annual Mậu/Nhâm | **No (gap)** |
| Major Mậu/Nhâm | Yes (5+4) |
| PhiFlow Mậu/Nhâm palace stems | Yes (45/45) |

## 13. Candidate blast-radius statistics

```text
goldenCasesTotal: 45
natalDelta: 9
annualDelta: 0
majorDelta: 9
phiFlowDelta: 45
decorationDelta: 17
anyMutagenDelta: 45
monthlyKhoaDeltaRows: 24/120
```

## 14. Analysis dependency map

Palace Overview: indirect · Annual Axes: direct · Major Fortune: direct ·
Monthly Flow: direct. Documented as physical-input propagation only.

## 15. ERQ-005 status

**expert_pending**. Software does not choose.

## 16. Protected-path verification

Empty diff expected on schools, engines, calculation, golden, contracts, API.

## 17. Validation results

Filled in PR body after suite run.

## 18. Unresolved findings

- Annual-stem coverage gap
- Authenticated edition still unavailable
- Broad PhiFlow blast radius must be accepted in any #262 migration plan

## 19. Human decision required

See **Cần thầy duyệt**.

## 20. Recommended next PR

If expert selects `APPROVE_MAU_AND_NHAM`:

```text
#262 fix(ziwei): correct Trung Châu Mậu and Nhâm Tứ Hóa Khoa
```

Only two policy cells + explicit golden migration. No refactor.
