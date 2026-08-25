# Palace Overview frozen baseline restore — engineering report

## 1. Frozen baseline commit

`0ac04ad0875dd3de5b03036d8a673fa6b00b8a08` (`PO-FROZEN-0ac04ad`)

## 2. Exact root cause

PR **#214** reopened production numeric authority (quality.offset recentering,
brightness polarity / band retuning). PR **#215** replaced the production
path with v2 star-system scoring, Tứ Hóa host-star matrix, formations, and
Tuần/Triệt attenuation. Those packs were wired into
`loadPalaceOverviewKnowledgeV1()` / production `analyzeAllPalaces`.

## 3. Selective restore

- Restored production scoring modules + v1 knowledge packs to the frozen
  logistic contract (`computeRadarScore`, additive transforms, frozen profile
  geometry / bands).
- Detached #214/#215 numeric packs into `palace-overview-research-v2` +
  `modules/palace-overview/research/*` (candidates / DEV URL preview only).
- Production facts path uses `brightnessMode: "engine"` so teacher overlay
  corrections do not mutate the frozen PO numeric route.
- Fixtures use **current Calculation Core** chart generation under the
  restored scoring modules (engine brightness tables may differ from the
  historical tree; scoring modules match `0ac04ad`).

## 4. Preserved later work

- Major Fortune / Đại Vận temporal isolation and no-Lưu contamination
- Annual Axes V0.10 weights / compose / romance-career anchors (untouched)
- PR #230 hardening, PR #231 Romance Semantic V0.1 (`numericAuthority=none`)
- Semantic catalogs, provenance, doctrine annotations

## 5. Numeric equality

`FROZEN_NUMERIC_EQUALITY = PASS` (CASE-PO-1998 × 2 schools, CASE-PO-1991 × 2 schools)

## 6. Corpus equality

`FROZEN_CORPUS_EQUALITY = PASS` (12 charts × 2 schools)

## 7. Radar mapping

`UI_RESCORING = NONE` (`radius = score/100`; candidate views DEV URL opt-in only)

## 8. Semantic isolation

`SEMANTIC_SCORE_IMPACT = NONE`

## 9. Downstream impact

Annual Axes numbers shift solely because restored Palace Overview `rawAxes`
feed V0.10. Configuration unchanged (layered-balanced 30/25/35/10, romance
0.60/0.40, career 0.60/0.20/0.20). Trung Châu AA regression lock fixture
regenerated to document the upstream-driven delta.

## 10. Validation

- `npm run typecheck` PASS
- `npm run audit:dead-code` PASS
- `npm test` PASS (965)
- `npm run build` PASS
- `npm run release:palace-overview:gate` PASS (infrastructure PASS; release NO_GO as expected)
- Annual Axes research validate/audit/romance-case/romance-audit PASS

## Decision

`PALACE_OVERVIEW_FROZEN_BASELINE_RESTORED`
