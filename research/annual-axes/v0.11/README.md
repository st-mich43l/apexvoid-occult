# Annual Axes V0.11 — domain engine decoupling

## Decision

`STATIC_PALACE_AND_ANNUAL_DOMAIN_ENGINES_DECOUPLED`

## Architecture

Palace Overview (static 12-palace V1.2 FROZEN) and Annual Axes (six life-domain
engine V0.11 EXP) are sibling consumers of Calculation Core facts.

Forbidden:

```
PO.rawAxes → Annual Axes natal foundation
```

## PRE_DECOUPLE vs POST_DECOUPLE

| | PRE | POST |
|---|---|---|
| Natal foundation | `analyzeAllPalaces()` → weighted `rawAxes` | `domain-engine` + V0.8 natal star policies |
| Version | 0.10.0 / CANDIDATE-AAV10-LAYERED | 0.11.0 / CANDIDATE-AAV11-DOMAIN-ENGINE |
| Numeric continuity | coupled to PO restore deltas | intentionally broken vs 0.10 — expected |

## Scripts

```bash
npm run research:annual-axes-v011:validate
npm run research:annual-axes-v011:case
npm run research:annual-axes-v011:audit
```

Artifacts land in `.research-artifacts/annual-axes-v011/`.
