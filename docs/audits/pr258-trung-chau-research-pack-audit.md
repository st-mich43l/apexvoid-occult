# PR #258 — Trung Châu Research Pack V0 Audit

**Baseline:** `38205472da39bc565b10a2edcb4587ca2d5c82e5` (master after PR #257)
**Branch:** `research/pr258-trung-chau-research-pack-v0`
**STATUS:** COMPLETE (research-only; doctrine verification incomplete)

## 1. Baseline

Authoritative baseline is master after PR #257:

`refactor(ziwei): harden school policy contracts and decouple mutagen resolution`

Verified: branch ancestors `38205472da39bc565b10a2edcb4587ca2d5c82e5`.

## 2. Mission

Establish a provenance-first Trung Châu Research Pack V0 that separates CURRENT
RUNTIME from research verdicts, records contradictions without silent
resolution, leaves ERQ-005 open, and changes zero Calculation Core / Analysis /
narrative / API behavior.

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

```text
src/lib/ziwei/analysis/knowledge/trung-chau-research-v0/
  index.ts, schema.ts, validate.ts, loader.ts
  source-registry.v0.json
  doctrine-matrix.v0.json
  terminology.v0.json
  contradictions.v0.json
  expert-review.v0.json
  runtime-observations.v0.json
  __tests__/validation|provenance|doctrine-matrix|runtime-comparison.test.ts

docs/research/trung-chau-research-pack-v0.md
docs/audits/pr258-trung-chau-research-pack-audit.md
CHANGELOG.md (Unreleased note)
```

No global `analysis/knowledge/index` wiring.

## 6. Source registry statistics

| Metric | Count |
| --- | ---: |
| External sources inspected (secondary/community URLs) | 2 |
| In-repo bibliographic shells | 1 |
| Internal engineering sources | 2 |
| Claims total | 5 |
| source_supported claims | 0 |
| source_conflicted claims | 1 |
| expert_pending claims | 1 |
| unverified claims (incl. runtime observations) | 3 |
| Research queue items | 10 |

## 7. Doctrine matrix statistics

| Verdict | Rows |
| --- | ---: |
| supported | 0 |
| conflicted | 1 (`POL-TC-TUHOA`) |
| expert_pending | 1 (`POL-TC-TUHOA-CANH-KHOA`) |
| insufficient_evidence | 16 |
| **Total rows** | **18** |

All rows: `futureRuntimeAction = none`.

## 8. Contradiction statistics

| Id | Status |
| --- | --- |
| `CTR-TC-001` Canh lineage conflict | `expert_pending`, `resolution=null` |

## 9. Expert-review statistics

| Id | Status |
| --- | --- |
| `ERQ-005` | `expert_pending`, `reviewRequired=true` |

## 10. ERQ-005 evidence state

- Runtime A (Nam): Canh Khoa = Thái Âm
- Runtime B (TC): Canh Khoa = Thiên Phủ
- Secondary attribution for Wang/Zhongzhou 阳武府同 (matches B) — not primary
- Competing lineages documented (阳武同阴 / 阳武阴同 / 阳武府相 caution)
- **Not closed**

## 11. Runtime comparison

Drift tests lock committed observations to typed policy:

- `OBS-TC-TUHOA-CANH-KHOA` ↔ `TRUNG_CHAU_TU_HOA.Canh.Khoa`
- `OBS-TC-KHOIVIET-CANH` ↔ `TRUNG_CHAU_KHOI_VIET.Canh`

## 12. Protected runtime files

Expected empty diff vs baseline for engines, schools, calculation helpers,
ChartData, Analysis scoring modules, UI, backend KB, golden, contracts,
OpenAPI, workflows, lockfile, `.npmrc`, Docker.

## 13. Validation

| Check | Result |
| --- | --- |
| Structural validation | PASS |
| Doctrine verification | INCOMPLETE |
| Expert review | PENDING (ERQ-005) |
| Targeted pack tests | PASS |
| Full suite / gates | see PR body |

## 14. Unresolved findings

- No primary Zhongzhou edition+page ingested
- Most matrix topics still insufficient evidence
- Hoa Cái / Kiếp Sát remain UNCERTAIN_STOP for runtime sharing

## 15. Recommended next step

Prefer **#259 Research Pack V0.1 evidence expansion** (primary locators) or an
expert session on ERQ-005 — not a silent Calculation Core PR.
