# ADR-MF-004: Twelve-Palace Traversal Mechanism

## Status
Accepted for V0.3 (`POL-MF-PALACE-TRAVERSAL`, school: `mixed`, status: `default`).

## Question
Given the starting palace (ADR-MF-001, order 0) and a direction
(`POL-MF-DIRECTION`, already resolved pre-V0.3), how does the active Major
Fortune palace move across cycles? What is the exact index arithmetic,
modulo behavior, and wrap-around rule?

## Candidate policies
- **CP-1 — Linear, one-palace-per-decade, modulo-12 traversal** (selected):
  cycle index `n` (zero-based) maps to palace index
  `modulo12(startingPalaceIndex + n * directionSign)`, where
  `directionSign ∈ {+1, -1}`.
- **CP-2 — Non-linear/zigzag traversal** (e.g. the pattern used by the
  *annual* Lưu Niên Đại Vận overlay in `annual-flow.ts`, which jumps to the
  opposite palace on year 2, steps back on year 3, etc.): explicitly
  rejected for the *decade-level* traversal — that zigzag pattern belongs to
  a different, already-separately-tracked policy
  (`POL-MF-ANNUAL-INTERACTION-*`), not to `twelve_palace_traversal`, and
  conflating the two would misattribute a decade-level mechanic with an
  annual-overlay mechanic.

## Supporting claims
- `CLM-MF-009` (SRC-MF-001, Chương Đại Vận): from the Mệnh palace, Major
  Fortune moves exactly one palace per 10-year cycle, in the chosen
  direction, wrapping after 12 palaces.

## Conflicting evidence
None among tracked sources for the *decade-level* traversal specifically.
Note (documented, not treated as a conflict): the *annual* overlay
(`getAnnualMajorFortuneIndex` in `annual-flow.ts`) uses a materially
different, non-linear year-1/year-2-opposite/year-3-back-one pattern. This
is a distinct topic (`monthly_interaction`/annual overlay policies, not in
this phase's blocking list) and is called out here only so it is not
mistaken for evidence against CP-1.

## Selected V0 rule
`RULE-MF-PALACE-TRAVERSAL` (`POL-MF-PALACE-TRAVERSAL`):
```
palaceIndex(cycleIndex) = modulo12(startingPalaceIndex + cycleIndex * directionSign)
```
- `directionSign`: `+1` for forward (thuận), `-1` for reverse (nghịch),
  taken from the already-resolved `POL-MF-DIRECTION`/`POL-MF-YIN-YANG-GENDER`
  policies.
- `cycleIndex`: zero-based, non-negative integer.
- `modulo12`: standard non-negative modulo (result always in `[0, 11]`).
- Negative or non-integer `cycleIndex` is **rejected**, not wrapped or
  clamped.

### Normative examples
| Start palace | Direction | Cycle index | Result palace | Notes |
|---|---|---|---|---|
| 0 | forward | 0 | 0 | order 0 always equals the start palace |
| 0 | forward | 1 | 1 | one step forward |
| 0 | reverse | 1 | 11 | one step reverse wraps to 11 |
| 11 | forward | 1 | 0 | forward wrap-around past 11 → 0 |
| 0 | forward | 12 | 0 | full 12-cycle loop returns to start |
| 0 | forward | -1 | **rejected** | negative cycle index is invalid |
| 0 | forward | 1.5 | **rejected** | non-integer cycle index is invalid |

## Rejected alternatives
CP-2 (zigzag/non-linear) — rejected for this topic specifically because no
source applies it at the decade level; it remains correctly tracked for the
*annual* overlay under a separate policy family.

## Rationale
Single tracked source, but directly corroborated by the existing
Calculation Core's decade-traversal formula (`order = fix((palace.index -
menhIndex) * directionSign)` in both engines), which is linear and
modulo-12 with no zigzag — read directly from the code, matching CP-1
exactly. Cross-checked against the *different* annual-overlay formula to
avoid misattributing that mechanic here.

## Known uncertainty
- Only one primary source's claim is registered for this specific mechanic
  (`CLM-MF-009`, SRC-MF-001). Per the mission's "do not claim consensus from
  one source" rule, this is explicitly flagged: Trung Châu's traversal
  mechanic was **not** independently re-verified in a Trung Châu-specific
  passage in this phase (SRC-MF-002's registered claims cover Tứ Hóa
  Đại Vận and Tiểu Hạn rejection, not traversal arithmetic explicitly).
  The `mixed` school designation here rests on: (a) one explicit Nam Phái
  claim, and (b) the fact that both engines' code implements identical
  traversal arithmetic. This is corroboration from code, not from a second
  independent text, and is recorded as a real gap for a future phase.

## Implementation consequences
A future calculator must reject negative or non-integer cycle indexes
rather than silently wrapping them, and must not conflate this decade-level
traversal with the annual zigzag overlay.

## Required tests
- All 6 normative examples above, as explicit fixtures/unit assertions.
- All 12 possible starting palaces × both directions, spot-checked for
  correct modulo behavior.
- Explicit rejection test for negative and non-integer cycle indexes.
