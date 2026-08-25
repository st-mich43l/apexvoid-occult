# Palace Overview V1.2 historical runtime restore — engineering report

## Decision

`PALACE_OVERVIEW_V1_2_HISTORICAL_RUNTIME_RESTORED`

## Production version identity

Restored exactly from `0ac04ad`:

- id: `palace-overview-version-manifest-v1-2`
- knowledgeVersion / scoringKnowledgeVersion / semanticKnowledgeVersion: `1.2.0-experimental`
- scoringInfrastructureVersion: `1.0.0`

Research semantic/scoring packs remain under `version-manifest.research-v2.json` (`2.0.0-experimental`) and do not set production `result.versions`.

## Historical fixtures

Generated inside worktree `/tmp/apexvoid-po-0ac04ad` at commit
`0ac04ad0875dd3de5b03036d8a673fa6b00b8a08` only.

Metadata: `generatedByCommit` = that SHA (no `chartGeneration: current-calculation-core`).

## Fact diff

See `fact-diff-0ac04ad-vs-current.json`.

Only engine numeric-relevant diff on fixture charts:

- Thiên Cơ @ Sửu: historical Hãm → current engine Đắc
- classification: `PALACE_OVERVIEW_COMPAT_REQUIRED` (+ later core change noted)
- CASE-PO-1991: IDENTICAL

## Compatibility adapter

`normalizePalaceOverviewFrozenFacts` + `frozen-brightness-compat.0ac04ad.json`

PO-only. Does not mutate ChartData / Major Fortune / Annual Axes / UI.

## Equality

`HISTORICAL_NUMERIC_EQUALITY = PASS` for CASE-PO-1998-DAN-MALE nam-phai
(three-state report regenerated).

## Radar

Production badge: **V1.2 FROZEN** (from version metadata). Research candidate URL: unchanged.

## Annual Axes

No weight/config changes in this PR. Handoff artifact:

`.research-artifacts/annual-axes-v10/post-po-restore-1998.json`
(+ corpus-24).
