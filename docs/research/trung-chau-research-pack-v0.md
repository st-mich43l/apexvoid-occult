# Trung Châu Research Pack V0

**STATUS:** incomplete / research_only  
**School:** `trung-chau`  
**Runtime authority:** false  
**Narrative authority:** false

## 1. Purpose

Make Trung Châu knowledge state explicit before any further runtime or
narrative expansion:

- what current released runtime does
- which claims have inspectable sources
- where sources conflict
- what still needs expert review

## 2. Authority boundary

```text
PHYSICAL CALCULATION FACT
!= ANALYTIC EVIDENCE
!= SOURCE DOCTRINE
!= ENGINEERING POLICY
!= RESEARCH RESULT
!= RELEASED RUNTIME
!= NARRATIVE OUTPUT
```

Research Pack V0 is **not** Calculation Core authority and **not** narrative KB.

## 3. Source methodology

1. Inventory current runtime (engineering observation).
2. Register only sources that were actually inspected or already present as
   bibliographic shells in this repository.
3. Never invent page numbers or “traditional doctrine” from model memory.
4. Prefer incomplete + research queue over fabricated completeness.

## 4. Source hierarchy

| Type | Role |
| --- | --- |
| `primary_text` | Inspectable classical primary |
| `school_authority` | Inspectable Zhongzhou / school authority |
| `academic_or_bibliographic` | Bibliographic / academic shells |
| `recognized_commentary` | Named commentary with locator |
| `secondary_commentary` | Secondary republications |
| `community_or_forum` | Blogs/forums — never silent promote |
| `internal_engineering` | Released Calculation Core / tests |

`internal_engineering` may never certify classical / verified Trung Châu doctrine.

## 5. Current runtime observations

Committed in `runtime-observations.v0.json` (examples):

- Canh Khoa = Thiên Phủ (vs Nam Thái Âm) — ERQ-005
- Canh Khôi/Việt = Sửu/Mùi
- Linh direction opposite Nam
- Bác Sĩ follows `directionSign`
- `annualPalace = taiTuePalace`; public Tiểu Hạn fields empty
- `smallLimitBranch` geometry still present for monthly-flow
- ĐV major mutagens, trùng bài names, signature stars, Tướng Tinh cycle

## 6. Doctrine matrix coverage

18 policy rows in `doctrine-matrix.v0.json`. Most remain
`insufficient_evidence`. Canh Tứ Hóa rows are `expert_pending` / conflicted.

All V0 rows set `futureRuntimeAction = none`.

## 7. Contradiction handling

Conflicts are recorded (`CTR-TC-*`) with `resolution = null` while open.
Source count is not authority. Expert review is required when lineages disagree.

## 8. ERQ-005 status

**Open / expert_pending.** Evidence ledger lives in `expert-review.v0.json`.
Secondary pages attribute Wang/Zhongzhou Canh as 阳武府同 (aligns with TC
runtime) but also document competing lineages. No primary edition locator is
committed. Do not auto-close.

## 9. Unresolved research queue

`RQ-TC-001` … `RQ-TC-010` in `source-registry.v0.json` (P0–P2), covering ERQ-005,
Khôi/Việt, Linh, Bác Sĩ, annual palace / Tiểu Hạn, ĐV, trùng bài, signature
stars, Hoa Cái / Kiếp Sát.

## 10. What V0 does NOT authorize

- Changing `trung-chau-policy.ts` / engines
- Enabling Trung Châu narrative KB
- Analysis score / Palace Overview / Annual Axes / Monthly Flow changes
- Treating secondary blogs as school authority

## 11. Promotion path

```text
SOURCE EVIDENCE
→ RESEARCH CLAIM
→ CONTRADICTION REVIEW
→ EXPERT REVIEW
→ APPROVED SCHOOL POLICY CHANGE
→ SEPARATE CALCULATION CORE PR
→ GOLDEN / REGRESSION REVIEW
```

Never:

```text
SOURCE → ENGINE
```

inside this research pack.

## 12. V0.1 evidence expansion (PR #259)

**Research stage:** `V0.1` (schema metadata) — still `incomplete / research_only`.

### New inspected reproduction

- 《中州派紫微斗数初级讲义》王亭之 — web reproduction inspected 2026-08-31
  (pdfcoffee / 5shubook excerpts). Bibliographic identity registered separately
  from doctrine text (`SRC-TC-BIBLIO-PRIMARY-LECTURE` vs
  `SRC-TC-REPRO-PRIMARY-LECTURE-001`).

### Full 10-stem Tứ Hóa audit

Committed in `trung-chau-tu-hoa-audit.v0.1.json` (40 cells). Source mnemonic:

```text
甲廉破武阳 乙机梁紫阴 丙同机昌廉 丁阴同机巨 戊贪阴阳机
己武贪梁曲 庚阳武府同 辛巨阳曲昌 壬梁紫府武 癸破巨阴贪
```

| Khoa cell | TC runtime | Wang-attributed source | Alignment |
| --- | --- | --- | --- |
| Mậu | Hữu Bật | Thái Dương | mismatch |
| Canh | Thiên Phủ | Thiên Phủ | aligned |
| Nhâm | Tả Phụ | Thiên Phủ | mismatch |

Runtime↔source mismatches recorded as `CTR-TC-002` / `CTR-TC-003` (not
source-vs-source). ERQ-005 expanded with structured cells — still
`expert_pending`.

### Other promotions (if evidence holds)

