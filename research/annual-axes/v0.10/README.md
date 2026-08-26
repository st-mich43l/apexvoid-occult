# Annual Axes V0.10 research notes

**STATUS: HISTORICAL / SUPERSEDED**
**Executable lineage note:** folder `modules/annual-axes/v0.10-layered/` remains a
**HISTORICAL_RUNTIME_DEPENDENCY** hosting released **V0.11** primitives. Do not
delete it because the version label says “0.10”. See
[`docs/architecture/annual-axes.md`](../../../docs/architecture/annual-axes.md).

---

Historical **V0.9** evaluated incremental Thiên Mã / star-shape candidates and
retained V0.8 at that time. **V0.10 layered fortune** was the research step that
led to released **V0.11**. V0.10 research decisions must not be reopened as if
they were current production.

Runtime primitives still live under `src/lib/ziwei/analysis/modules/annual-axes/v0.10-layered`,
but the **released** Nam Phái identity is V0.11 (`0.11.0`,
`CANDIDATE-AAV11-DOMAIN-ENGINE`). Research profiles and projection variants must
not silently replace the released `layered-balanced` + `legacy` route.

## Major Fortune projection hardening

PR #230 follows the diagnostic left by the original V0.10 research: sparse
Major Fortune evidence could project `signedNet = +/-1` into a domain because
directional balance normalized by its own mass while activation remained trace
metadata. The adapter also consumed production-admitted evidence before the
ordinal evaluator's duplicate/conflict/ownership rejection stage.

The hardening keeps the released profile, domain anchors and V0.8 tanh mapping
unchanged:

- decade projection consumes only `acceptedEvidenceIds` from the upstream Major
  Fortune ordinal result;
- domain support/pressure masses and contributor provenance remain visible;
- directional balance is activation-gated using the existing V0.10 Major
  Fortune activation reference mass (`4`), so sparse one-sided evidence cannot
  saturate a domain to `+/-1`;
- diagnostics report filtered upstream rejections and sparse-evidence damping.

This is an integrity correction, not calibration. It does not assert that a
lower or higher domain score is astrologically correct.

## Romance Semantic Evidence V0.1

PR #231 (stacked on #230) adds a **research-only, non-numeric** shadow model:

`romance-semantic-v0.1`

### Why generic rawAxes may be insufficient

Natal Foundation romance currently aggregates:

`supportMass += palace.rawAxes.support × anchorWeight`
`pressureMass += palace.rawAxes.pressure × anchorWeight`

for legacy anchors Phu Thê (0.60) + Tử Tức (0.40). That is **generic palace
structural balance** from Palace Overview. It does not preserve
relationship-specific doctrine tendencies such as “Tham Lang @ Phu Thê →
pressure/activation” vs “Thái Âm @ Phu Thê → support/stability”.

### What stays non-scoring

- Palace Overview `annotations` remain annotation-only.
- Doctrine `PalaceDomainModifierCandidate.numericDelta` remains `null`.
- This module sets `numericAuthority: "none"` and `scoreImpactAllowed: false`.
- It does **not** enter `composeLayerNets` / released router.

### Source / adjudication policy

| Tier | Adjudication | Admission |
| --- | --- | --- |
| A | VERIFIED_PRIMARY / VERIFIED_SCHOOL | yes, require exact locator |
| B | EXPERT_SYNTHESIS | visible research admission (separate count) |
| — | UNVERIFIED / ENGINEERING_POLICY | rejected-source |

School gate for Nam Phái: `classical-shared` or `nam-phai` only.

### Condition resolution

Brightness / branches / coStars / supportStars / pressureStars /
transformations resolve deterministically against Palace Overview natal facts.
Any required unresolved fact → `unresolved-condition` (fail closed).

### Commands

```bash
npm run research:annual-axes-v10:romance-case
npm run research:annual-axes-v10:romance-audit
```

Artifacts (gitignored): `.research-artifacts/annual-axes-v10/romance-semantic/`

### Decision (research outcome)

**ROMANCE_SEMANTIC_EVIDENCE_PARTIAL**

Findings from CASE-AA10-M1998-DAN-2026 and the 24-chart corpus:

- Doctrine catalog has only **2** verified Phu Thê claims (Thái Âm, Tham Lang)
  and **2** Tử Tức claims — too sparse for a numeric bridge.
- On the diagnostic chart, Phu Thê majors (Cự Môn / Thái Dương / Thiên Đồng /
  Thiên Cơ) do **not** hit those catalog stars, so admitted Phu Thê semantics
  are empty while generic `rawAxes` stay near-neutral (`structureNet ≈ -0.04`).
- Tử Tức admits Tham Lang activation-only semantics that Natal Foundation never
  surfaces as relationship-specific meaning.
- Corpus hits accumulate, but catalog density (not hit sums) gates outcome A.

No calibration / no production romance score change in this PR.

Do not revive deleted V0.9 runtime packages here.
