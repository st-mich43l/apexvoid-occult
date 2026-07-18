# ADR-MF-001: Starting Palace for Major Fortune (Đại Vận)

## Status
Accepted for V0.3 (`POL-MF-STARTING-PALACE`, school: `mixed`, status: `default`).

## Question
Which natal palace does the first Major Fortune cycle (order 0) occupy? Is it
necessarily the natal Mệnh palace, or could it be a different palace (e.g.
Thân, Phúc Đức, or a Cục-derived palace)? What is the exact relationship
between the starting palace, the Cục number, and the traversal direction?

## Candidate policies
- **CP-1 — Natal Mệnh palace, order 0** (`POL-MF-STARTING-PALACE` as resolved):
  the first Major Fortune cycle is anchored at the natal Mệnh palace itself;
  subsequent cycles traverse forward/reverse from there.
- **CP-2 — Some other fixed palace** (e.g. Thân, or a palace derived
  arithmetically from Cục number independent of Mệnh): considered and
  rejected — no tracked source or legacy behavior supports this.
- **CP-3 — Cục-dependent starting palace** (the starting palace itself shifts
  depending on Cục number, not just the starting age): considered and
  rejected — no tracked source separates "which palace" from "what age";
  Cục number is only ever described as governing starting *age*.

## Supporting claims
- `CLM-MF-008` (SRC-MF-001, Tử Vi Đẩu Số Tân Biên, Chương Đại Vận): the first
  Major Fortune (order 0) is placed at the natal Mệnh palace; only later
  cycles traverse in the chosen direction.
- `CLM-MF-012` (SRC-MF-002, Vương Đình Chi / Trung Châu, Chương Vận Hạn):
  Trung Châu phái independently agrees the first cycle starts at Mệnh — this
  is corroboration from a second, cross-school source, not a single-source
  claim of consensus.

## Conflicting evidence
None found among tracked sources. This is one of the few Major Fortune
mechanics where the two tracked schools (Nam Phái, Trung Châu) do not
diverge — their documented disagreements are about Tiểu Hạn usage and Tứ Hóa
derivation, not about the starting palace. No source proposing CP-2 or CP-3
was found; this absence is recorded honestly rather than treated as proof
those alternatives are wrong, only that they are unsupported by anything
currently tracked in the registry.

## Selected V0 rule
`RULE-MF-STARTING-PALACE` (`POL-MF-STARTING-PALACE`):
- **Base palace:** natal Mệnh palace (`chart.menhIndex` in the existing
  Calculation Core).
- **Order 0 assignment:** the base palace is always order 0, regardless of
  Cục number or direction.
- **Relationship to Cục:** Cục number determines the *starting age* of order
  0 (`POL-MF-STARTING-AGE`), never which palace is order 0.
- **Relationship to direction:** direction (`POL-MF-DIRECTION`) determines
  which palace becomes order 1, 2, ... (traversal), never the base palace
  itself.
- **Index normalization:** zero-based, modulo 12.
- **Invalid/missing palace data:** fail closed — no fallback palace is
  substituted if `menhIndex` is missing or invalid.

## Rejected alternatives
CP-2 and CP-3 above — rejected for lack of any supporting claim, not because
they were disproven by a conflicting claim.

## Rationale
Cross-school corroboration (Nam Phái + Trung Châu, two independently
authored primary texts) on the same specific mechanic, combined with exact
match to existing legacy runtime behavior (`engine-nam-phai.ts` /
`engine-trung-chau.ts`: `order = fix((palace.index - menhIndex) * directionSign)`,
which is 0 exactly when `palace.index === menhIndex`), gives enough closure
to select CP-1 for V0.3. Per the mission's explicit instruction, this was
**not** assumed merely because the legacy code already does it — the
sourced claims were checked first, and the code match was then treated as
corroborating evidence, documented separately in `legacyRuntimeRefs`.

## Known uncertainty
- Exact page/locator for `CLM-MF-008`/`CLM-MF-012` remains `Unknown` —
  chapter-level locators only. This claim should be treated as `conditional`
  confidence, not `high`, until a physical/scanned copy is checked page by
  page.
- No third school or classical Chinese-language source was consulted; the
  claim rests on two Vietnamese-language secondary/primary texts already in
  the registry.

## Implementation consequences
Any future runtime policy resolver must read `menhIndex` directly from the
Calculation Core's existing natal output and must not attempt to
independently re-derive it. This ADR does not authorize any change to
`engine-nam-phai.ts` or `engine-trung-chau.ts` — implementation remains
`not_started`.

## Required tests
- Starting-palace fixtures at all 12 possible Mệnh indexes (see
  `research/major-fortune/fixtures/`) confirming order 0 == Mệnh index in
  every case.
- Invalid/missing `menhIndex` must produce a fail-closed diagnostic, never a
  fallback palace.
- Cross-school test: the same natal chart under both `nam-phai` and
  `trung-chau` profiles must select the same starting palace (order 0 ==
  Mệnh) even though other policies (Tiểu Hạn, Tứ Hóa) differ.
