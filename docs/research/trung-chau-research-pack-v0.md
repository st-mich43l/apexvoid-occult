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