- Khôi/Việt mnemonic 甲戊庚牛羊 (Canh Sửu/Mùi aligns with runtime)
- Hỏa/Linh forward hour example
- Bác Sĩ / major-limit direction rule (阳男阴女顺)
- Tiểu Hạn exists; geometry 男顺女逆
- Doujun rule (斗君 table)
- Tướng Tinh cycle membership (将前诸星 mnemonic)

### Still insufficient

- Trùng Bài exact semantics
- FLOW-YEAR-MENH primary pages (年限推断法 full text)
- Product `flowBase` modes vs canonical Doujun (`RQ-TC-011`)
- TC-specific Thiên Vu / Nguyệt Giải month tables in lecture extraction
- Authenticated first-edition page locators (`RQ-TC-001` P0)

### Doctrine matrix

29 policy rows after V0.1 split (temporal layers, signature sub-rows, Tứ Hóa
sub-rows). `runtimeAlignment` field separates engineering observation from
source support.

## 13. V0.2 source authority & doctrine closure (PR #260)

**Research stage:** `V0.2` — still `incomplete / research_only`.

### Published work identity

- 《安星法及推断实例》王亭之 — `SRC-TC-BIBLIO-ANXING-001`
  (ISBN **9787309096651**, 复旦大学出版社, 2013) — catalog-verified metadata.
- Inspectable reproduction: `SRC-TC-REPRO-ANXING-001` (shenjige excerpt +
  mnemonic cross-check). **Not** authenticated first edition.

### Authority roles (V0.2)

`bibliographic_identity` | `published_work_reproduction` |
`school_course_reproduction` | `recognized_secondary` | `community_secondary` |
`internal_engineering`

### Full Khôi/Việt

10/10 stems aligned (`trung-chau-placement-audit.v0.2.json` + source tables).

### Signature stars

Thiên Vu, Thiên Nguyệt, Âm Sát, Nguyệt Giải — 12-month mnemonic tables
verified against golden runtime output.

### Temporal doctrine

- Tiểu Hạn geometry: full 12×2 parity **aligned**
- Lưu Niên Mệnh / Tai Sui relabelling: **supported / aligned**
- Doujun canonical `luu-nien`: **aligned** (branch-level)
- `flowBase` tieu-han / dai-van: **engineering_policy** (not sourced)

### Monthly coordinates

`POL-TC-MONTHLY-CALENDAR-IDENTITY` — Monthly Flow V1 uses provider calendar
identity; legacy `FlowMonthEntry.stem/branch` debt (`CTR-TC-004`, `RQ-TC-012`).

### ERQ-005 packets

- `erq-005-decision-packet.v0.2.json` — still `expert_pending`
- `erq-005-candidate-impact.v0.2.json` — shadow analysis only

### Still pending

- ERQ-005 human decision (Mậu/Canh/Nhâm Khoa)
- Authenticated first-edition page scans
- Legacy FlowMonthEntry contract migration
- Hoa Cái/Kiếp Sát code-path cleanup

## 14. V0.3 Tứ Hóa correction blast-radius closure (PR #261)

**Research stage:** `V0.3` — still `incomplete / research_only`.

### V0.3 objective

Measure the **real** shadow impact of a two-cell candidate correction without
changing released runtime:

```text
Mậu Khoa: Hữu Bật → Thái Dương
Nhâm Khoa: Tả Phụ → Thiên Phủ
Canh Khoa: unchanged (lineage-sensitive control)
```

### Why V0.2 "9 cases" was incomplete

V0.2 `goldenCasesPotentiallyAffected = 9` counted
`yearStem/annualStem ∈ {Mậu,Nhâm}` stem-hits (4+5 natal; 0 annual). It did
**not** include PhiFlows (per-palace stem), major fortune, decorations, or
monthly calendar Khoa. Historical V0.2 artifact preserved.

### Measured blast radius (TC golden = 45)

| Layer | Cases / rows with delta |
| --- | --- |
| Natal mutagens | **9 / 45** |
| Annual mutagens | **0 / 45** (coverage gap) |
| Major mutagens | **9 / 45** |
| PhiFlows | **45 / 45** |
| Decorations (natal/major Khoa) | **17 / 45** |
| Any mutagen candidate delta | **45 / 45** |
| Monthly calendar Khoa (10×12) | **24 / 120** |

Palace-stem geometry: **every** TC golden chart contains both Mậu and Nhâm
source palaces → PhiFlow Khoa deltas are universal in this corpus.

### Analysis dependency map

| Module | Classification |
| --- | --- |
| Palace Overview | indirect (natal facts; formula frozen) |
| Annual Axes | direct (`natalMutagens`) |
| Major Fortune | direct (`majorMutagens`) |
| Monthly Flow | direct (`tuHoaTargets(calendarStem)`) |

Physical-input correction propagation ≠ scoring-model change.

### ERQ-005 status

Still **`expert_pending`**. Decision options include APPROVE_MAU_AND_NHAM /
APPROVE_MAU_ONLY / APPROVE_NHAM_ONLY / KEEP_CURRENT_RUNTIME /
REQUEST_MORE_RESEARCH.

### Correction readiness

Mậu and Nhâm are **migration-ready correction candidates** pending explicit
expert approval. They are **not** corrected in runtime.

### Remaining blockers

- Human ERQ-005 decision
- Annual-stem Mậu/Nhâm golden coverage gap for annual-layer regression
- Authenticated edition page proof (optional strengthening)

### Promotion path

```text
Expert decision → PR #262 two-cell policy + golden migration
```

Never: `SOURCE → ENGINE` inside the research pack.

