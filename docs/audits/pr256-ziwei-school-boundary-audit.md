# PR #256 — Zi Wei School Boundary Characterization Audit

**Baseline:** `6d9718e379bda2692caf195287882f60ada9ff7c` (master after PR #255)
**Branch:** `refactor/pr256-ziwei-school-boundaries`
**STATUS:** COMPLETE (characterization + safe extraction)

## 1. Baseline

Authoritative baseline is master after PR #255 hygiene:

`refactor(core): remove verified stale code and harden repository hygiene`

Verified: branch ancestors `6d9718e379bda2692caf195287882f60ada9ff7c`.

## 2. Mission

1. Characterize Nam Phái vs Trung Châu Calculation Core boundaries.
2. Lock intentional differences with characterization tests.
3. Classify duplication into SAFE_SHARED / SCHOOL_POLICY / SCHOOL_ALGORITHM / KEEP_SCHOOL_LOCAL.
4. Extract only proven school-neutral mechanics.
5. Preserve every released ChartData / golden / API / Analysis result (delta = 0).

## 3. Authority matrix

```text
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC (unchanged this PR)
```

## 4. Pre-refactor engine inventory

| Engine | Path | Lines | Bytes |
| --- | --- | ---: | ---: |
| Nam Phái | `src/lib/ziwei/engine-nam-phai.ts` | 829 | 43291 |
| Trung Châu | `src/lib/ziwei/engine-trung-chau.ts` | 814 | 42903 |

## 5. School-boundary classification matrix

| Symbol / concern | Nam Phái | Trung Châu | Classification | Evidence | Planned action |
| --- | --- | --- | --- | --- | --- |
| Stem/branch/palace constants, brightness, MAIN/TIANFU offsets | identical | identical | SAFE_SHARED | Byte-equal | Extracted → `shared-primitives.ts` |
| `fix`, pillar helpers, `addStar`/`addCycle`, `getLuIndex` | identical | identical | SAFE_SHARED | Byte-equal | Extracted → `shared-primitives.ts` |
| `getCuc` / `getSoulBody` / `getZiweiStart` / nap-am / void / major fortunes | identical | identical | SAFE_SHARED | Proven identical | Extracted → `shared-chart-geometry.ts` |
| Annual-flow geometry (`adjustedLunarMonth`, `assignAnnualFlow`, …) | identical (comment drift only) | identical | SAFE_SHARED | Comment-stripped equal | Extracted → `shared-temporal.ts` |
| `TU_HOA` | Canh Khoa=`Thái Âm` | Canh Khoa=`Thiên Phủ` | SCHOOL_POLICY | ERQ-005 | Isolated → school policy modules |
| `STEM_KHOI_VIET` | Canh=`Ngọ/Dần` | Canh=`Sửu/Mùi` | SCHOOL_POLICY | Intentional | Isolated → school policy modules |
| `addHoaLinhStars` | Linh reverse | Linh forward | SCHOOL_ALGORITHM | Locked by tests | Kept school-local |
| Bác Sĩ direction | always forward | follows `directionSign` | SCHOOL_ALGORITHM | Locked by tests | Kept school-local |
| `annualPalace` / tiểu hạn fields | tiểu hạn populated | Thái Tuế; smallLimit null/`""` | SCHOOL_ALGORITHM | Locked by tests | Kept school-local |
| TC trùng bài / signature / majorMutagens | unset / absent / empty | populated | KEEP_SCHOOL_LOCAL | Locked by tests | Kept school-local |
| `assignAnnualFlow` school annualPalace decision | N/A (caller) | N/A (caller) | KEEP_SCHOOL_LOCAL | Orchestration | Engines still choose annualPalace |
| `STAR_ELEMENTS` / Hoa Cái dual paths | school packs | TC extras | UNCERTAIN_STOP | Partial overlap | Left local |
| `getMutagenRecords` / `getPhiFlows` | use school `TU_HOA` | use school `TU_HOA` | KEEP_SCHOOL_LOCAL | Need injected table for share | Deferred |
| `addMutagenStars` | no ĐV prefix map | `MUTAGEN_PREFIX` | KEEP_SCHOOL_LOCAL | DIFF | Left local |
| `resolve-major-fortune-mutagens.ts` | getEngine.tuHoaTargets | same | KEEP (defer) | Dependency debt | Out of scope |

## 6. Explicit intentional divergences (locked)

See `src/lib/ziwei/__tests__/school-boundaries.test.ts` (12 tests, frozen literals).

## 7. Extracted SAFE_SHARED symbols

| Symbol | Previous owners | New owner | Classification |
| --- | --- | --- | --- |
| STEMS, BRANCHES, CYCLE_BRANCHES, HOUR_BRANCHES, MONTH_NAMES, PALACES_*, PALACE_HAN, STEM_POLARITY, NAP_AM_ELEMENTS, CUC, BRIGHTNESS (internal), MAIN_OFFSETS, TIANFU_OFFSETS, TAI_TUE_CYCLE, DOCTOR_CYCLE, CHANG_SHENG_*, ELEMENT_*, STEM_SUPPORT, STEM_THIEN_TRU, TRIET_BY_STEM, LUU_* | both engines | `shared-primitives.ts` | SAFE_SHARED |
| `fix`, stem/pillar helpers, `getLuIndex`, `locTonIndex`, `addStar`/`addStarAtBranch`/`addCycle`, `ZiweiWorkingPalace` | both engines | `shared-primitives.ts` | SAFE_SHARED |
| `getNapAmElement`, `getElementRelation`, `getCuc`, `getSoulBody`, `getZiweiStart`, branch-index helpers, void helpers, `addChangSheng`, `assignMajorFortunes`, `findStar` | both engines | `shared-chart-geometry.ts` | SAFE_SHARED |
| `adjustedLunarMonth`, `getLNDVBase`, `calculateThang1`, `assignAnnualFlow`, `AnnualFlowResult` | both engines | `shared-temporal.ts` | SAFE_SHARED |

## 8. Kept school-local algorithms

| Concern | Owner | Reason |
| --- | --- | --- |
| Tứ Hóa tables | school policy modules | Intentional Canh Khoa divergence; ERQ-005 |
| Khôi/Việt tables | school policy modules | Intentional Canh divergence |
| Hỏa/Linh placement | school engines | Opposite Linh hour direction |
| Bác Sĩ direction | school engines | Nam forward vs TC `directionSign` |
| Nam Tiểu Hạn orchestration | Nam engine | `annualPalace` = tiểu hạn |
| TC annual palace = Thái Tuế | TC engine | Intentional |
| TC trùng bài names | TC engine | School-only fields |
| TC signature stars | TC engine | School-only pipeline |
| majorMutagens emit / ĐV prefix | TC (current) | Do not symmetrize |
| `getMutagenRecords` / `getPhiFlows` / `addMutagenStars` | school engines | Table/prefix ownership |
| `buildChartData` / `calculate*` | school engines | Orchestration boundaries |

## 9. Policy ownership

```text
src/lib/ziwei/schools/nam-phai-policy.ts
  → NAM_PHAI_TU_HOA, NAM_PHAI_KHOI_VIET

src/lib/ziwei/schools/trung-chau-policy.ts
  → TRUNG_CHAU_TU_HOA, TRUNG_CHAU_KHOI_VIET
```

Data-only. Engines import as local aliases `TU_HOA` / `STEM_KHOI_VIET`. No strategy interface. No hidden overrides.

## 10. Files created

| File | Phase |
| --- | --- |
| `docs/audits/pr256-ziwei-school-boundary-audit.md` | Commit 1 / finalized Commit 5 |
| `src/lib/ziwei/__tests__/school-boundaries.test.ts` | Commit 1 |
| `src/lib/ziwei/calculation/shared-primitives.ts` | Commit 2 |
| `src/lib/ziwei/calculation/shared-chart-geometry.ts` | Commit 3 |
| `src/lib/ziwei/calculation/shared-temporal.ts` | Commit 3 |
| `src/lib/ziwei/schools/nam-phai-policy.ts` | Commit 4 |
| `src/lib/ziwei/schools/trung-chau-policy.ts` | Commit 4 |

## 11. Files removed

None (duplicates deleted inside engines only).

## 12. Before / after dependency graph

### BEFORE

```text
engine-nam-phai.ts
├── shared mechanics duplicated
├── Nam policy (TU_HOA, STEM_KHOI_VIET)
├── Nam algorithms
└── Nam orchestration

engine-trung-chau.ts
├── shared mechanics duplicated
├── TC policy
├── TC algorithms
└── TC orchestration
```

### AFTER

```text
calculation/shared-primitives.ts
calculation/shared-chart-geometry.ts
calculation/shared-temporal.ts
└── deterministic school-neutral mechanics (no school conditionals)

schools/nam-phai-policy.ts
schools/trung-chau-policy.ts
└── static school-owned policy tables

engine-nam-phai.ts
└── Nam algorithms + orchestration

engine-trung-chau.ts
└── TC algorithms + orchestration

annual-flow.ts (unchanged SSOT)
lunar-vn (unchanged calendar SSOT)
```

## 13. Golden verification

`src/lib/ziwei/golden.test.ts`: PASS (92 cases). Diff under `tests/golden/**`: empty.

## 14. Test verification

- `school-boundaries.test.ts`: 12 passed
- golden: 92 passed
- typecheck / knip: see PR validation table

## 15. Unresolved / deferred debt

- ERQ-005 Canh Tứ Hóa — not decided
- Hoa Cái / Kiếp Sát path divergence — UNCERTAIN_STOP
- `STAR_ELEMENTS` base+extension — left local
- Share `getMutagenRecords`/`getPhiFlows` with injected tables — deferred (#257 candidate)
- `resolve-major-fortune-mutagens.ts` getEngine dependency direction — deferred
- Trung Châu Research Pack / narrative — out of scope

## Size report (NOT acceptance criteria)

| Artifact | Before lines/bytes | After lines/bytes |
| --- | --- | --- |
| Nam engine | 829 / 43291 | 464 / 22348 |
| TC engine | 814 / 42903 | 446 / 22043 |
| shared-primitives | — | 171 / 11284 |
| shared-chart-geometry | — | 197 / 8019 |
| shared-temporal | — | 93 / 3593 |
| nam-phai-policy | — | 23 / 1480 |
| trung-chau-policy | — | 23 / 1488 |

SIZE REDUCTION IS NOT ACCEPTANCE CRITERIA.
