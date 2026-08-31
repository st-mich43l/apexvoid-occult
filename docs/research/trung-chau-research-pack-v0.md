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
