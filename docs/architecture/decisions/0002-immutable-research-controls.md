# ADR-0002: Immutable research controls

**STATUS: ACCEPTED**

## Decision

Once a research candidate is used as the control baseline for a later
candidate (published decision/corpus), its scoring semantics must not change
under the same engine/knowledge/formula identity.

## Consequences

- V0.12 remains registry-only after being V0.13’s control
- Semantic changes require a new candidate version
- Lineage-correction PRs must invalidate and rerun artifacts, not rewrite
  metrics in place
