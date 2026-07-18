# ADR-MF-002: Age Model (Nominal vs Actual Age)

## Status
Accepted for V0.3 (`POL-MF-NOMINAL-VS-ACTUAL`, school: `mixed`, status: `default`).

## Question
Is the age used to determine which Major Fortune decade is active a Western
actual/solar age (years since exact birth date), or a nominal/traditional age
count (tuổi mụ), where the birth year already counts as age 1?

## Candidate policies
- **CP-1 — Nominal age (tuổi mụ)** (selected): birth year is age 1; the count
  increments once per lunar calendar year, independent of the exact solar
  birthdate.
- **CP-2 — Actual/solar age**: age increments exactly on the solar birthday,
  starting from 0 at birth. Considered and rejected for V0 — no tracked
  source describes Major Fortune age counting this way, and it does not
  match legacy runtime behavior.

## Supporting claims
- `CLM-MF-010` (SRC-MF-001, Chương Vận Hạn): age used for vận hạn is tuổi mụ
  (birth year = age 1), incrementing at Tết Nguyên Đán, not the solar
  birthday and not a solar term.
- `CLM-MF-012` (SRC-MF-002, Trung Châu): independently confirms tuổi mụ /
  lunar-year increment; not a Nam Phái/Trung Châu point of disagreement.

## Conflicting evidence
None among tracked sources. Western "actual age" is a plausible alternative
in principle (and is how most modern software defaults ages), but no
tracked classical or school text proposes it for Major Fortune, so it is
rejected for V0 rather than left ambiguous.

## Selected V0 rule
`RULE-MF-AGE-MODE` (`POL-MF-NOMINAL-VS-ACTUAL`):
- `ageModel: "nominal"`, `ageAtBirth: 1`, `incrementUnit: "lunar_calendar_year"`.
- This governs age *representation* only. See ADR-MF-003 for exactly *when*
  the nominal count increments (the boundary model).

## Rejected alternatives
CP-2 (actual/solar age) — no supporting claim found; also inconsistent with
the existing legacy runtime, which computes
`nominalAge = Math.max(1, annualYear - lunar.year + 1)` — a lunar-calendar-
year-based formula, not a solar-birthday-based one.

## Rationale
Two independent primary sources (Nam Phái, Trung Châu) agree, and the
existing Calculation Core's `nominalAge` variable name and formula were
directly read (not assumed) and match this model exactly. This is treated
as corroborating evidence for an already-sourced claim, not as the primary
justification — the claims were identified first.

## Known uncertainty
- Exact page locator remains unverified (`conditional` confidence).
- The formula `Math.max(1, annualYear - lunar.year + 1)` clamps to a minimum
  of 1; this ADR does not verify whether that clamp itself has classical
  textual support or is purely a defensive engineering choice. It is noted
  here as an open question for a future phase, not resolved by this ADR.

## Implementation consequences
A future policy-aware calculator must not introduce actual/solar age as an
alternative default; if an actual-age mode is ever added, it must be a
separate, explicitly-selected override, not a silent default. Implementation
remains `not_started` in this phase.

## Required tests
- Fixture pairs comparing nominal age at the same solar birthdate across
  different query dates within the same lunar year (age must not change
  mid-lunar-year even if the solar birthday has passed).
- Fixture confirming age = 1 in the birth lunar year itself.
