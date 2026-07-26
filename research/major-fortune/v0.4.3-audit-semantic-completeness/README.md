# Major Fortune V0.4.3 — Audit Truthfulness

**Integration version:** 0.4.3  
**Scoring model:** v0.3-ordinal (unchanged)  
**Formula:** v0.3-ordinal-four-pillar (unchanged)  
**Base SHA:** `fb1ffffc02ae87e7f8dd6acf688b2af9c1bf9831`  
**Previous PR:** #141 (V0.4.1 Production Integrity)

---

## Purpose

V0.4.3 completes the Major Fortune production audit system so that every production
decision is derived from canonical scoring snapshots rather than telemetry-state
approximations.

It does **not** redesign the Đại Vận scoring formula.

---

## Problems Fixed

| ID | Severity | Problem | Fix |
|----|----------|---------|-----|
| P0 | CRITICAL | `contractVersion` sourced from `knowledgeVersion` in `build-event.ts` | Fixed to use `result.versions.contractVersion` |
| P0 | CRITICAL | `acceptedTransformationEvidenceCount` counted all accepted evidence, not transformation family only | Fixed to count only `major-fortune-transformations` evidence accepted in `tu-hoa-sat-tinh` |
| P0 | CRITICAL | V0.4.1 audit stored telemetry events — cannot prove score/band/pillar equivalence | Replaced with canonical `MajorFortuneAuditObservation` snapshots |
| P0 | CRITICAL | Default sink depended on `process.env.NODE_ENV` — browser-unsafe | Default is now `noopMajorFortuneTelemetrySink`; added `withMajorFortuneTelemetrySink` for scoped injection |
| P1 | HIGH | Decision checked telemetry counts, not baseline comparison | Decision engine loads validated reports, evaluates hard gates from canonical data |
| P1 | HIGH | Trung Châu loaded but not enforced as a gate | Trung Châu control is now a hard gate |
| P1 | HIGH | Decision-check only read `decision.json`, didn't recalculate | `decision-check.ts` now independently recalculates all gates and `decisionInputHash` |

---

## Architecture

```
baseline.ts  →  baselines/              (frozen, --accept-baseline-update required)
audit.ts     →  reports/raw/            (canonical MajorFortuneAuditObservation snapshots)
report.ts    →  reports/               (derived comparison + equivalence reports)
validate.ts  →  validates all           (schema, hashes, invariants, gate results)
decision.ts  →  reports/decision.json  (10 hard gates → typed decision)
decision-check.ts → reports/decision-check.json (independent recalculation)
compare-determinism.ts → reports/determinism-report.json
```

### Canonical Observation Identity

```
<corpusId>:<school>:<chartFixtureId>:<cycleIndex>:<activePalaceIndex>
```

Same logical observation → same ID across baseline, audit, timeline, repeated runs.

---

## Results (V0.4.3)

| Metric | Value |
|--------|-------|
| Corpus | major-fortune-v0.2-audit-corpus |
| Nam Phái observations | 1,166 |
| Trung Châu observations | 1,166 |
| Timeline points | 1,200 |
| Fallback equivalence | ✅ PASSED (0 differences) |
| Trung Châu control | ✅ PASSED (0 differences) |
| Timeline equivalence | ✅ PASSED (0 mismatches) |
| Temporal independence | ✅ PASSED |
| Telemetry semantics | ✅ PASSED |
| Direct activation rate (enabled) | 32.2% (375 / 1,166) |
| Determinism (run 1 vs run 2) | ✅ PASSED (15/15 artifacts match) |
| Decision | **PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS** |
| decisionInputHash | `e8a5639aee56c7c8f6843c9ede5804831edd8993fb0bff8f82895b929f31fff5` |

---

## Telemetry Semantics Corrections

### `contractVersion`
- **Before:** `result.versions.knowledgeVersion` (wrong field)
- **After:** `result.versions.contractVersion` (correct)

### `acceptedTransformationEvidenceCount`
- **Before:** total accepted evidence count from `diagnostics` (wrong)
- **After:** count of `major-fortune-transformations` evidence whose `evidenceId` appears
  in `pillars["tu-hoa-sat-tinh"].acceptedEvidenceIds`

### Invariant enforced at audit + test time:
```
directTransformationActivationCount
  <= acceptedTransformationEvidenceCount
  <= diagnostics.acceptedEvidenceCount
```

---

## Sink Lifecycle

```ts
// Scoped injection (preferred for audit and tests):
const result = withMajorFortuneTelemetrySink(sink, () => analyze(...));
// Previous sink is restored via try/finally — even if operation throws.

// Application bootstrap only:
setMajorFortuneTelemetrySink(productionSink);
```

The default sink is `noopMajorFortuneTelemetrySink`. No transport fires unless an
application explicitly injects one.

---

## Running the Audit Pipeline

```bash
# Generate frozen baselines (one-time; requires explicit flag):
npm run baseline:major-fortune-v043 -- --accept-baseline-update

# Full pipeline:
npm run audit:major-fortune-v043
npm run report:major-fortune-v043
npm run validate:major-fortune-v043
npm run decision:major-fortune-v043
npm run decision-check:major-fortune-v043

# Or all in one:
npm run audit:major-fortune-v043-full

# Determinism check (requires two runs):
cp -R research/major-fortune/v0.4.3-audit-truthfulness/reports /tmp/mf-v043-run-1
npm run audit:major-fortune-v043-full
npm run determinism:major-fortune-v043

# Tests:
npm run test:major-fortune-v043-audit
```

---

## Formula Invariants (unchanged)

| Parameter | Value |
|-----------|-------|
| Base score | 50 |
| Thiên Thời budget | 30 |
| Địa Lợi budget | 25 |
| Nhân Hòa budget | 20 |
| Tứ Hóa budget | 25 |
| `pillarDelta` | `budget * ordinalLevel / 4` |
| Score | `clamp(50 + Σ pillarDelta, 0, 100)` |

No scoring evidence was admitted. No score was tuned. Formula is frozen.
