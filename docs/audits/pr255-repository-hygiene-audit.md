# PR #255 — Repository Hygiene Audit

**Baseline:** `0b5a703c586952a431bba12a9590001e5cb52fbb` (master after #251 / #252 / #254)
**Branch:** `refactor/pr255-repository-hygiene`
**STATUS:** CURRENT

## Why this PR

PR #251 established API Contract SSOT (Pydantic → OpenAPI → generated TS) but
exposed follow-on operational gaps (#252 workflow restore, #254 Docker `.npmrc`).
Before the next Calculation Core school-boundary refactor (#256), this PR
stabilizes the tree: delete only **verified** dead code, remove superseded
transport aliases, harden OpenAPI export against local DEBUG pollution — with
**zero** calculation / analysis / golden / deploy behavior change.

## Authority matrix (unchanged)

```text
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
GENERATED_TS_API_TYPES = DERIVED_ARTIFACT
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT
```

## Inventory methodology

- `rg` across backend, src, scripts, docs, tests, deploy (not Knip alone)
- TypeScript import / type alias call-site audit
- Python production import audit for `backend/app/*.py`
- Package scripts / Docker / `.npmrc` consumer check
- Stale-marker scan classified, not auto-deleted

## Classification table

| Path / symbol | Classification | Evidence | Action |
| --- | --- | --- | --- |
| `backend/app/annual_stars.py` | DELETE_RUNTIME_DEAD | Production imports = 0; only orphan test | DELETED |
| `backend/tests/test_annual_stars.py` | DELETE_ORPHAN_TEST | Sole consumer of dead module | DELETED |
| `ApiChartDto as ChartDto` | DELETE_SUPERSEDED_COMPAT | Production already on `ApiChartDto` | REMOVED |
| `ApiUserContext as UserContext` | DELETE_SUPERSEDED_COMPAT | Identical transport shape (option A) | REMOVED |
| OpenAPI export + local `VOIDOCC_DEBUG=1` | KEEP_GENERATOR (harden) | `.env` DEBUG polluted contract check | Force `VOIDOCC_DEBUG=0` in generate/check |
| `temporal_focus._annual_stars_summary` | KEEP_RUNTIME | ChartDTO summarizer | KEPT |
| `test_liencung` `"get_annual_stars" not in focus` | KEEP_RUNTIME | Absence regression | KEPT |
| `.npmrc` + Docker COPY | KEEP_BUILD_DEPLOY | TS6 peer policy | KEPT / untouched |
| `.github/workflows/**` | KEEP_BUILD_DEPLOY | AGENTS 7b | UNTOUCHED |
| `tests/golden/**`, `tests/contracts/**` | KEEP_GOLDEN / fixtures | Immutable / review | UNTOUCHED |
| `openapi.json`, `api-schema.ts` | KEEP_GENERATOR | No regen needed | UNTOUCHED |
| Historical `docs/audits/pr*.md` | KEEP_HISTORICAL_PROVENANCE | Past truth | UNTOUCHED |
| `research/**`, `v0.10-layered` | KEEP_ACTIVE_RESEARCH | Version names ≠ dead | KEPT |

## Deleted

| Item | Why dead | Evidence | Replacement |
| --- | --- | --- | --- |
| `backend/app/annual_stars.py` | Runtime/research/generator imports = 0 | `rg`; file header | None — TS Calculation Core only |
| `backend/tests/test_annual_stars.py` | Self-preserving test | Sole importer | None |
| `ChartDto` alias | Superseded by `ApiChartDto` | Call-site audit | Direct `@/api/contracts` |
| `UserContext` alias | Identical to `ApiUserContext` | Call-site audit | Direct `@/api/contracts` |

## Before / after dependency graph

```text
BEFORE:
  TS Calculation Core  +  dead Python annual_stars (tests-only)
  domain chart.ts  re-exports  ApiChartDto / ApiUserContext aliases

AFTER:
  TS Calculation Core ONLY  (PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT)
  domain chart.ts = ChartData / BirthInput / engines
  transport = Api* from @/api/contracts
```

## Post-#251 regression lessons

1. Do not casually edit `.github/workflows/**`.
2. Docs must pass `git diff --check`.
3. Frontend Docker must receive `.npmrc` before `npm ci`.
4. OpenAPI generate/check must ignore local `VOIDOCC_DEBUG` (this PR).
5. Do not “fix” openapi-typescript vs TypeScript 6 peers in a hygiene PR.

## Verification results

| Check | Result |
| --- | --- |
| `npm ci` | PASS |
| Clean-install sim (`package.json` + lock + `.npmrc` → `npm ci`) | PASS (`openapi-typescript` present). Docker daemon unavailable locally. |
| `npm run api:check` (×2) | PASS / no drift |
| `npm run typecheck` | PASS |
| `npm run audit:dead-code` (Knip) | PASS — 0 findings |
| `npm test` | PASS — 139 files / **1033** tests |
| `npm run build` | PASS |
| Backend `unittest` | PASS — **60** tests (was **61**; removed `test_annual_stars`) |
| Palace Overview gate | infrastructure PASS / release **NO_GO** (unchanged) |
| Monthly Flow gate | **GO_SHADOW** (unchanged) |
| `git diff --check` | empty |
| Golden / contracts / openapi / generated / workflows / `.npmrc` / Dockerfile | empty diff |

## Intentionally not removed

- `.npmrc` and Docker `.npmrc` integration
- Generated API schema + contract fixtures + goldens
- Historical research / version-named runtime paths
- `temporal_focus._annual_stars_summary`

## Out of scope → PR #256

Zi Wei Calculation Core school-boundary characterization / extraction
(`SHARED MECHANICS != SCHOOL POLICY != SCHOOL-SPECIFIC ALGORITHM`).
