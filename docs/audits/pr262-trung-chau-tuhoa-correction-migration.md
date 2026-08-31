# PR #262 — Trung Châu Mậu/Nhâm Hóa Khoa correction migration audit

## 1. Scope

Calculation Core doctrine correction only:

- Two Trung Châu Tứ Hóa policy cells (Mậu.Khoa, Nhâm.Khoa)
- Focused deterministic tests
- Controlled TC golden migration
- ERQ-005 release-decision provenance

Not in scope: Nam Phái, shared mutagen algorithms, Analysis formulas,
API/backend/UI, workflows, dependencies, other research findings.

## 2. Explicit doctrine approval

```text
Decision: APPROVE_MAU_AND_NHAM
Authority: explicit_human_expert_decision
Implementation PR: 262
```

Artifact: `erq-005-release-decision.v0.4.json`  
Research pack `runtimeAuthority` remains **false**.

## 3. Exact two-cell change

| Stem | Transformation | From | To |
| --- | --- | --- | --- |
| Mậu | Khoa | Hữu Bật | Thái Dương |
| Nhâm | Khoa | Tả Phụ | Thiên Phủ |
| Canh | Khoa | Thiên Phủ | Thiên Phủ (**unchanged**) |

Runtime touchpoint: `src/lib/ziwei/schools/trung-chau-policy.ts` only.

## 4. School boundary

| School | Mậu.Khoa | Nhâm.Khoa | Canh.Khoa |
| --- | --- | --- | --- |
| Nam Phái | Hữu Bật | Tả Phụ | Thái Âm |
| Trung Châu (after) | Thái Dương | Thiên Phủ | Thiên Phủ |

Intentional divergence. Nam Phái policy/runtime/goldens: **zero delta**.

## 5. Runtime propagation path

```text
TRUNG_CHAU_TU_HOA
  → getTuHoaTargets
  → resolveMutagenRecords / resolvePhiFlows
  → natal / annual / major / monthly / decorations
```

Shared algorithms unchanged. No school special-case branches added.

## 6. PR #261 predicted impact (measured V0.3)

| Layer | Predicted |
| --- | --- |
| TC golden cases | 45 |
| Natal Khoa | 9 |
| Annual Khoa | 0 (coverage gap) |
| Major Khoa | 9 |
| PhiFlows | 45 |
| Decorations | 17 |
| Any mutagen | 45 |

## 7. Actual #262 measured impact (pre-migration vs old goldens)

| Layer | Actual cases changed |
| --- | --- |
| TC golden total | 45 |
| Cases changed | **45** |
| Cases unchanged | **0** |
| natalMutagens | **9** |
| annualMutagens | **0** |
| majorMutagens | **9** |
| phiFlows | **45** |
| decoration / stars (Khoa relocation) | **17** |
| geometry | **0** |
| unexpected | **0** |
| Nam Phái | **0** |

Actual counts match measured V0.3 predictions exactly.

## 8. Field-level golden delta classification

| Field category | Cases changed | Expected? | Cause | Decision |
| --- | --- | ---: | --- | --- |
| natalMutagens.Khoa | 9 | yes | natal stem Mậu/Nhâm | migrate |
| annualMutagens.Khoa | 0 | yes | no annualStem Mậu/Nhâm in corpus | n/a |
| majorMutagens.Khoa | 9 | yes | active Major Fortune palace stem | migrate |
| phiFlows Khoa target | 45 | yes | every chart has Mậu+Nhâm palace stems | migrate |
| decoration stars (Hóa Khoa / ĐV / Lưu) | 17 | yes | mutagen target palace move | migrate |
| palace.branch / index / geometry | 0 | required zero | — | OK |
| Nam Phái golden | 0 | required zero | — | OK |

## 9. Unexpected delta

```text
Unexpected delta: NONE
```

## 10. Nam Phái zero-delta proof

- `gen-tuvi-golden.ts --verify`: nam-phai 45/45 match before and after TC regen
- Git: only `tests/golden/tuvi-trung-chau.json` modified among goldens

## 11. Geometry zero-delta proof

Classifier reported `geometry: 0`. Focused unit test asserts shared
palace branch/index/Mệnh/Thân geometry vs Nam on a Mậu natal fixture.

## 12. Analysis propagation review

- No Analysis formula / weight / router files changed in this PR.
- If Analysis numeric outputs move solely because corrected physical facts
  feed existing formulas, classify as `PHYSICAL_FACT_CORRECTION_PROPAGATION`.
- No formula retuning performed.

## 13. Golden migration decision

Gate B classification passed (allowlist only; unexpected = 0).

Migrated: `tests/golden/tuvi-trung-chau.json` only  
Not migrated: `tests/golden/tuvi-nam-phai.json`

Post-migration verify: TC 45/45 + Nam 45/45 match.

## 14. Protected paths verification

Intentional empty diffs expected for:

- Nam Phái policy/engines
- `calculation/**` shared mutagen algorithms
- Analysis production modules
- API / OpenAPI / generated types
- Backend KB
- UI
- `.github/workflows/**`
- dependencies / Docker / `.npmrc`

## 15. Test results

Recorded in PR final report after full validation suite.

## 16. Cần thầy duyệt

None remaining for the two approved cells.

Canh Khoa lineage sensitivity remains documented historical context
(not changed by this PR). Annual-stem Mậu/Nhâm golden coverage gap from
#261 remains a future regression-corpus improvement, not a blocker for
this doctrine correction.
