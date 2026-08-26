# Annual Axes V0.13 — doctrine-backed static coverage

**STATUS: ACTIVE RESEARCH**
Canonical architecture: [`docs/architecture/annual-axes.md`](../../../docs/architecture/annual-axes.md)

Status: **research-only / experimental / uncalibrated**. Not released.

## Why

V0.12 fixed sparse one-sided saturation with `directionalNet × activation`, but its natal-capable static registry remained too thin for several domains, especially career and wealth.

V0.13 tests the next narrow hypothesis: existing `VERIFIED_PRIMARY` star×palace doctrine claims can fill missing static-domain evidence without importing Palace Overview numeric scores or inventing new star points.

## Candidate

`CANDIDATE-AAV13-DOCTRINE-AUGMENTED-STATIC`

- Base static scorer: V0.12.
- Doctrine source: copied claim fields from `palace-overview/v1/doctrine/conditional-claims.json`.
- Admission: `VERIFIED_PRIMARY` + `EXACT_SECTION` + accepted school only.
- `numericDelta` must remain `null` in source claims.
- Numeric bridge is explicitly engineering policy: weak=1, moderate=2, strong=3, unspecified=`context-only`.
- V0.12 physical-star evidence wins; doctrine is fallback-only and cannot double-count a star already scored by V0.12.
- More-specific matched conditions override general claims for the same star+direction.
- Activation/stability-only claims remain context and do not move the signed static net.

## Evidence-aware availability

V0.11/V0.12 projection coverage answered whether configured palace anchors were resolved. It did not mean those palaces actually had admitted static evidence.

V0.13 derives natal evidence coverage from normalized role weights of mapped physical palaces that have at least one admitted V0.12 or doctrine-fallback directional evidence row. Candidate natal availability is then based on:

`min(projectionCoverage, evidenceCoverage)`.

This prevents an empty static foundation from being labeled fully available merely because palace names resolved.

## Hard boundaries

- Production remains V0.11.
- V0.12 remains the immediate shadow control.
- Palace Overview score/rawAxes are forbidden dependencies.
- Annual Trigger V0.8.2 unchanged.
- Major Fortune unchanged.
- Resonance unchanged.
- Layer mix remains 0.30 / 0.25 / 0.35 / 0.10.
- Legacy domain projection unchanged.
- `romance-expanded` remains research-only and is not promoted.

## Commands

```bash
npm run research:annual-axes-v013:validate
npm run research:annual-axes-v013:case
npm run research:annual-axes-v013:audit
```

Artifacts are written under `.research-artifacts/annual-axes-v013/`.

## Review gate

This PR does **not** declare the static evidence problem solved. Review the V0.13 corpus coverage and per-domain availability before any later PR considers layer-weight or tanh tuning.
