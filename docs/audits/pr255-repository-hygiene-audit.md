# PR #255 — Repository Hygiene Audit

**Baseline:** `0b5a703c586952a431bba12a9590001e5cb52fbb` (master after #251 / #252 / #254)
**Branch:** `refactor/pr255-repository-hygiene`
**STATUS:** INVENTORY (pre-deletion)

## Why this PR

PR #251 established API Contract SSOT (Pydantic → OpenAPI → generated TS) but
exposed follow-on operational gaps (#252 workflow restore, #254 Docker `.npmrc`).
Before the next Calculation Core school-boundary refactor (#256), this PR
stabilizes the tree: delete only **verified** dead code, remove superseded
transport aliases, update living docs — with **zero** calculation / analysis /
golden / deploy behavior change.

## Authority matrix (unchanged)

```text
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
GENERATED_TS_API_TYPES = DERIVED_ARTIFACT
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT  (target after deletion)
```

## Inventory methodology

- `rg` across backend, src, scripts, docs, tests, deploy (not Knip alone)
- TypeScript import / type alias call-site audit
- Python production import audit for `backend/app/*.py`
- Package scripts / Docker / `.npmrc` consumer check
- Stale-marker scan (`legacy`, `deprecated`, `compat`, `TODO`, …) classified,
  not auto-deleted

## Classification table

| Path / symbol | Classification | Evidence | Action |
| --- | --- | --- | --- |
| `backend/app/annual_stars.py` | DELETE_RUNTIME_DEAD | File header: tests-only; `rg` production imports = 0; only `test_annual_stars.py` imports | DELETE |
| `backend/tests/test_annual_stars.py` | DELETE_ORPHAN_TEST | Sole consumer of dead module (self-preserving) | DELETE with module |
| `ApiChartDto as ChartDto` in `src/types/chart.ts` | DELETE_SUPERSEDED_COMPAT | Production uses `ApiChartDto`; remaining `ChartDto` = AiChat unit tests only | Remove alias; migrate tests |
| `ApiUserContext as UserContext` in `src/types/chart.ts` | DELETE_SUPERSEDED_COMPAT | Identical transport shape; ChartPage + AiChat only | Remove alias; import `ApiUserContext` (option A) |
| `temporal_focus._annual_stars_summary` | KEEP_RUNTIME | Summarizes ChartDTO annual stars for focus text — not the dead calculator | KEEP |
| `test_liencung` assert `"get_annual_stars" not in focus` | KEEP_RUNTIME | Regression string check that narrative focus lacks calculator name | KEEP |
| `.npmrc` | KEEP_BUILD_DEPLOY | TS6 + openapi-typescript peer policy; Docker COPY depends on it | KEEP / no edit |
| `deploy/frontend.Dockerfile` `.npmrc` COPY | KEEP_BUILD_DEPLOY | #254 install fix | KEEP / no edit |
| `.github/workflows/**` | KEEP_BUILD_DEPLOY | #252 / AGENTS 7b | FORBIDDEN |
| `tests/golden/**` | KEEP_GOLDEN_CONTRACT | Immutable | FORBIDDEN |
| `tests/contracts/**` | KEEP_GENERATOR | Cross-language review fixtures | KEEP |
| `backend/openapi.json`, `src/generated/api-schema.ts` | KEEP_GENERATOR | Committed contract artifacts | KEEP / no hand-edit |
| `knip.json` ignore `src/generated/**` | KEEP_GENERATOR | Intentional generated surface | KEEP |
| `api:generate*` / `api:check` scripts | KEEP_GENERATOR | Active contract workflow | KEEP |
| `docs/audits/pr*.md` (historical) | KEEP_HISTORICAL_PROVENANCE | Past truth; do not rewrite | KEEP |
| `research/**`, `v0.10-layered` paths | KEEP_ACTIVE_RESEARCH / HISTORICAL | Version naming ≠ dead | KEEP |
| `src/lib/calendar/**`, `src/lib/bazi/**` | KEEP_RUNTIME | Protected | FORBIDDEN |
| `backend/app/store.py`, `kb/data/**` | KEEP_RUNTIME | Protected | FORBIDDEN |

## Post-#251 regression lessons (preserve)

1. Do not casually edit `.github/workflows/**` for feature validation.
2. Docs must pass `git diff --check` (trailing whitespace).
3. Frontend Docker must receive `.npmrc` before `npm ci`.
4. Do not “fix” openapi-typescript vs TypeScript 6 peers in a hygiene PR.

## Planned commits

1. This inventory (no runtime change)
2. Remove `annual_stars` + orphan test + living architecture wording
3. Remove `ChartDto` / `UserContext` aliases; migrate to `Api*`
4. Remaining verified stale only if Knip/rg proves more
5. Finalize verification + CHANGELOG

## Explicit non-goals

No `ZiweiSchoolPolicy` extraction, no engine merge, no doctrine/scoring changes,
no golden updates, no workflow / `.npmrc` / Dockerfile edits, no dependency churn.

## Verification (to be filled after implementation)

- `npm ci` / clean-install or Docker frontend stage
- `npm run api:check`
- `npm run typecheck` / `audit:dead-code` / `test` / `build`
- Backend `unittest`
- Palace Overview / Monthly Flow gates
- `git diff --check`
- Golden / contracts / openapi / generated / workflows / `.npmrc` untouched
