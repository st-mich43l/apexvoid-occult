# Annual Axes V0.12 decision

**STATUS: IMMUTABLE CONTROL · REQUIRES_RERUN for coverage metrics**

## Current decision

**AAV12_COVERAGE_DECISION_REQUIRES_RERUN**

V0.12 remains a valid **research scale-control candidate**, but the previously committed static-coverage table is no longer authoritative.

## Why the rerun is required

The original `runStaticCoverageAudit()` loaded the V0.12 registry but evaluated admitted evidence through the older V0.11 `aggregateStaticDomain()` path. That mixed two candidate semantics inside one coverage report.

The audit now runs `aggregateStaticDomainV12()` directly. No replacement coverage numbers are asserted in this document until the corrected research CLI is executed and reviewed.

Separately, PR #242 temporarily added VERIFIED_PRIMARY doctrine fallback into V0.12 under the unchanged `0.12.0` identity. That changed the control candidate after its decision/corpus had already been published. The doctrine fallback has been removed from V0.12; V0.13 is the sole doctrine-augmented candidate.

## Stable V0.12 contract

- candidateId: `CANDIDATE-AAV12-CALIBRATED-DOMAIN-SIGNALS`
- engineVersion: `0.12.0`
- formulaVersion: `v0.12-static-direction-activation-role-compose`
- static formula: `directionalNet × activation`
- selected `referenceMass=4`
- aggregation: per physical palace, then normalized role weights
- doctrine fallback: **none**
- layer profile: **CONTROL-LAYERED-BALANCED** `0.30 / 0.25 / 0.35 / 0.10`
- domain projection: legacy unchanged
- production default: **V0.11 unchanged**

## Findings that remain valid

The sparse one-sided saturation defect in the earlier natal-domain signal was real, and the V0.12 direction × activation formulation was introduced specifically to prevent a tiny one-sided evidence mass from becoming an automatic `±1` layer signal.

The historical corpus numbers remain available in Git history for provenance, but they must not be used as current V0.12 coverage truth until the corrected audit is rerun.

## Promotion status

Production promotion remains **NO**.

Required next step:

```bash
npm run research:annual-axes-v012:validate
npm run research:annual-axes-v012:case
npm run research:annual-axes-v012:audit
```

Then use immutable V0.12 as the control for the V0.13 doctrine-coverage audit.
