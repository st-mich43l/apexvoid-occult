# ADR-0001: Analysis numeric independence

**STATUS: ACCEPTED**

## Decision

Annual Axes must not numerically consume Palace Overview outputs
(`PalaceOverviewResult`, palace `score`, or `rawAxes`).

Both products may share physical facts from Calculation Core.

## Consequences

- Natal foundation uses Annual-Axes-owned domain engine / registries
- Import-boundary tests guard production AA trees
- UI left/right radars are independent engines
