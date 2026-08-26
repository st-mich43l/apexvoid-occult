# PR #247 — Domain Logic Integrity Audit

**Baseline:** `3b7e490` (master after PR #246)  
**Branch:** `fix/pr247-domain-logic-integrity`  
**STATUS:** LIVING — updated as fixes land

## Dependency graph (Phase A)

```text
UI input (civil clock + utcOffset + school)
  → calendar (julian, solar-terms, timezone, lunar-vn, sexagenary, domain-tokens)
  → Calculation Core
       ├── bazi (pillars → engine → analysis helpers)
       └── ziwei (engine-nam-phai | engine-trung-chau → ChartData)
  → Analysis facts / modules (palace-overview, annual-axes, major-fortune, monthly-flow)
  → contracts / serializeChart
  → UI render
  → FastAPI ChartDTO
  → focus / RAG / prompt
  → LLM narrative
```

### Expected import rules

| From | Must not depend on |
| --- | --- |
| `calendar` | `bazi`, `ziwei` |
| `bazi` deterministic core | Zi Wei school engines |
| Zi Wei Calculation Core | `analysis` |
| Analysis | recalculating physical placement |
| Backend | second Calculation Core |
| UI | astrology calculation authority |

### Reverse / violated edges found

| Edge | Classification | Status |
| --- | --- | --- |
| `bazi/civil-display` → `ziwei/engine-nam-phai` (`solarToLunar`) | CROSS_LAYER_AUTHORITY_BUG | Fixed — shared `calendar/lunar-vn` |
| `calendar/timezone` → `bazi/conventions` | CROSS_LAYER_AUTHORITY_BUG | Fixed — local option types |
| Backend `annual_stars.py` + `liencung` year synthesis | CROSS_LAYER_AUTHORITY_BUG | Restricted (Option C) |

---

## Findings

### F001 — Điều Hậu summer miss on `Tị`

| Field | Value |
| --- | --- |
| ID | F001 |
| Severity | P0 |
| Domain | Bát Tự / Dụng Thần |
| File(s) | `src/lib/bazi/yong-shen.ts` |
| Function(s) | `determineDieuHauFallback` |
| Current behavior | `SUMMER_BRANCHES = ["Tỵ","Ngọ","Mùi"]` while Bát Tự month branch is `Tị` from `BRANCHES` |
| Expected invariant | Summer months (Tị/Ngọ/Mùi) resolve to Thủy via Điều Hậu |
| Evidence | Real chart month branch uses `Tị`; tests used Zi Wei spelling `Tỵ` and masked the bug |
| Classification | CONFIRMED_BUG |
| Risk | Neutral-strength charts born in lunar summer get Xuân/Thu dual fallback |
| Proposed action | Canonicalize branch identity; summer set uses `Tị`; accept `Tỵ` only via normalize |
| Tests required | Exhaustive summer/winter branches including both spellings |
| Implementation status | Fixed |

### F002 — `getElement` fail-open to Thổ

| Field | Value |
| --- | --- |
| ID | F002 |
| Severity | P0 |
| Domain | Bát Tự / Ngũ Hành |
| File(s) | `src/lib/bazi/elements.ts` |
| Function(s) | `getElement` |
| Current behavior | Unknown token → `"Thổ"` |
| Expected invariant | Invalid stem/branch never becomes a valid element on trusted paths |
| Evidence | Explicit fallback comment + return |
| Classification | CONFIRMED_BUG |
| Risk | Corrupted data becomes plausible astrology |
| Proposed action | Strict throw + nullable parse at untrusted boundary |
| Tests required | Unknown token throws; all 10 stems + 12 branches map |
| Implementation status | Fixed |

### F003 — Five-element spelling split (Hoả/Hỏa, Thuỷ/Thủy)

| Field | Value |
| --- | --- |
| ID | F003 |
| Severity | P0 |
| Domain | Calendar / Bát Tự |
| File(s) | `sexagenary.ts`, `ten-gods.ts`, `elements.ts`, monthly-flow evaluate |
| Current behavior | `STEM_ELEMENTS` uses Hoả/Thuỷ; Element type uses Hỏa/Thủy; ten-gods private maps use Hoả/Thuỷ |
| Expected invariant | Deterministic algorithms share one canonical Element identity |
| Evidence | Dual maps; display replace hacks in BaziChart |
| Classification | CANONICALIZATION_BUG |
| Risk | Silent `unknown` ten-god relations if maps diverge |
| Proposed action | Canonical Hỏa/Thủy in Calculation Core; ten-gods consume `elements.ts` |
| Tests required | Exhaustive stem→element + relation cycle |
| Implementation status | Fixed |

### F004 — Host-timezone Đại Vận year

| Field | Value |
| --- | --- |
| ID | F004 |
| Severity | P0 |
| Domain | Bát Tự / Lưu Niên |
| File(s) | `annual-years.ts`, `bazi-text.ts`, `BaziChart.tsx` |
| Function(s) | `getAnnualYears` |
| Current behavior | `lp.startDate.getFullYear()` |
| Expected invariant | No domain result depends on host TZ |
| Evidence | `startDate` is UTC instant; local getFullYear shifts near year edges |
| Classification | TEMPORAL_SEMANTICS_BUG |
| Risk | Luck index assignment flips under `TZ=America/New_York` |
| Proposed action | `getUTCFullYear()` + civil birth year from metadata |
| Tests required | Multi-TZ invariance |
| Implementation status | Fixed |

### F005 — Birth year from True Solar Time

| Field | Value |
| --- | --- |
| ID | F005 |
| Severity | P1 |
| Domain | Bát Tự / age |
| File(s) | `annual-years.ts` |
| Current behavior | `trueSolarTime.getUTCFullYear()` for age base |
| Expected invariant | Age/display year uses civil clock year unless convention says otherwise |
| Classification | TEMPORAL_SEMANTICS_BUG |
| Proposed action | Prefer `metadata.civil.solarYear` |
| Implementation status | Fixed |

### F006 — `getAnnualPillar(year)` Li Chun ambiguity

| Field | Value |
| --- | --- |
| ID | F006 |
| Severity | P1 |
| Domain | Bát Tự |
| File(s) | `luck-pillars.ts` |
| Current behavior | Integer Gregorian year → sexagenary pillar (1984 Giáp Tý offset) |
| Expected invariant | Document as Li-Chun-cycle **label** API; instant-aware API for exact date |
| Classification | CONTRACT_DRIFT |
| Proposed action | Document + add `getAnnualPillarAtInstant` |
| Implementation status | Fixed (documented + instant API) |

### F007 — Bát Tự → Nam Phái calendar import

| Field | Value |
| --- | --- |
| ID | F007 |
| Severity | P0 |
| Domain | Calendar ownership |
| File(s) | `civil-display.ts` |
| Classification | CROSS_LAYER_AUTHORITY_BUG |
| Proposed action | Extract `solarToLunar` to `calendar/lunar-vn` |
| Implementation status | Fixed |

### F008 — Misleading “Giờ sinh thực tế” for TST

| Field | Value |
| --- | --- |
| ID | F008 |
| Severity | P1 |
| Domain | Bát Tự presentation |
| File(s) | `bazi-text.ts` |
| Classification | CONTRACT_DRIFT |
| Evidence | Pillars use civil clock; TST is metadata only |
| Proposed action | Precise labels |
| Implementation status | Fixed |

### F009 — Fixed longitude presentation

| Field | Value |
| --- | --- |
| ID | F009 |
| Severity | P2 |
| Domain | Bát Tự UI |
| File(s) | `BaziPage.tsx`, `provinces.ts` |
| Classification | CONTRACT_DRIFT |
| Proposed action | Mark TST as based on configured default longitude |
| Implementation status | Fixed (label) |

### F010 — Chuyên Vượng hyThan vs reasoning

| Field | Value |
| --- | --- |
| ID | F010 |
| Severity | P2 |
| Domain | Dụng Thần |
| File(s) | `yong-shen.ts` `tryChuyenVuong` |
| Current behavior | `hyThan = [generated, overcoming]` but reasoning only mentions generated |
| Classification | CONFIRMED_BUG (consistency) / EXPERT_REVIEW_REQUIRED (doctrine of Tài as Hỷ) |
| Proposed action | Align reasoning text with returned arrays; escalate Tài-as-Hỷ to expert queue |
| Implementation status | Fixed (mechanical consistency) |

### F011 — Backend second Calculation Core

| Field | Value |
| --- | --- |
| ID | F011 |
| Severity | P0 |
| Domain | Backend / narrative |
| File(s) | `annual_stars.py`, `liencung.py` |
| Classification | CROSS_LAYER_AUTHORITY_BUG |
| Proposed action | Option C — refuse partial historical-year synthesis; constrain to serialized year |
| Implementation status | Fixed (restricted) |

### F012 — element-strength duplicated generation checks

| Field | Value |
| --- | --- |
| ID | F012 |
| Severity | P2 |
| Domain | Bát Tự |
| Classification | TECH_DEBT |
| Proposed action | Use `getGeneratingElement` |
| Implementation status | Fixed (behavior-preserving) |

### F013 — School Tứ Hóa divergence

| Field | Value |
| --- | --- |
| ID | F013 |
| Severity | P1 |
| Domain | Tử Vi |
| Classification | SCHOOL_POLICY |
| Proposed action | Document matrix; do not merge tables |
| Implementation status | Documented |

### F014 — Kinh Dịch calculator absent

| Field | Value |
| --- | --- |
| ID | F014 |
| Severity | P3 |
| Classification | NO_CHANGE |
| Note | `ICHING_CALCULATION_ENGINE_NOT_PRESENT` |
| Implementation status | Audited only |

### F015 — Palace Overview / AA / MF / Major Fortune version identity

| Field | Value |
| --- | --- |
| ID | F015 |
| Severity | P1 |
| Classification | NO_CHANGE (protect) |
| Note | Preserve PO V1.2, AA V0.11/V0.2, MF V0.3, MF V1 gated, Major Fortune production/shadow explicit |
| Implementation status | Protected / documented |

### F016 — Calendar → Bazi conventions reverse import

| Field | Value |
| --- | --- |
| ID | F016 |
| Severity | P1 |
| Classification | CROSS_LAYER_AUTHORITY_BUG |
| Implementation status | Fixed |

---

## Tứ Hóa ownership matrix (summary)

| Stem | Nam Phái | Trung Châu | Shared? | Owner |
| --- | --- | --- | --- | --- |
| (per-stem) | `engine-nam-phai` `TU_HOA` | `engine-trung-chau` `TU_HOA` | Often similar, not guaranteed identical | School Calculation Core |
| Backend | `annual_stars.TU_HOA_MAP` | N/A / not school-aware | Duplicate — restricted | Must not be fact authority |

Exact stem-by-stem diff retained in golden school fixtures; do not unify without doctrine evidence.

---

## Final status table

| Finding | Before | After | Behavior changed? | Golden changed? | Expert review? | Tests | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F001 | Tị missed summer | Canonical summer | Yes (bugfix) | No | No | yong-shen | (see PR) |
| F002 | Unknown→Thổ | Throw / null | Yes (fail-closed) | No | No | elements | |
| F003 | Dual spellings | Hỏa/Thủy SSOT | Internal only | No | No | domain-tokens | |
| F004 | getFullYear | getUTCFullYear | TZ-edge only | No | No | annual-years | |
| F005 | TST year | civil year | Edge cases | No | No | annual-years | |
| F006 | Undocumented | Documented + instant API | Additive | No | No | luck-pillars | |
| F007 | Bát Tự→Nam Phái | calendar/lunar-vn | No (parity) | No | No | lunar-vn | |
| F008 | Misleading label | Precise labels | Presentation | No | No | bazi-text | |
| F009 | Silent 105.8 | Labeled default | Presentation | No | No | UI copy | |
| F010 | Inconsistent text | Aligned | Presentation | No | Yes (doctrine) | yong-shen | |
| F011 | Partial year synth | Refuse / constrain | Narrative | N/A | No | backend | |
| F012 | Manual ifs | Canonical helpers | No | No | No | element-strength | |

## Remaining debt / PR #248 candidates

- Full school-policy extraction (`ZiweiSchoolPolicy`) without behavior change
- Contract generation TS↔Python
- Complete hour/solar-term boundary matrix expansion
- Dead historical engine folder cleanup (only if unused by research)
- Province longitude selector UI (not geolocation)
- Backend school-aware KB routing hardening

## Research-only

- Palace Overview candidates (NO_GO remain)
- Annual Axes V0.12/V0.13
- Monthly Flow V1 RC
- Major Fortune V1 shadow
