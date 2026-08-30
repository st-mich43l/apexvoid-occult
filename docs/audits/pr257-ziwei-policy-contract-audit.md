# PR #257 — Zi Wei Policy Contracts & Mutagen Dependency Cleanup

**Baseline:** `ea677a9c7ba5b716f07cbdfb575b3c9f9b21a315` (master after PR #256)
**Branch:** `refactor/pr257-ziwei-policy-contracts`
**STATUS:** COMPLETE

## 1. Baseline

Authoritative baseline is master after PR #256 school-boundary extraction:

`refactor(ziwei): extract shared calculation primitives and lock school boundaries`

Verified: branch ancestors `ea677a9c7ba5b716f07cbdfb575b3c9f9b21a315`.

## 2. Mission

1. Compile-time strict policy contracts (`satisfies`, `HeavenlyStem`, Zi Wei `Tỵ`).
2. Data-only School → policy registry.
3. Extract shared mutagen mechanics with injected tables (no school conditionals).
4. Keep `addMutagenStars` school-local (TC `ĐV` / `MUTAGEN_PREFIX`).
5. Decouple Major Fortune mutagen resolver from `chart.ts` / `getEngine`.
6. Replace transformation-matrix source regex with direct policy imports.
7. Preserve ChartData / golden / Analysis / API delta = 0.

## 3. Authority matrix

```text
ASTROLOGY_CALCULATION_AUTHORITY = TYPESCRIPT_CALCULATION_CORE
BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO
PYTHON_ANNUAL_PLACEMENT_IMPLEMENTATION = ABSENT
API_TRANSPORT_SCHEMA_AUTHORITY = FASTAPI_PYDANTIC (unchanged this PR)
```

## 4. Policy contract surface

| Type / helper | Path | Role |
| --- | --- | --- |
| `ZiweiMutagen`, `ZiweiBranch`, `TuHoaTable`, `KhoiVietTable`, `ZiweiStaticSchoolPolicy` | `schools/policy-types.ts` | Compile-time contracts |
| `tuHoaRow`, `khoiVietPair` | `schools/policy-types.ts` | Safe string-stem → typed row |
| `getZiweiStaticSchoolPolicy` | `schools/policy-registry.ts` | Data-only School → tables |
| `NAM_PHAI_*` / `TRUNG_CHAU_*` | school policy modules | `as const satisfies` tables |

`ZiweiBranch` keeps chart spelling **Tỵ** (not calendar/Bát Tự **Tị**).

## 5. Shared mutagen mechanics

| Symbol | Owner | Notes |
| --- | --- | --- |
| `getTuHoaTargets` | `calculation/shared-mutagens.ts` | Table injected |
| `resolveMutagenRecords` | `calculation/shared-mutagens.ts` | Uses generic `findStar` |
| `resolvePhiFlows` | `calculation/shared-mutagens.ts` | Table injected |
| `addMutagenStars` | school engines | KEEP_SCHOOL_LOCAL (Nam `Lưu ` annual; TC `ĐV`) |

No `if (school === …)` inside shared-mutagens.

## 6. Major Fortune resolver

```text
BEFORE: resolve-major-fortune-mutagens → getEngine(school).tuHoaTargets
AFTER:  resolve-major-fortune-mutagens → getZiweiStaticSchoolPolicy + getTuHoaTargets
```

Natal-eligible finder retained (rejects `annual` / `annual-mutagen` / names starting `Lưu `).

## 7. Files created / updated

| File | Phase |
| --- | --- |
| `src/lib/ziwei/__tests__/policy-mutagen-characterization.test.ts` | Commit 1 |
| `src/lib/ziwei/schools/policy-types.ts` | Commit 2 |
| `src/lib/ziwei/schools/policy-registry.ts` | Commit 2 |
| `src/lib/ziwei/__tests__/policy-registry.test.ts` | Commit 2 |
| `src/lib/ziwei/calculation/shared-mutagens.ts` | Commit 3 |
| `docs/audits/pr257-ziwei-policy-contract-audit.md` | Commit 6 |

Updated: school policy modules (`satisfies`), both engines, major-fortune resolver,
Palace Overview transformation-matrix test, `docs/architecture/ziwei-system.md`,
`CHANGELOG.md`.

## 8. Dependency graph (after)

```text
schools/policy-types.ts
schools/policy-registry.ts
schools/nam-phai-policy.ts
schools/trung-chau-policy.ts
└── typed static school-owned policy tables (data only)

calculation/shared-mutagens.ts
└── table-injected mutagen mechanics (no school branching)

calculation/resolve-major-fortune-mutagens.ts
└── registry + shared targets + natal-eligible finder

engine-nam-phai.ts / engine-trung-chau.ts
└── school algorithms + orchestration + local addMutagenStars
```

## 9. Explicit non-goals (unchanged / deferred)

- ERQ-005 (Canh Tứ Hóa Khoa) — unresolved
- STAR_ELEMENTS / Hoa Cái / Kiếp Sát sweeps
- shared-temporal / shared-primitives further extraction
- Narrative / KB changes
- CI / Docker / lockfile / OpenAPI edits

## 10. Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run audit:dead-code` (knip) | PASS |
| `npm test` | PASS — 142 files / 1061 tests |
| `npm run build` | PASS |
| `backend/.venv/bin/python -m unittest discover -s tests` | PASS — 60 tests |
| `src/lib/ziwei/golden.test.ts` | PASS (92) |
| school-boundaries + policy-mutagen + policy-registry | PASS |
| transformation-matrix direct imports | PASS |
| `git diff master -- tests/golden tests/contracts .github/workflows package-lock.json .npmrc` | empty |
| Analysis / ChartData behavior | characterization locks; delta 0 |

## 11. Doctrine note

ERQ-005 remains open. Policy tables encode **current released behavior**, not
expert certification of Canh Khoa divergence.
