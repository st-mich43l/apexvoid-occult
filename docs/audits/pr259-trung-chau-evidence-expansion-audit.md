# PR #259 — Trung Châu Evidence Expansion Audit

**Baseline:** `a8ae2346c60db3d80dad65e39eb0d6e774eb3a00` (master after PR #258)
**Branch:** `research/pr259-trung-chau-evidence-expansion-v01`
**STATUS:** CURRENT

## Mission

Expand Trung Châu Research Pack V0 → **V0.1 evidence state**: inspect Wang
Tingzhi / Zhongzhou primary-lecture reproduction, audit full 10-stem Tứ Hóa,
separate temporal doctrine layers, strengthen star-placement evidence — **zero**
Calculation Core / Analysis / golden / API / narrative change.

## PR #258 starting state

| Metric | V0 |
| --- | --- |
| Doctrine rows | 18 |
| `insufficient_evidence` verdicts | 16 |
| Sources | 5 |
| Claims | 5 |
| Contradictions | 1 (CTR-TC-001) |
| ERQ-005 | Canh Khoa only |

## Source methodology

1. **Bibliographic identity** ≠ **inspectable reproduction** ≠ **doctrine claim**.
2. Web reproduction inspected (pdfcoffee + 5shubook excerpt cross-check).
3. No long passages committed; mnemonic + locator + paraphrase only.
4. Search snippets used for discovery only.

### Sources inspected (V0.1)

| ID | Role |
| --- | --- |
| `SRC-TC-BIBLIO-PRIMARY-LECTURE` | Title/author shell (shenjige listing) |
| `SRC-TC-REPRO-PRIMARY-LECTURE-001` | Doctrine text: 安四化星诀, 魁钺, 火铃, 斗君/小限, 将前诸星 |
| `SRC-TC-REPRO-ZIWEIFU-001` | Lineage comparison corroboration (secondary) |
| `SRC-TC-POINTER-MONTHLY-WTZ-001` | In-repo pointer for layer stems (not re-inspected) |

Preserved V0 sources: `SRC-TC-SECONDARY-001`, `SRC-TC-COMMUNITY-001`, engineering.

## Full 10-stem Tứ Hóa audit

Artifact: `trung-chau-tu-hoa-audit.v0.1.json` (`runtimeAuthority: false`).

| Stem | Lộc | Quyền | Khoa (TC) | Khoa (source) | Kỵ | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Giáp | aligned | aligned | aligned | aligned | aligned | all aligned |
| Ất | aligned | aligned | aligned | aligned | aligned | all aligned |
| Bính | aligned | aligned | aligned | aligned | aligned | all aligned |
| Đinh | aligned | aligned | aligned | aligned | aligned | all aligned |
| Mậu | aligned | aligned | **Hữu Bật** | **Thái Dương** | aligned | Khoa mismatch |
| Kỷ | aligned | aligned | aligned | aligned | aligned | all aligned |
| Canh | aligned | aligned | **Thiên Phủ** | **Thiên Phủ** | aligned | all aligned |
| Tân | aligned | aligned | aligned | aligned | aligned | all aligned |
| Nhâm | aligned | aligned | **Tả Phụ** | **Thiên Phủ** | aligned | Khoa mismatch |
| Quý | aligned | aligned | aligned | aligned | aligned | all aligned |

**38/40 cells aligned.** 2 runtime↔source mismatches on Khoa only.

## Runtime ↔ research mismatches

| Cell | Runtime | Source | CTR | ERQ-005 |
| --- | --- | --- | --- | --- |
| Mậu Khoa | Hữu Bật | Thái Dương | CTR-TC-002 | expert_pending |
| Nhâm Khoa | Tả Phụ | Thiên Phủ | CTR-TC-003 | expert_pending |

Canh Khoa: **aligned** with Wang lecture but **not** expert-certified for release.

## ERQ-005

Expanded with `cells[]` for Mậu/Canh/Nhâm Khoa. Status remains **`expert_pending`**.

## Temporal doctrine split

| Concept | Policy ID | V0.1 evidence |
| --- | --- | --- |
| Tiểu Hạn exists | `POL-TC-TIEU-HAN-EXISTENCE` | supported (小限 table) |
| Tiểu Hạn geometry | `POL-TC-TIEU-HAN-GEOMETRY` | 男顺女逆 (alignment unknown) |
| Lưu Niên Mệnh / Tai Sui | `POL-TC-FLOW-YEAR-MENH` | insufficient (年限推断法 pages) |
| Doujun | `POL-TC-DOU-JUN-MONTHLY` | supported (斗君 rule) |
| Monthly flowBase modes | `RQ-TC-011` | open |

Tiểu Hạn ≠ Lưu Niên Mệnh ≠ Doujun — not collapsed in matrix.

## Star placement evidence

| Topic | V0.1 |
| --- | --- |
| Khôi/Việt Canh | 甲戊庚牛羊 → Sửu/Mùi; runtime aligned |
| Linh direction | Forward hour example (顺数); runtime aligned |
| Bác Sĩ direction | 阳男阴女顺; runtime aligned; not school-exclusive |
| Tướng Tinh cycle | 将星…亡神 mnemonic; membership supported |
| Hoa Cái / Kiếp Sát | 华盖/劫灾 in mnemonic; membership supported |
| Signature stars (Vu/Nguyệt/Âm/Nguyệt Giải) | insufficient — month tables not in extraction |

## Doctrine statistics

| | V0 | V0.1 |
| --- | --- | --- |
| Rows | 18 | 29 |
| `supported` verdict | 0 | 14+ |
| `insufficient_evidence` | 16 | ~8 |
| Sources | 5 | 9 |
| Claims | 5 | 19 |
| Contradictions | 1 | 3 |
| Research tests | 16 | 21 |

Pack status remains **`incomplete`**.

## Protected runtime verification

Empty diff expected on:

`src/lib/ziwei/schools/**`, engines, `calculation/**`, `annual-flow.ts`,
`types/chart.ts`, analysis modules, KB, golden, contracts, API artifacts.

## Validation

| Check | Result |
| --- | --- |
| Research pack tests | 21 passed |
| Full `npm test` | (see PR body) |
| Golden | empty diff |
| API | no drift |

## Cần thầy duyệt

1. ERQ-005 full 10-stem table — approve intentional divergences vs typos.
2. Mậu Khoa: accept Thái Dương vs keep Hữu Bật?
3. Nhâm Khoa: accept Thiên Phủ vs keep Tả Phụ?
4. Is inspectable web reproduction sufficient for a future correction PR, or
   authenticated edition/page required?
5. Tiểu Hạn vs annual Tai Sui — confirm both can coexist doctrinally.
6. Monthly `flowBase` product modes vs canonical Doujun (`RQ-TC-011`).

## Nghi vấn bug engine cũ

Current TC Mậu/Nhâm Khoa differ from inspected Wang-attributed Zhongzhou lecture
mnemonic. **This PR does not classify them as engine bugs** and makes no runtime
change. Expert adjudication required before any Calculation Core PR.

## Phát hiện thêm

- Local `VOIDOCC_DEBUG` pollution was fixed in PR #255 for OpenAPI; unrelated here.
- Wang lecture `天虚` in 十八飞星 history ≠ TC `Thiên Vu` month table — do not conflate.
- `POL-TC-TUHOA-MAU-KHOA` / `POL-TC-TUHOA-NHAM-KHOA` set
  `futureRuntimeAction: separate_pr_after_expert_review` as impact documentation only.

## Recommended next PR

- **Path A:** V0.2 primary-edition verification + Trùng Bài / flow-year pages.
- **Path B:** Targeted TC Tứ Hóa correction (Mậu/Nhâm Khoa only) after ERQ-005
  human approval — expect golden review.
- **Path C:** Narrative research only after capability design — not authorized here.
