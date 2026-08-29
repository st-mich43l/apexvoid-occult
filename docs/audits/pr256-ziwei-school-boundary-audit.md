# PR #256 — Zi Wei School Boundary Characterization Audit

**Baseline:** `6d9718e379bda2692caf195287882f60ada9ff7c` (master after PR #255)
**Branch:** `refactor/pr256-ziwei-school-boundaries`
**STATUS:** CHARACTERIZATION (Commit 1) — no Calculation Core source extraction yet

## 1. Baseline

Authoritative baseline is master after PR #255 hygiene:

`refactor(core): remove verified stale code and harden repository hygiene`

Verified locally: `git rev-parse HEAD` = `6d9718e379bda2692caf195287882f60ada9ff7c`.

## 2. Mission

1. Characterize Nam Phái vs Trung Châu Calculation Core boundaries.
2. Lock intentional differences with characterization tests.
3. Classify duplication into SAFE_SHARED / SCHOOL_POLICY / SCHOOL_ALGORITHM / KEEP_SCHOOL_LOCAL.
4. Extract only proven school-neutral mechanics later (Commits 2–4).
5. Preserve every released ChartData / golden / API / Analysis result (delta = 0).

## 3. Authority matrix

```text
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC (unchanged this PR)
```

Do not introduce backend calculation. Do not move placement to Python.

## 4. Pre-refactor engine inventory

| Engine | Path | Lines | Bytes |
| --- | --- | ---: | ---: |
| Nam Phái | `src/lib/ziwei/engine-nam-phai.ts` | 829 | 43291 |
| Trung Châu | `src/lib/ziwei/engine-trung-chau.ts` | 814 | 42903 |

Already shared (do not replace):

- `src/lib/ziwei/annual-flow.ts` — small-limit ring, LNDV index, flow-month geometry
- `src/lib/calendar/lunar-vn` — solar↔lunar

Both engines must continue to exist as orchestration boundaries.

## 5. School-boundary classification matrix

Classifications:

- **SAFE_SHARED** — identical inputs/outputs/side effects/school-neutral meaning; candidate for extraction after tests green
- **SCHOOL_POLICY** — static school-owned doctrine data; isolate into policy modules, never merge
- **SCHOOL_ALGORITHM** — school-owned placement/orchestration logic; keep as named school functions
- **KEEP_SCHOOL_LOCAL** — school pipeline / orchestration / packs; do not share
- **UNCERTAIN_STOP** — do not extract in #256

| Symbol / concern | Nam Phái | Trung Châu | Classification | Evidence | Planned action |
| --- | --- | --- | --- | --- | --- |
| `STEMS` / `BRANCHES` (palace order Dần→Sửu) | present | present | SAFE_SHARED | Identical arrays; mechanical | Extract to shared-primitives (Commit 2) |
| `CYCLE_BRANCHES` (Tý→Hợi) | present | present | SAFE_SHARED | Distinct role from palace order | Extract; keep name distinct from palace branches |
| `HOUR_BRANCHES` / `MONTH_NAMES` / `PALACES_BY_FORWARD_BRANCH` / `PALACE_HAN` | present | present | SAFE_SHARED | Identical | Extract |
| `TIGER_RULE` / `STEM_POLARITY` / `NAP_AM_ELEMENTS` / `CUC` | present | present | SAFE_SHARED | Identical lookups | Extract with geometry |
| `MAIN_OFFSETS` / `TIANFU_OFFSETS` | present | present | SAFE_SHARED | Identical natal main offsets | Extract if still identical at move time |
| `BRIGHTNESS` table | present | present | SAFE_SHARED | Appears identical core | Extract only if byte-identical; else KEEP LOCAL |
| `fix` / `cycleBranchToIndex` / pillar helpers | present | present | SAFE_SHARED | Pure geometry | Extract |
| `addStar` / `addStarAtBranch` / `addCycle` | present | present | SAFE_SHARED | Same dedupe (name+source), brightness, mutation | Extract; preserve order semantics |
| `getCuc` / `getSoulBody` / `getZiweiStart` / `getNapAmElement` / `getElementRelation` | present | present | SAFE_SHARED | Same formulas; TC comment still says "Nam Phái" (copy/paste drift) | Extract; neutralize comments |
| `assignMajorFortunes` | present | present | SAFE_SHARED | Mechanically identical | Extract (Commit 3) |
| `getLNDVBase` zigzag | present | present | SAFE_SHARED | Same helper; school fallback differs at call site | Extract helper only |
| `adjustedLunarMonth` / `calculateThang1` / `assignAnnualFlow` | present | present | SAFE_SHARED | Appears identical annual-flow geometry | Extract after confirm (Commit 3); reuse `annual-flow.ts` |
| `getTuanBranches` / `getVoidMarkers` / `addVoidStars` / `addFixedPalaceStars` | present | present | SAFE_SHARED | Same names/sources if verified identical | Extract if proven; else KEEP LOCAL |
| `locTonIndex` / `stemBranchForLunarMonth` | public ChartEngine | public ChartEngine | SAFE_SHARED (impl) | Contract must stay; impl may delegate | Shared helper + thin export wrappers |
| `TU_HOA` | Canh Khoa=`Thái Âm` | Canh Khoa=`Thiên Phủ` | SCHOOL_POLICY | ERQ-005 unresolved; intentional released difference | Isolate to school policy modules; lock tests |
| `STEM_KHOI_VIET` | Canh=`Ngọ/Dần` | Canh=`Sửu/Mùi` | SCHOOL_POLICY | Intentional released difference | Isolate to school policy; lock tests |
| `addHoaLinhStars` | Linh `linhStart - hourIndex` | Linh `linhStart + hourIndex` | SCHOOL_ALGORITHM | Same starts; opposite Linh direction | Keep school-named functions; no shared school-if |
| Bác Sĩ / `DOCTOR_CYCLE` placement | always forward `1` from Lộc Tồn | follows `directionSign` | SCHOOL_ALGORITHM | Cycle names common; direction school-owned | Keep cycle data shareable later; placement stays school |
| `DOCTOR_CYCLE` names array | identical list | identical list | SAFE_SHARED (data only) | Names only | May share array; not placement |
| Nam tiểu hạn orchestration | populates smallLimit* ; `annualPalace` = tiểu hạn | n/a | SCHOOL_ALGORITHM | Released Nam semantics | Keep in Nam engine |
| TC `annualPalace` | n/a | `annualPalace` = Thái Tuế | SCHOOL_ALGORITHM | Released TC semantics | Keep in TC engine |
| TC smallLimit fields | populated | `null` / `null` / `""` | SCHOOL_ALGORITHM | Intentional | Do not normalize |
| `smallLimitBranch` ring on palaces | used | may still populate via shared ring | KEEP_SCHOOL_LOCAL / geometry | Ring ≠ annual palace = tiểu hạn | Do not delete if golden depends |
| TC `majorPalaceName` / `annualPalaceName` | unset | populated (trùng bài) | KEEP_SCHOOL_LOCAL | TC-only public fields | Keep in TC orchestration |
| TC signature stars (Thiên Vu, Thiên Nguyệt, Âm Sát, Nguyệt Giải, Tướng Tinh…) | absent / null | present | KEEP_SCHOOL_LOCAL | TC pipeline only | Keep `addTCSignatureStars` etc. |
| `majorMutagens` + `ĐV ` decoration | Nam main pipeline empty on probe fixture | TC emits major-mutagen + ĐV stars | KEEP_SCHOOL_LOCAL | Do not symmetrize Nam | Lock current behavior |
| Nam-only annual Lưu packs / month-day-hour packs | richer NP annual path | TC annual path differs | KEEP_SCHOOL_LOCAL | Different star packs | Leave local |
| Hoa Cái / Kiếp Sát dual paths | school packs differ | school packs differ | UNCERTAIN_STOP | Not fully certified identical | Leave local in #256 |
| `STAR_ELEMENTS` | NP registry | TC has extra school names | UNCERTAIN_STOP / KEEP_SCHOOL_LOCAL | Partial overlap only | Prefer leave local unless base+extension clearly simpler |
| `buildChartData` / `calculate` / `calculateForAnnualYear` | school-owned | school-owned | KEEP_SCHOOL_LOCAL | Orchestration boundaries | Must remain school-owned |
| `getPhiFlows` | uses school `TU_HOA` | uses school `TU_HOA` | SCHOOL_ALGORITHM + policy table | Mechanics may share later with injected table | Defer if callbacks explode |
| `resolve-major-fortune-mutagens.ts` | uses `getEngine(school).tuHoaTargets` | same | KEEP (defer) | Dependency-direction debt | Out of scope unless extraction requires |

## 6. Explicit intentional divergences (locked)

Frozen expectations for characterization tests (literals, not derived from policy tables under test):

### 6.1 Canh Tứ Hóa (SCHOOL_POLICY)

| Mutagen | Nam Phái | Trung Châu |
| --- | --- | --- |
| Lộc | Thái Dương | Thái Dương |
| Quyền | Vũ Khúc | Vũ Khúc |
| Khoa | Thái Âm | Thiên Phủ |
| Kỵ | Thiên Đồng | Thiên Đồng |

ERQ-005 remains unresolved. PR #256 must not decide doctrine.

### 6.2 Canh Khôi / Việt (SCHOOL_POLICY)

| School | Thiên Khôi | Thiên Việt |
| --- | --- | --- |
| Nam Phái | Ngọ | Dần |
| Trung Châu | Sửu | Mùi |

### 6.3 Linh Tinh direction (SCHOOL_ALGORITHM)

Fixture: `15/06/2013`, hour `Dậu`, male, TZ+7, annual 2026, `luu-nien`.

| School | Linh Tinh branch |
| --- | --- |
| Nam Phái | Sửu |
| Trung Châu | Mùi |

(Ngọ hour on this year coincidentally lands both schools on Thìn — not a usable lock.)

### 6.4 Bác Sĩ direction (SCHOOL_ALGORITHM)

Same fixture (`directionSign === -1`):

| School | Bác Sĩ | Lực Sĩ |
| --- | --- | --- |
| Nam Phái (always forward) | Tý | Sửu |
| Trung Châu (follows directionSign) | Tý | Hợi |

### 6.5 annualPalace / Tiểu Hạn

Same fixture:

| Concern | Nam Phái | Trung Châu |
| --- | --- | --- |
| `annualPalace.branch` | Thân (= tiểu hạn) | Ngọ (= Thái Tuế) |
| `smallLimitPalace` | non-null (Thân) | `null` |
| `smallLimitStartPalace` | non-null | `null` |
| `smallLimitDirection` | non-empty string | `""` |

### 6.6 Trung Châu trùng bài / signature / majorMutagens

Fixture: `15/08/1990` Canh Ngọ female (yearStem Canh), hour Ngọ, annual 2026.

| Concern | Released behavior |
| --- | --- |
| `palaces[*].majorPalaceName` / `annualPalaceName` | populated (TC) |
| Thiên Vu / Thiên Nguyệt / Âm Sát / Nguyệt Giải / Tướng Tinh | present (TC); absent on Nam for these signature names |
| `majorMutagens` | TC length 4 with `source: "major-mutagen"`; Nam length 0 on this fixture |
| `ĐV Hóa *` stars | present on TC palaces |

## 7. Extracted SAFE_SHARED symbols

*(Filled after Commits 2–3 — empty at characterization.)*

| Symbol | Previous owners | New owner | Classification |
| --- | --- | --- | --- |
| — | — | — | — |

## 8. Kept school-local algorithms

| Concern | Owner | Reason |
| --- | --- | --- |
| Tứ Hóa tables | school policy | Intentional Canh Khoa divergence; ERQ-005 |
| Khôi/Việt tables | school policy | Intentional Canh divergence |
| Hỏa/Linh placement | school algorithms | Opposite Linh hour direction |
| Bác Sĩ direction | school algorithms | Nam forward vs TC `directionSign` |
| Nam Tiểu Hạn orchestration | Nam engine | `annualPalace` = tiểu hạn |
| TC annual palace = Thái Tuế | TC engine | Intentional |
| TC trùng bài names | TC engine | School-only fields |
| TC signature stars | TC engine | School-only pipeline |
| majorMutagens emit / ĐV prefix | TC (current) | Do not symmetrize |

## 9. Policy ownership (planned Commit 4)

```text
schools/nam-phai-policy.ts   → NAM_PHAI_TU_HOA, NAM_PHAI_KHOI_VIET
schools/trung-chau-policy.ts → TRUNG_CHAU_TU_HOA, TRUNG_CHAU_KHOI_VIET
```

Data-only. No giant strategy interface. No hidden overrides.

## 10. Files created

| File | Phase |
| --- | --- |
| `docs/audits/pr256-ziwei-school-boundary-audit.md` | Commit 1 |
| `src/lib/ziwei/__tests__/school-boundaries.test.ts` | Commit 1 |

## 11. Files removed

None at characterization.

## 12. Before / after dependency graph

### BEFORE

```text
engine-nam-phai.ts
├── shared mechanics duplicated
├── Nam policy (TU_HOA, STEM_KHOI_VIET)
├── Nam algorithms (Hỏa/Linh, Bác Sĩ forward, tiểu hạn)
└── Nam orchestration (buildChartData)

engine-trung-chau.ts
├── shared mechanics duplicated
├── TC policy (TU_HOA, STEM_KHOI_VIET)
├── TC algorithms (Hỏa/Linh, Bác Sĩ directionSign, Thái Tuế annual)
└── TC orchestration (trùng bài, signature, majorMutagens)
```

### AFTER (target)

```text
calculation/shared-*
└── deterministic school-neutral mechanics (no school conditionals)

schools/nam-phai-policy
└── Nam static policy

schools/trung-chau-policy
└── TC static policy

engine-nam-phai
└── Nam algorithms + orchestration

engine-trung-chau
└── TC algorithms + orchestration
```

## 13. Golden verification

Expected throughout PR: empty diff under `tests/golden/**`.
Any golden delta → STOP (do not regenerate).

## 14. Test verification

Commit 1: characterization tests must pass against baseline engines without source edits.

Later commits: school-boundaries + golden + typecheck after each extraction.

## 15. Unresolved / deferred debt

- ERQ-005 Canh Tứ Hóa (expert/source certification) — not decided here
- Hoa Cái / Kiếp Sát path divergence — UNCERTAIN_STOP
- `STAR_ELEMENTS` base+extension — optional, prefer local
- `resolve-major-fortune-mutagens.ts` getEngine dependency direction — later PR (#257 candidate)
- Trung Châu Research Pack / narrative AI — out of scope
- Misleading `getZiweiStart` “Nam Phái” comment in TC — fix when extracting (neutral wording only)

## Size note

SIZE REDUCTION IS NOT ACCEPTANCE CRITERIA.
Pre-refactor sizes recorded in §4 for reporting only.
