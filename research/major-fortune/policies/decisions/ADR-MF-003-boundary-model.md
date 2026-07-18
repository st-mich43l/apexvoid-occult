# ADR-MF-003: Age Increment Boundary Model

## Status
Accepted for V0.3. `POL-MF-AGE-BOUNDARY` (meta-selector) and
`POL-MF-CALENDAR-BOUNDARY` (concrete model) are `default`/selected.
`POL-MF-BIRTHDAY-BOUNDARY` and `POL-MF-SOLAR-TERM-BOUNDARY` are `rejected`
for V0.3 — evaluated and explicitly not selected, not silently omitted.

## Question
Exactly when does the nominal age count (ADR-MF-002) increment? Three
distinct candidate boundary events were evaluated, per the mission's
explicit instruction to keep them as three separate topics rather than one
ambiguous "age rule":
1. Calendar-year boundary (lunar new year / Tết Nguyên Đán)
2. Birthday boundary (exact solar calendar birthday)
3. Solar-term boundary (Lập Xuân / start of spring)

## Candidate policies
- **CP-1 — Calendar-year boundary (Tết Nguyên Đán)** (selected): nominal age
  increments exactly once, at the lunar new year rollover.
- **CP-2 — Birthday boundary**: nominal age increments on the exact solar
  anniversary of birth. Rejected.
- **CP-3 — Solar-term boundary (Lập Xuân)**: nominal age increments at the
  solar-term boundary conventionally used in Bát Tự (Four Pillars). Rejected
  for Major Fortune / Tử Vi.
- **CP-4 — Composite model** (e.g. Lập Xuân for year-pillar purposes,
  birthday for some other purpose): not evaluated in depth because no
  tracked source proposes any composition for Major Fortune specifically.
  Per the mission's explicit rule, composition is disallowed unless a cited
  source explicitly defines it — none does.

## Supporting claims
- `CLM-MF-010` (SRC-MF-001): nominal age increments at Tết Nguyên Đán, not
  the solar birthday, not a solar term.
- `CLM-MF-012` (SRC-MF-002): Trung Châu independently agrees.

## Conflicting evidence
- No tracked Tử Vi source proposes CP-2 (birthday) for Major Fortune.
- No tracked Tử Vi source proposes CP-3 (Lập Xuân) for Major Fortune. Lập
  Xuân is a well-documented boundary in Bát Tự (year-pillar rollover), and
  it is plausible some modern practitioners informally borrow it for Tử Vi,
  but this ADR found no primary or recognized-school text asserting that
  composition, so it is recorded as **rejected for insufficient evidence**,
  not as **disproven**.
- The legacy Calculation Core (`engine-nam-phai.ts`, `engine-trung-chau.ts`)
  uses only the lunar-calendar-year formula, with no birthday or solar-term
  logic anywhere in the age computation — checked directly by reading the
  code, not assumed.

## Selected V0 rule
- `POL-MF-AGE-BOUNDARY.rule.parameters.selectedBoundaryModel = "calendar_year_boundary"`
- `POL-MF-CALENDAR-BOUNDARY.rule.type = "lunar_new_year_boundary"`,
  `boundaryEvent = "tet_nguyen_dan_lunar_new_year"`, incrementing exactly
  once per lunar year rollover. Timezone/calendar conversion is delegated to
  the Calculation Core's existing solar-to-lunar conversion; this ADR does
  not introduce a new calendar algorithm.
- Composition with birthday or solar-term boundaries is explicitly
  disallowed (`compositionAllowed: false`) absent a cited source.

## Rejected alternatives
- `POL-MF-BIRTHDAY-BOUNDARY` — status `rejected`. No supporting source;
  conflicts with the selected model.
- `POL-MF-SOLAR-TERM-BOUNDARY` — status `rejected`. Recognized for Bát Tự,
  not for tracked Tử Vi Major Fortune sources; conflicts with the selected
  model.

Both remain in the school-policy-matrix as fully-specified, documented,
explicitly-rejected policies (not deleted) so a future phase can re-open
them if a source is found.

## Rationale
Two independent primary sources plus direct code audit converge on the same
single boundary model. The mission explicitly permits "not every boundary
policy must become selected" and requires exactly one active model per
executable profile — CP-1 is that one model.

## Known uncertainty
- Exact page locators unverified (`conditional` confidence, matching
  existing registry precedent for all other claims).
- Whether any Vietnamese Tử Vi school ever does mix Lập Xuân and Tết
  boundaries in practice (outside written sources) is not something this
  research phase can rule out — only that no *tracked source* documents it.
  If thầy is aware of such a source, it should be added to the registry and
  this ADR revisited.

## Implementation consequences
A future policy-aware calculator must implement exactly one boundary check
(lunar year rollover) for Major Fortune / Tiểu Hạn / Lưu Niên age purposes
under the `nam-phai`/`trung-chau` V0.3 profiles. `POL-MF-BIRTHDAY-BOUNDARY`
and `POL-MF-SOLAR-TERM-BOUNDARY` must not be silently activated by any
future default.

## Required tests
- Target date before the lunar-year boundary → age unchanged.
- Target date exactly at the boundary → age increments.
- Target date after the boundary → age reflects the increment.
- Executable-profile validation: exactly one of
  {calendar_year_boundary, birthday_boundary, solar_term_boundary}-linked
  policies has a non-`rejected`/non-`unresolved` status.
