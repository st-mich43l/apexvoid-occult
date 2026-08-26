# PR #247 — Expert Review Queue

Only doctrinal / heuristic questions that engineering cannot close from
repository contracts alone. Confirmed software bugs were fixed without waiting.

---

## ERQ-001 — Chuyên Vượng: Tài as Hỷ Thần

| Field | Value |
| --- | --- |
| Rule ID | ERQ-001 |
| Domain | Bát Tự / Dụng Thần |
| Current implementation | `hyThan = [Thực/Thương, Tài]` when Chuyên Vượng fires |
| Alternative | Hỷ = only Thực/Thương; Tài separately listed or omitted |
| Current source/provenance | Engineering heuristic in `tryChuyenVuong` |
| Affected functions | `determineYongShen` / `tryChuyenVuong` |
| Affected outputs | `hyThan`, reasoning text, `buildBaziText` |
| Why engineering cannot decide | Competing classical readings of “thuận thế” for prosperous Day Master |
| Recommended expert question | Under Chuyên Vượng, should Tài be Hỷ, Dụng phụ, or neutral? |
| Regression fixture to update after decision | `yong-shen.test.ts` Chuyên Vượng cases |

---

## ERQ-002 — 40/60 Day Master strength thresholds

| Field | Value |
| --- | --- |
| Rule ID | ERQ-002 |
| Domain | Bát Tự / element-strength |
| Current implementation | nhược &lt; 40%, vượng &gt; 60% |
| Alternative | School-specific thresholds; continuous bands |
| Current source/provenance | Engineering policy in `element-strength.ts` |
| Why engineering cannot decide | Thresholds are doctrine/engineering policy, not proven bug |
| Recommended expert question | Confirm or replace 40/60 with published Tử Bình band table |
| Regression fixture | Existing strength fixtures — preserve until decision |

---

## ERQ-003 — Full Điều Hậu Spring/Autumn tables

| Field | Value |
| --- | --- |
| Rule ID | ERQ-003 |
| Domain | Bát Tự / Điều Hậu |
| Current implementation | Xuân/Thu → list both Thủy and Hỏa with low confidence |
| Alternative | Can×month dryness/moisture tables |
| Why engineering cannot decide | Explicitly marked incomplete; inventing tables forbidden |
| Recommended expert question | Provide authoritative Xuân/Thu Điều Hậu matrix for this product |

---

## ERQ-004 — Bệnh Dược

| Field | Value |
| --- | --- |
| Rule ID | ERQ-004 |
| Domain | Bát Tự / Dụng Thần |
| Current implementation | Not implemented (honest pipeline note) |
| Recommended expert question | Spec Bệnh Dược detection + Dụng selection rules if desired |

---

## ERQ-005 — School Tứ Hóa disputed cells

| Field | Value |
| --- | --- |
| Rule ID | ERQ-005 |
| Domain | Tử Vi Nam Phái vs Trung Châu |
| Current implementation | Separate `TU_HOA` tables per school engine |
| Why engineering cannot decide | Differences may be intentional school policy |
| Recommended expert question | Stem-by-stem certify intentional divergences vs typos |

---

## ERQ-006 — Palace Overview heuristic weights

| Field | Value |
| --- | --- |
| Rule ID | ERQ-006 |
| Domain | Palace Overview V1.2 |
| Current implementation | Frozen production weights |
| Recommended expert question | Any weight change requires release decision — not PR #247 scope |
