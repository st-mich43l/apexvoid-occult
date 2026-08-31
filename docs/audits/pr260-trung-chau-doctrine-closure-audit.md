# PR #260 — Trung Châu Doctrine Closure Audit

**Baseline:** `1da34b8520453812e2bc3be576c5bb08daae54b3` (master after PR #259)
**Branch:** `research/pr260-trung-chau-doctrine-closure-v02`
**STATUS:** CURRENT

## Mission

Harden Wang/Zhongzhou source authority, close temporal/placement research gaps,
prepare ERQ-005 decision packet — **zero** Calculation Core / Analysis / golden /
API change.

## V0.1 → V0.2

| Metric | V0.1 | V0.2 |
| --- | --- | --- |
| Research stage | V0.1 | V0.2 |
| Sources | 9 | 11 |
| Doctrine rows | 29 | 32 |
| Contradictions | 3 | 4 |
| Research tests | 21 | 68 |
| Pack status | incomplete | incomplete |

## Source authority

| Source | Type | Identity | Inspectability | Independence |
| --- | --- | --- | --- | --- |
| SRC-TC-BIBLIO-ANXING-001 | bibliographic_identity | ISBN 9787309096651 verified via catalog | catalog only | independent shell |
| SRC-TC-REPRO-ANXING-001 | published_work_reproduction | doctrine excerpts | medium | derives from lecture corpus |
| SRC-TC-REPRO-PRIMARY-LECTURE-001 | school_course_reproduction | V0.1 lecture excerpts | medium | not authenticated edition |

## Tứ Hóa

38/40 aligned preserved. ERQ-005 **expert_pending**. Decision packet + candidate
impact artifact committed (`runtimeAuthority: false`).

## Khôi/Việt

**10/10 stems aligned** with Wang mnemonic tables.

## Temporal closure

| Topic | Verdict | Runtime alignment |
| --- | --- | --- |
| Tiểu Hạn geometry | supported | aligned |
| Lưu Niên Mệnh / Tai Sui | supported | aligned |
| Doujun (luu-nien) | supported | aligned |
| Major Fortune Tứ Hóa | supported | aligned |
| Trùng Bài relabelling semantics | supported | aligned |
| alternate flowBase | engineering_policy | n/a |

## Monthly architecture

- Focus palace ≠ calendar Can/Chi — source-supported + V1 provider aligned
- Legacy `FlowMonthEntry.stem/branch` — contract debt (`CTR-TC-004`)
- Monthly Flow V1 scorer: **SCORING_BUG = NO** (existing `coordinate-independence.test.ts`)

## Shadow impact

Candidate `TC-WANG-TUHOA-CANDIDATE-V0.2`: 2 cells (Mậu/Nhâm Khoa).
9 golden cases have Mậu/Nhâm stems that would change Khoa target under candidate.

## Protected runtime

Empty diff on schools, engines, calculation, golden, contracts, API.

## Validation

Research pack: 68 tests PASS. Full suite pending in PR body.

## Cần thầy duyệt

1. Mậu Khoa future correction?
2. Nhâm Khoa future correction?
3. Canh Khoa formal certification?
4. Published-work reproduction sufficient for #261?
5. Retain alternate flowBase as engineering policy?
6. Migrate legacy FlowMonthEntry metadata later?
7. Accept candidate shadow impact for correction PR?

## Nghi vấn bug engine cũ

Mậu/Nhâm Khoa remain runtime↔source mismatches. No correction in #260.

## Phát hiện thêm

- Calendar identity contract debt in ChartData metadata
- Engine comment "KHÔNG dùng tiểu hạn" broader than research evidence
- Hoa Cái/Kiếp Sát implementation-path still UNCERTAIN_STOP

## Recommended next PR

Path A: `#261 fix(ziwei): correct Trung Châu Mậu and Nhâm Tứ Hóa Khoa` after expert approval.
