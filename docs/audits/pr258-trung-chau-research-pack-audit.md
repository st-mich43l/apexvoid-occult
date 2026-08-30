# PR #258 — Trung Châu Research Pack V0 Audit

**Baseline:** `38205472da39bc565b10a2edcb4587ca2d5c82e5` (master after PR #257)
**Branch:** `research/pr258-trung-chau-research-pack-v0`
**STATUS:** IN PROGRESS (Commit 1 — inventory)

## 1. Baseline

Authoritative baseline is master after PR #257:

`refactor(ziwei): harden school policy contracts and decouple mutagen resolution`

Verified: branch tip starts at `38205472da39bc565b10a2edcb4587ca2d5c82e5`.

## 2. Mission

Establish a provenance-first Trung Châu Research Pack V0 that:

1. Registers sources honestly (no invented doctrine).
2. Separates CURRENT RUNTIME from research verdicts.
3. Leaves ERQ-005 open.
4. Makes ZERO Calculation Core / Analysis / narrative / API changes.

## 3. Authority boundaries

```text
RESEARCH CLAIM != RELEASED CALCULATION POLICY
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
Research Pack V0: runtimeAuthority=false, runtimeImpact=none, narrativeAuthority=false
```

## 4. Existing research patterns reviewed

| Pattern | Path | Reuse |
| --- | --- | --- |
| Annual Axes source registry | `annual-axes/annual-source-registry.v0.json` | IDs, allowed/prohibited usage, researchQueue |
| PO doctrine source registry | `palace-overview/v1/doctrine/source-registry.json` | Bibliographic shells; Zhongzhou/Wang UNVERIFIED |
| Self-contained research pack | `palace-overview-research-v2/` | Local schema/validate/loader; no global wiring |
| Provenance doc | `docs/architecture/knowledge-and-provenance.md` | Promotion path |
| ERQ-005 | `docs/audits/pr247-expert-review-queue.md` | Keep open; do not renumber |

## 5. Files created

(Populated as commits land — see final section.)

## 6–11. Statistics

Pending Commit 3–4 fills. V0 expected **incomplete**.

## 12. Protected runtime files

Expected empty diff vs baseline for engines, schools, calculation helpers,
ChartData, Analysis scoring, UI, backend KB, golden, contracts, OpenAPI,
workflows, lockfile, `.npmrc`, Docker.

## 13. Validation

Pending full suite at Commit 5.

## 14. Unresolved findings

- No primary Trung Châu text inspected for this V0 authoring pass yet.
- ERQ-005 remains open.
- Most doctrine matrix rows start as insufficient evidence.

## 15. Recommended next step

After V0 structural pack lands: evidence expansion (V0.1) or expert review
session on ERQ-005 — not a silent Calculation Core PR.
