# Architecture documentation (SSOT index)

**STATUS: CURRENT**

This directory is the architecture source of truth for ApexVoid Occult’s
Zi Wei stack. Prefer these documents over narrative READMEs when resolving
conflicts.

## Truth hierarchy

When sources disagree, resolve in this order:

1. **Released code + contracts** (`released-router`, `contracts/`, version constants)
2. **Versioned knowledge metadata** (`knowledge/**/profile*.json`, manifests)
3. **Architecture SSOT** (this directory)
4. **Current research decision** (`research/**/decision.md` for the exact candidate)
5. **Historical research docs** (explicitly marked `STATUS: HISTORICAL` / `SUPERSEDED`)
6. **Narrative / backend KB** (`backend/app/kb/`) — never numeric scoring authority

Historical prose must never override live contracts.

## Why no `architecture-contract.json`

A machine-readable contract was considered and rejected for this PR: it would
duplicate version identity already owned by TypeScript constants and knowledge
profiles, creating a second maintenance source. Markdown + live version
constants remain authoritative.

## Document ownership

| Document | Owns |
| --- | --- |
| [`ziwei-system.md`](./ziwei-system.md) | Calculation Core vs Analysis Core vs UI/backend |
| [`ziwei-analysis.md`](./ziwei-analysis.md) | Analysis directory layout, import rules, modules |
| [`annual-axes.md`](./annual-axes.md) | Annual Axes production + research lineage (canonical) |
| [`knowledge-and-provenance.md`](./knowledge-and-provenance.md) | Source tiers, doctrine vs engineering policy |
| [`research-lifecycle.md`](./research-lifecycle.md) | Candidate promotion / immutability rules |
| [`decisions/`](./decisions/) | Short architecture decisions |

Root [`README.md`](../../README.md) stays product-facing: summary + links only.

Research folders under [`research/annual-axes/`](../../research/annual-axes/)
own **decisions and provenance**, not the global architecture narrative.

## Core principle

```text
PHYSICAL FACT
     ≠
ANALYTIC EVIDENCE
     ≠
SOURCE DOCTRINE
     ≠
ENGINEERING POLICY
     ≠
RESEARCH RESULT
     ≠
RELEASED RUNTIME
     ≠
NARRATIVE OUTPUT
```

Never collapse these layers.
