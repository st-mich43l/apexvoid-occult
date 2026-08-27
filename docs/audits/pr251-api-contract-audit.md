# PR #251 — API Contract SSOT Audit

**Baseline:** `5562f75` (master after PR #250)
**Branch:** `refactor/pr251-api-contract-ssot`
**STATUS:** CURRENT

## Authority matrix

```text
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
GENERATED_TS_API_TYPES = DERIVED_ARTIFACT
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
```

## 1. Previously duplicated contracts

| Concern | TypeScript (manual) | Python (manual) |
| --- | --- | --- |
| Chart DTO | `src/types/chart.ts` ChartDto | `schemas.ChartDTO` |
| Palace / Star / Mutagen | nested interfaces | PalaceDTO / StarDTO / MutagenDTO |
| Temporal bundle | `TemporalSnapshotBundleDto` | `TemporalSnapshotBundle` |
| Interpret body | ad-hoc AiChat JSON | `InterpretRequest` |
| UserContext / HistoryTurn | hand unions | Pydantic models |
| Error codes | string switches in AiChat | anonymous dicts |

## 2. Source-of-truth decision

**Network/transport shape:** FastAPI Pydantic models → committed `backend/openapi.json` → generated `src/generated/api-schema.ts` → ergonomic aliases in `src/api/contracts.ts`.

**Astrology facts:** TypeScript Calculation Core (`ChartData`) + `serializeChart()` mapping only.

## 3. OpenAPI generation flow

```text
backend/scripts/generate_openapi.py
  → imports app.main:app
  → app.openapi()
  → writes backend/openapi.json (stable indent, sorted keys, trailing newline)
```

No uvicorn. Lifespan / Mongo / Gemini must not run.

## 4. Generated TypeScript destination

`src/generated/api-schema.ts` via pinned `openapi-typescript`.

Hand-authored domain types stay in `src/types/chart.ts` (ChartData, BirthInput, …).

## 5. Frontend adapter boundaries

| Module | Role |
| --- | --- |
| `src/api/contracts.ts` | `Api*` aliases from generated schemas |
| `src/api/errors.ts` | FrontendIntegrationErrorCode + narrow parsers |
| `chart.ts` / `temporal-snapshots.ts` / AiChat | consume Api* types |

Engines must not import generated API types.

## 6. Compatibility behavior

- `InterpretRequest.chart` remains **optional** on the wire (legacy). Frontend AI still requires a chart before submit.
- `annualYear` / `nominalAge` remain `Optional[int]` / `number | null` — valid serializeChart always sets integers; nullability kept for transport compatibility.
- Pydantic `extra="forbid"`: **deferred** — risk of breaking silent extra fields from older clients; document ignore/default behavior.
- Defaults on many ChartDTO string fields: classified `LEGACY_COMPATIBILITY` / empty-string defaults; school/gender already required Literals.

## 7. Error-code contract

Backend codes (`BackendApiErrorCode`):

- `UNSUPPORTED_NARRATIVE_SCHOOL`
- `TEMPORAL_SNAPSHOTS_REQUIRED`
- `TEMPORAL_RANGE_TOO_LARGE`
- `TEMPORAL_YEAR_OUT_OF_RANGE`
- `TEMPORAL_SNAPSHOT_IDENTITY_MISMATCH`
- `TEMPORAL_ANCHOR_MISMATCH`
- `TEMPORAL_SNAPSHOT_SET_MISMATCH`

Frontend-local:

- `TEMPORAL_NEGOTIATION_FAILED`

## 8. CI drift detection

`npm run api:check` regenerates to temp paths and diffs committed artifacts.

**Do not wire this into `.github/workflows/` unless explicitly approved.**
CI workflow edits have repeatedly broken MRs (ordering / missing Python /
path filters). Contract freshness is enforced locally + in PR validation notes;
see `.agents/AGENTS.md` §7b.

## 9. Intentionally NOT generated

- ChartData / ChartPalace / ChartStar / BirthInput / ChartEngine
- SSE event stream internals (documented as TS-only AiSseEvent helpers if needed)
- KB / prompts / secrets
- Analysis result types

## 10. Future extension

Changing ChartDTO requires: Pydantic → `api:generate` → review OpenAPI+TS diffs → serializer compile → contract fixtures → tests. No silent manual TS mirrors.

PR #252 (deferred): ZiweiSchoolPolicy extraction — unrelated to transport SSOT.
