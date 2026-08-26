# Knowledge and provenance

**STATUS: CURRENT**

Knowledge packs are **data/policy**, not execution ownership. Analyzers load
versioned catalogs; they do not become “released” merely because JSON exists.

## Knowledge categories

| Category | Examples | Notes |
| --- | --- | --- |
| A. Physical/static rule data | star registries, aliases | Exact temporal layer matching |
| B. Source registry | `*-source-registry*.json` | Provenance ids |
| C. School policy | school allow-lists | e.g. classical-shared / nam-phai |
| D. Projection policy | `domain-projection.json` | AnnualDomainProjection |
| E. Engineering numeric policy | weights, ordinal→mass, referenceMass | **Not** classical law |
| F. Doctrine / semantic claims | V0.13 doctrine bridge snapshot | Qualitative; `numericDelta=null` |
| G. Calibration / audit fixtures | fixtures, corpora | Research-only |
| H. Release metadata | version manifests, candidate ids | Identity locks |

## Numeric authority labels

Every mapping must be one of:

| Label | Meaning |
| --- | --- |
| Sourced numeric authority | Locator-backed numeric from verified source pipeline |
| Engineering policy | Explicit engineering hypothesis (weights, ordinal masses) |
| Frozen inherited formula | Locked kernel (e.g. V0.8 tanh mapping reused by V0.11) |
| Research hypothesis | Candidate-only; not production |

Classical qualitative tendency **≠** numeric points unless a sourced numeric
authority exists.

Example (V0.13):

```text
SOURCE CLAIM:  "moderate support tendency"  (numericDelta=null)
ENGINEERING BRIDGE: moderate → 2 mass points   (research policy)
```

## Adjudication / source tiers

Used by doctrine packs (see V0.13 bridge):

| Tier | Role |
| --- | --- |
| `VERIFIED_PRIMARY` | Exact locator; only tier admitted into V0.13 bridge |
| `VERIFIED_SCHOOL` | School-scoped verified (not auto-admitted to V0.13) |
| `EXPERT_SYNTHESIS` | Expert synthesis — not primary scoring law |
| `UNVERIFIED` | Must not drive numeric |
| Engineering policy / hypothesis | Explicit non-classical mapping |

Claim fields (conceptual): `sourceId`, `locator`, `locatorType`, `school`,
`conditions`, `tendency`, `magnitudeOrdinal`, `numericDelta`.

## Snapshot policy

Research candidates may **snapshot** doctrine claims into candidate-specific
knowledge (e.g. `knowledge/annual-axes/v0.13/static-domain-doctrine-bridge.*.json`)
to avoid runtime coupling to Palace Overview doctrine loaders.

- Runtime independence ≠ provenance independence
- Tests must verify **copy-faithfulness** to the canonical source catalog
  (`doctrine-snapshot-integrity` tests)

## Annual Axes knowledge assets (classified)

Path root: `src/lib/ziwei/analysis/knowledge/annual-axes/`

| Asset | Lifecycle | Consumer | Authority |
| --- | --- | --- | --- |
| `v0.8/` | FROZEN_CONTROL / shared kernel | V0.11 annual trigger, research | Frozen formula |
| `v0.10/` (strings `0.11.0`) | RELEASED profile/projection | V0.11 | Engineering policy |
| `v0.12/` | FROZEN_CONTROL | V0.12 research | Registry engineering |
| `v0.13/` | ACTIVE_RESEARCH | V0.13 only | Doctrine snapshot + engineering ordinal |
| Root `annual-*.v0.json` packs | HISTORICAL_RUNTIME_DEPENDENCY / Trung Châu & legacy | Legacy analyze path / loaders | Do not treat as V0.11 identity |
| `loader.ts` / `schema.ts` | SHARED_INFRASTRUCTURE | Knowledge load | — |

Unused-looking root packs: **do not delete in docs PRs**. Record cleanup for a
later dead-code PR if `knip`/imports prove idle.

## Backend KB boundary

`backend/app/kb/` is narrative / retrieval knowledge.

Promotion path into analysis scoring:

```text
raw narrative
  → source discovery
  → exact source verification
  → source registry
  → claim-level adjudication
  → versioned analysis knowledge
  → research candidate
  → corpus audit
  → release decision
```

Skipping steps is forbidden.
