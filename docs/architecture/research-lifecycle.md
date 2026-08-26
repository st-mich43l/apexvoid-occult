# Research lifecycle and version discipline

**STATUS: CURRENT**

## Four distinct concepts

| Concept | Meaning |
| --- | --- |
| Research artifact | Generated audit output (often gitignored under `.research-artifacts/`) |
| Research candidate | Executable analyzer + knowledge with candidate id; **not** production |
| Immutable control | Candidate frozen as A/B baseline; scoring semantics locked for that identity |
| Released runtime | Selected by `released-router` / production contracts |

Executable ≠ released.

## Lifecycle

```text
IDEA
  → RESEARCH_CANDIDATE
  → CORPUS_AUDITED
  → DECISION_RECORDED
  → FROZEN_CONTROL or REJECTED
  → RELEASE_CANDIDATE
  → RELEASED
```

## Rules

1. Once a candidate publishes decision/corpus, do **not** mutate scoring
   semantics under the same `engineVersion` / `knowledgeVersion` /
   `formulaVersion`.
2. Semantic scoring change requires a **new** version/candidate.
3. If a historical candidate must be corrected: invalidate artifacts, mark
   `REQUIRES_RERUN`, preserve Git history, do not invent replacement metrics.
4. Never tune from a single biography/chart outcome.
5. Artifact numbers are valid only for the exact candidate identity that
   produced them.

## Generic lesson (lineage cleanup)

> A control candidate must remain immutable once used as the baseline for a
> later candidate.

Concrete instance (historical): adding doctrine fallback into V0.12 under
unchanged `0.12.0` after its decision/corpus published invalidated the control.
Doctrine ownership was restored to **V0.13 only**; V0.12 returned to
registry-only. See `research/annual-axes/v0.12/decision.md` and
`research/annual-axes/v0.13/decision.md`.

## Annual Axes mapping

| Version | Lifecycle slot |
| --- | --- |
| V0.11 | RELEASED (experimental / uncalibrated) |
| V0.12 | FROZEN_CONTROL |
| V0.13 | RESEARCH_CANDIDATE (doctrine-augmented; decisions may say REQUIRES_RERUN) |

Promotion of V0.12/V0.13 to production requires a **separate release PR**.
Architecture docs PRs must not promote them.
