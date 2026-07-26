# Major Fortune V0.5 Evidence Gap Foundation

This pack records the authoritative pre-candidate state of Major Fortune research. It does not change production scoring, budgets, ordinal levels, formula behaviour, UI behaviour or school doctrine.

## Boundary

The foundation answers four questions:

1. What the current production adapter and evaluator actually implement.
2. What the frozen corpus can measure through the production path.
3. Which doctrine, school-policy and Calculation Core gaps remain.
4. Whether the evidence is sufficient to begin candidate shape design.

A runtime mapping is engineering truth only. It is not treated as classical doctrine, a school-manual locator or evidence that the same rule is accepted by both Nam Phái and Trung Châu.

## Maintained inputs

These files are edited by researchers and are never regenerated:

- `inventory/backlog-registry.json`
- `sources/source-registry-delta.json`
- `claims/claim-registry-delta.json`
- `sources/source-acquisition-ledger.json`
- `sources/page-scan-extraction-ledger.json`
- `contradictions/contradiction-log.json`

The decision manifest hashes every maintained input.

## Generated outputs

The pipeline regenerates:

- runtime and research inventories;
- provenance reconciliation;
- the production corpus report;
- evidence-gap, school-policy and readiness matrices;
- source, claim and Calculation Core queues;
- the foundation summary;
- `decision.json`;
- JSON hash sidecars.

Generated outputs are committed and must match isolated deterministic regeneration byte for byte.

## Runtime inventory versus research backlog

`runtime-signal-inventory.json` contains only signal families currently wired into the V0.3 ordinal production adapter.

`research-backlog-registry.json` preserves unresolved research families without coercing them into runtime enums. In particular:

- Vô Chính Diệu borrowing uses an opposite-palace proposal;
- partial auxiliary pairs remain diagnostic-only;
- out-of-frame transformations preserve their target frame;
- natal/transit stacking remains blocked on an additional calculation layer.

## Corpus audit

Every frozen observation is calculated through:

1. the production chart calculator;
2. canonical active-palace lookup by palace index;
3. the V0.3 production adapter with `cycleOverride`;
4. the production ordinal evaluator.

The report consumes emitted evidence, adapter diagnostics, pillar states, ordinal levels, accepted evidence, rejected evidence and support/pressure mass.

Transformation reconciliation follows:

```text
complete tuples = direct active-palace tuples + out-of-frame tuples
resolved tuples = complete tuples + incomplete tuples
accepted transformation evidence = direct active-palace tuples
```

A numeric zero is never used as a substitute for an unavailable or null ordinal level.

## Transformation baseline reconciliation

Because the V0.4 frozen baseline explicitly forced the Nam Phái transformation feature flag to true and strictly measured that subset, while V0.5 measures current production where Nam Phái is disabled (and instead extracts Trung Châu), there is a structural **comparison-contract mismatch** between the 4289 and 4298 counts. 

`reconcile-v04-transformation-baseline.ts` dynamically reconstructs the exact V0.4 baseline by re-enabling the feature flag, compares it against the exact V0.5 production baseline by disabling the flag, builds semantic fingerprints (ignoring school identity), and projects the resulting structural delta (+114 Trung Châu - 105 Nam Phái = +9 net delta) as a compatibility translation. This resolves the artificial mismatch in the corpus report.

## Evidence dimensions

Every family receives all 15 evidence dimensions plus candidate eligibility:

- existence;
- school scope;
- Major Fortune temporal scope;
- palace frame;
- target frame;
- polarity;
- strength;
- pillar ownership;
- stacking;
- deduplication;
- exception policy;
- Calculation Core readiness;
- source locator quality;
- cross-source agreement;
- corpus measurability.

Runtime locators and doctrine locators are tracked separately. `engineering-only` is blocking for candidate design.

## School separation

The school-policy matrix derives current runtime admission and the Nam Phái transformation feature gate from production code. Research admission, doctrine verification and unresolved school contradictions remain separate fields. Cross-school doctrine fallback is forbidden unless shared doctrine is explicitly verified.

## Decision precedence

The decision is derived, never hard-coded:

1. `CURRENT_PRODUCTION_PROVENANCE_MISMATCH` when runtime provenance is invalid or the current production corpus does not reconcile to the frozen V0.4 baseline.
2. `READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN` only when at least one family is eligible and no family, queue or contradiction remains blocking.
3. `MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN` otherwise.

The decision includes code-owned manifest hashes, queue counts, open contradiction IDs, blocked families and eligible families.

## Independent checker and determinism

`decision-check.ts` copies only maintained inputs to an operating-system temporary directory, regenerates all outputs, validates them, recomputes hashes and decision state, and compares them with committed artifacts.

`run-determinism.ts` performs two isolated regenerations, compares their exact generated file sets and bytes, then compares them to committed artifacts. Temporary directories are removed in `finally`; no `tmp/mf-v05-run-*` tree is written inside the repository.

## Commands

```bash
npm run research:major-fortune-v05-gap:all
npm run test:major-fortune-v05-gap
git diff --check
git status --porcelain
```

## Current research boundary

This foundation does not create scoring candidates. Source Acquisition Round 1 should begin only after the decision no longer reports a current-production mismatch. The first research focus remains Địa Lợi: principal-star dignity and Vô Chính Diệu opposite-palace borrowing, with Nam Phái and Trung Châu kept separate.
