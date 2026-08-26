# Annual Axes V0.13 decision

**STATUS: ACTIVE RESEARCH · REQUIRES_RERUN**

## Current decision

**AAV13_DOCTRINE_COVERAGE_REQUIRES_RERUN**

V0.13 remains the active doctrine-augmented research candidate, but the previously stated readiness decision must be regenerated from a clean immutable V0.12 control.

## Why the rerun is required

After V0.13 was created, PR #242 mutated V0.12 by adding the same VERIFIED_PRIMARY fallback under the unchanged `0.12.0` identity. PR #243 then changed V0.13 tests to accommodate that overlap. This destroyed the intended experiment:

`V0.12 registry-only control → V0.13 doctrine-augmented candidate`.

The lineage is now restored:

- V0.12 is registry-only `directionalNet × activation`;
- V0.13 is the sole doctrine-augmented static-domain candidate;
- duplicate V0.12 doctrine runtime/test code has been removed.

The V0.13 doctrine resolver is also hardened so doctrine conditions resolve only against natal/static evidence:

- static natal stars only;
- physical natal palace branch;
- `chart.natalMutagens` scoped to that palace;
- annual/Lưu, Major Fortune, monthly, and daily facts cannot satisfy doctrine conditions.

## Candidate contract

- candidateId: `CANDIDATE-AAV13-DOCTRINE-AUGMENTED-STATIC`
- engineVersion: `0.13.0`
- productionImpactAllowed: **false**
- production default: **V0.11 unchanged**
- immediate control: **immutable V0.12**
- static signal formula: V0.12 `directionalNet × activation`, `referenceMass=4`
- physical-palace aggregation: unchanged from V0.12
- layer mix: **0.30 / 0.25 / 0.35 / 0.10 unchanged**
- domain projection: **legacy unchanged**
- Annual Trigger V0.8.2: unchanged
- Major Fortune: unchanged
- resonance: unchanged
- final tanh mapping: unchanged

## Doctrine bridge policy

Only copied claims satisfying all of the following may enter the V0.13 research bridge:

1. `adjudication = VERIFIED_PRIMARY`;
2. `locatorType = EXACT_SECTION`;
3. school is `classical-shared` or `nam-phai`;
4. source claim keeps `numericDelta = null`;
5. declared conditions resolve deterministically and fail closed against natal/static facts;
6. V0.12 physical-star numeric evidence has priority — doctrine is fallback-only;
7. a more-specific satisfied claim overrides a general claim for the same physical star + direction;
8. `magnitudeOrdinal = unspecified` remains context-only;
9. activation/stability-only tendencies remain context-only;
10. support-down maps to pressure and pressure-down maps to support; mixed directional claims preserve both directions in trace.

The ordinal bridge remains explicit engineering research policy:

- weak → 1
- moderate → 2
- strong → 3
- unspecified → no numeric contribution

These values are **not classical numeric authority**.

## Evidence-aware availability

V0.13 distinguishes palace-anchor resolution from actual admitted static evidence.

Effective natal coverage remains:

`min(projectionCoverage, evidenceCoverage)`

where `evidenceCoverage` is the normalized role-weight share of mapped physical palaces with admitted directional evidence.

## Hard boundaries

- `ANNUAL_AXES_PALACE_OVERVIEW_NUMERIC_DEPENDENCY = ZERO`
- no `PalaceOverviewResult`, score, or `rawAxes` input;
- no production router change;
- no Palace Overview change;
- no biography/outcome fitting;
- no domain-specific score target;
- no layer-weight or tanh retuning;
- `romance-expanded` remains unpromoted.

## Required rerun

```bash
npm run research:annual-axes-v012:validate
npm run research:annual-axes-v012:audit
npm run research:annual-axes-v013:validate
npm run research:annual-axes-v013:case
npm run research:annual-axes-v013:audit
```

Only after those artifacts are regenerated may V0.13 receive a new coverage-readiness decision.

Production promotion remains **NO**.
