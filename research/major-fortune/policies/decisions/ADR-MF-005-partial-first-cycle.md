# ADR-MF-005: Partial First Cycle (Pre-Fortune Childhood)

## Status
Accepted for V0.3 (`POL-MF-PARTIAL-FIRST-CYCLE`, school: `mixed`,
status: `default`).

## Question
What is the correct behavior for ages before the Cục-derived starting age
(`POL-MF-STARTING-AGE`)? The mission lists several allowed outcomes: no
active Major Fortune; a childhood/pre-fortune state; first cycle active from
birth; or a school-specific alternative. Which applies for V0.3?

## Candidate policies
- **CP-1 — No active Major Fortune (childhood/pre-fortune state)**
  (selected): for `nominalAge < cucNumber`, no palace is considered the
  active Major Fortune. The calculation returns an explicit "no active
  cycle" result, never a fabricated decade index.
- **CP-2 — First cycle active from birth**: order 0's range would be
  extended to start at age 1 instead of `cucNumber`. Rejected — no source
  supports extending order 0's start age, and it would silently change the
  meaning of `POL-MF-STARTING-AGE`, which this phase does not have grounds
  to revisit.
- **CP-3 — Separate "hạn Tiểu Nhi" (childhood limit) mechanism**: some
  modern secondary sources describe a distinct childhood-limit calculation
  for the pre-Cục period, separate from Major Fortune. Considered, but
  **not selected** for V0.3 — no tracked primary source (SRC-MF-001,
  SRC-MF-002) documents this as part of Major Fortune, and no such mechanism
  exists anywhere in the current codebase (verified by direct search — zero
  matches for "Tiểu Nhi" in `src/lib/ziwei/`). Adopting it now would require
  either new sourced research or new runtime logic, both out of scope for
  this phase.

## Supporting claims
- `CLM-MF-011` (SRC-MF-001, Chương Đại Vận): before the Cục-derived starting
  age, the person is in a childhood period with no Major Fortune cycle
  actively governing them; this period is not assigned to any Major Fortune
  palace.

## Conflicting evidence
`CLM-MF-011`'s own `conflictNotes` field records that some modern sources
describe a separate "hạn Tiểu Nhi" mechanism for this period — this is
documented as a known alternative (CP-3) rather than hidden, but it is not
promoted to a selected policy because it is not confirmed as part of Major
Fortune specifically by any tracked primary source.

## Selected V0 rule
`RULE-MF-PARTIAL-FIRST-CYCLE` (`POL-MF-PARTIAL-FIRST-CYCLE`):
- `outcome: "no_active_major_fortune"`
- `condition: "nominalAge < cucNumber"`
- `activeCycleIndex: null`, `activePalaceIndex: null` — never fabricated.

This was independently confirmed against the existing legacy runtime: for
`order` in `[0, 11]`, `start = cucNumber + order * 10` has its minimum value
at `order = 0`, i.e. `start = cucNumber`. There is no `order` value that
produces `start < cucNumber`, so for `nominalAge < cucNumber`,
`assignMajorFortunes` in `engine-nam-phai.ts` never marks any palace
`active`, and `activePalace` stays `null` — read directly from the code,
not assumed.

## Rejected alternatives
- CP-2 (first cycle active from birth) — no supporting claim; would alter
  `POL-MF-STARTING-AGE`, out of scope.
- CP-3 (separate Tiểu Nhi mechanism) — no supporting *primary* claim found
  in the tracked registry; not implemented anywhere in the current codebase.
  Documented as a real open question for a future research phase, not
  fabricated as resolved here.

## Rationale
Direct textual claim (CLM-MF-011) plus exact match to already-audited
legacy behavior (no active palace before Cục age, per
`current-implementation-inventory.md` and direct code reading in this
phase). No decade index is invented for out-of-range ages, satisfying the
mission's explicit "do not fabricate a decade index" instruction.

## Known uncertainty
- Single primary source for this specific claim (SRC-MF-001 only,
  Nam Phái). Trung Châu's treatment of the pre-Cục period was not
  independently found in SRC-MF-002's currently registered claims — this is
  a genuine gap, not asserted as cross-school consensus.
- The CP-3 "hạn Tiểu Nhi" question remains genuinely open and is
  recommended for a follow-up research pass before any semantic/UI layer
  attempts to describe childhood years.

## Implementation consequences
A future calculator must return an explicit "no active Major Fortune"
/ `UnresolvedCalculationIssue`-style result for `nominalAge < cucNumber`,
never a fabricated or clamped decade index (e.g. never silently treating
order 0 as "already active" before its real start age).

## Required tests
- Age immediately before the starting age (`cucNumber - 1`) → no active
  cycle.
- Age exactly at the starting age (`cucNumber`) → order 0 active.
- Age one year before entering the second decade
  (`cucNumber + 9`, i.e. final year of order 0) → order 0 still active.
- Age exactly entering the second decade (`cucNumber + 10`) → order 1
  active.
