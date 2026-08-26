# ADR-0003: Versioned doctrine snapshots

**STATUS: ACCEPTED**

## Decision

Research candidates may snapshot sourced qualitative claims into
candidate-specific knowledge packs to avoid runtime coupling to other modules’
doctrine loaders.

## Consequences

- V0.13 owns the Annual Axes doctrine bridge snapshot
- Claims keep `numericDelta=null`; ordinal→mass is engineering policy
- Snapshot integrity tests verify copy-faithfulness to the canonical catalog
- Runtime independence does not erase provenance obligations
