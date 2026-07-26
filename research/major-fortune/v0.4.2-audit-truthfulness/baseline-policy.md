# Baseline Policy — Major Fortune V0.4.2

## What baselines are

Baselines are frozen canonical `MajorFortuneAuditObservation[]` snapshots representing
the approved scoring reference for the corpus under specific conditions.

| File | School | Flag | Purpose |
|------|--------|------|---------|
| `v0.3.3-nam-phai-fallback.json` | Nam Phái | OFF | V0.3.3 approved reference for fallback path |
| `v0.4.1-trung-chau-control.json` | Trung Châu | OFF | V0.4.1 approved reference for Trung Châu |

## Baseline identity

Each observation has a stable ID:
```
<corpusId>:<school>:<chartFixtureId>:<cycleIndex>:<activePalaceIndex>
```

This ID is stable across baseline generation, audit runs, and timeline paths.

## Regenerating baselines

**Baselines must NOT be regenerated silently.**

To regenerate, you must pass `--accept-baseline-update` explicitly:

```bash
npm run baseline:major-fortune-v042 -- --accept-baseline-update
```

After regeneration:
1. Review the diff between old and new baselines carefully.
2. Verify the reason for any score changes (formula change, knowledge update, corpus change).
3. Update `V0.4.x-AUDIT-TRUTHFULNESS-DECISION.md` to document the regeneration.
4. Commit with message `research(ziwei): update Major Fortune V0.4.x baseline <reason>`.

**Any change to baseline hashes must be justified in the PR.**

## Hashing

Baselines and all audit artifacts are SHA256-hashed in `baseline-manifest.json`.  
The `validate.ts` script verifies all hashes at runtime.  
The `decision-check.ts` script independently re-verifies all hashes before evaluating the decision.

## What changes would force a baseline update

- Formula parameter change (base score, pillar budget, ordinal divisor)
- Knowledge pack update (new Tứ Hóa table, changed rules)
- Corpus change (new charts, new cycles)
- Adapter change that affects evidence emission or acceptance decisions
