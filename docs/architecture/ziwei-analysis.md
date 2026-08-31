# Zi Wei Analysis Core

**STATUS: CURRENT**

Primary path: `src/lib/ziwei/analysis/`

## Layout

```text
analysis/
  contracts/     availability + version surface for UI (getAnalysisStatus)
  facts/         natal fact normalization from ChartData
  frame/         static TP4C geometry helpers
  knowledge/     versioned JSON / loaders (data + policy, not executors)
  modules/       executable analyzers per product
  feature-flags.ts
  index.ts
  README.md      module summary (kept short; defer to docs/architecture)
```

## Layer responsibilities

| Layer | Responsibility | Allowed imports | Forbidden |
| --- | --- | --- | --- |
| `contracts/` | Stable status/version API for UI | knowledge loaders, feature flags | research candidates, artifacts |
| `facts/` / `frame/` | Shared physical-fact typing & geometry | ChartData, calculation helpers | module scores |
| `knowledge/` | Versioned catalogs & policies | JSON + schema validators | UI, research artifacts |
| `modules/*` | Product analyzers | facts, frame, own knowledge, shared kernels | other modules’ **scores** as inputs |
| released routers | Production selection | one released implementation path | active research analyzers |
| `src/scripts/` | Offline gates / research CLIs | modules + knowledge | must not be imported by UI runtime |
| `research/` | Decisions & provenance | docs only | not a runtime import root |

## Modules (live)

| Module path | Lifecycle | Notes |
| --- | --- | --- |
| `modules/palace-overview/` | **RELEASED / FROZEN** V1.2 | Static 12-palace structure; year-invariant |
| `modules/annual-axes/` | **RELEASED** V0.11 (+ research V0.12/V0.13) | See [`annual-axes.md`](./annual-axes.md) |
| `modules/major-fortune/` | **RELEASED** ordinal | Decade evidence; may feed AA decade layer |
| `modules/monthly-flow/` | **RELEASED** Nam Phái V0.3; TC unavailable; gated V1 RC1 | Must not contaminate natal static evidence; no TC V0.3 / ghost 0.1.2 |

## Share rules

**May share:** canonical star identity, palace index/name/branch, brightness
facts, natal Tứ Hóa physical facts, temporal fact DTOs, TP4C geometry helpers,
deterministic utilities.

**Must not share as numeric inputs across products:** weights, normalization
scales, final score formulas, acceptance ranges, domain projections, Palace
Overview `rawAxes` / scores into Annual Axes.

## Versioning rule

- Production identity lives in **version constants + knowledge profiles**.
- Folder names may lag (e.g. `v0.10-layered/` hosts V0.11 runtime primitives).
  Treat path names as lineage labels, not lifecycle truth.
  See naming debt in [`annual-axes.md`](./annual-axes.md#naming-debt).
