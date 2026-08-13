# Phase A: Forensic Baseline Audit

This document maps the complete current production call chain for the Major Fortune (Đại Vận) analysis module, outlining the "versioning illusion" and explicitly auditing all runtime dependencies on V0.3, V0.5-candidate, and legacy scoring logic.

## 1. Production Call Chain

The user interface enters the Major Fortune calculation via the canonical API. However, the calculation delegates directly to legacy modules and candidate integrations, ultimately resolving into a V0.3 scoring engine:

`MajorFortuneSection.tsx`
  ↓
`analyzeMajorFortune` (`production.ts`)
  ↓
`analyzeMajorFortuneCandidateV05` (`v0.5-candidate/candidate.ts`)
  ↓
1. `adaptChartToMajorFortuneOrdinalInput` (`v0.3-ordinal/adapter/adapt.ts`) — Constructs cycle, extracts physical facts.
2. `loadMajorFortuneProductionKnowledge` (`v0.5-production/loader.ts`) — Loads V0.5 candidate registry.
3. `evaluateMajorFortuneProductionAdmission` (`v0.5-candidate/admission.ts`) — Filters V0.3 facts via V0.5 policy.
4. `evaluateMajorFortuneOrdinal` (`v0.3-ordinal/evaluate.ts`) — Core scoring engine based on engineering heuristics.
5. `buildDisplay` (`v0.3-ordinal-adapter/display.ts`) — Formats score to UI bands (0-100 logic).

## 2. Explicit Version Matrix

| Component | Current Version | Actual Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Integration** | `0.5.0` | `v0.5-candidate/candidate.ts` | Production (but named candidate) |
| **Model** | `v0.5.0` | `v0.5-candidate/candidate.ts` | Wrapper around V0.3 |
| **Formula** | `v0.3-ordinal-four-pillar` | `v0.3-ordinal/evaluate.ts` | V0.3 Ordinal Evaluator |
| **Knowledge** | `0.5.0-shadow-candidate` | `v0.5-production/loader.ts` | Disconnected nomenclature (shadow vs production) |
| **Source Pack** | `v0.5-evidence-gap` | Legacy Engineering Admitted | Lack of rigorous sourcing |
| **Adapter** | `0.3.3` | `v0.3-ordinal/adapter/adapt.ts` | V0.3 physical fact extraction |
| **Contract** | `0.3.0` | `v0.3-ordinal/types.ts` | V0.3 return structures |
| **Presentation**| `0.3.3` | `v0.3-ordinal-adapter/display.ts`| V0.3 band normalization |
| **Timeline** | `0.3.3` | `timeline.ts` | V0.3 geometry resolution |
| **Telemetry** | `schema-v0.5.0` | `telemetry/emit.ts` | Mixed versioning |
| **UI** | N/A | `MajorFortuneSection.tsx` | Assumes V0.3 response contract |

## 3. Active Runtime Dependencies on Legacy/Candidate Concepts

Based on dependency/call-graph evidence, the following legacy terms/logic bleed into the canonical production path:

### `v0.3` / `V03` / `ordinal`
- **Evaluator**: `src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/evaluate.ts` (Core formula)
- **Aggregation**: `v0.3-ordinal/aggregate.ts`
- **Scoring Assumptions**: `v0.3-ordinal/evaluate.ts` (Magic weights, multipliers, penalty caps, pillar structure)
- **Types**: `MajorFortuneOrdinalV03Analysis` (`v0.3-ordinal/types.ts`)
- **Display Adapter**: `v0.3-ordinal-adapter/display.ts`
- **Fact Extraction Adapter**: `v0.3-ordinal/adapter/adapt.ts` (Tied directly to ordinal fact representations)

### `v0.5-candidate`
- **Main Entrypoint**: `src/lib/ziwei/analysis/modules/major-fortune/v0.5-candidate/candidate.ts` is explicitly exported as the production implementation.
- **Admission Logic**: `v0.5-candidate/admission.ts` restricts the `v0.3-ordinal` output based on candidate rules.
- **Types**: `MajorFortuneCandidateAnalysis` is exposed to `production.ts`.

### `production-shadow`
- **Knowledge Base**: `src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.5-production/registry.json` internally describes its versioning context as `0.5.0-shadow-candidate`, while runtime considers it canonical.

### `legacy-engineering-admitted`
- **Knowledge Registry**: The active scoring profile relies primarily on `legacy-engineering-admitted` source references rather than `school-specific` or `primary_classical` documentation. All 4 active pillars (Thiên Thời, Địa Lợi, Nhân Hòa, Tứ Hóa) are fundamentally driven by heuristics without explicit source provenance.
