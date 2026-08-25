# Annual Axes V0.12 decision

## Decision

**AAV12_STATIC_EVIDENCE_COVERAGE_INSUFFICIENT**

## Selected candidate

- candidateId: `CANDIDATE-AAV12-CALIBRATED-DOMAIN-SIGNALS`
- engineVersion: `0.12.0`
- static formula: directionalNet × activation (`referenceMass=4`)
- aggregation: per-physical-palace then normalized role weights
- palaceClampPolicy: **unused** (activation damping supersedes; clamp audited as dead V0.11 path)
- layer profile: **CONTROL-LAYERED-BALANCED** 0.30/0.25/0.35/0.10 (not retuned)
- domain mappings: **legacy unchanged**
- romance-expanded: **not promoted**
- production default: **V0.11 unchanged**

## Clamp audit (V0.11)

`clampPalaceRaw` is computed then `void`ed in `score-static-palace-context.ts`.
Classification: **DEAD LEGACY CODE / ineffective path** relative to current domain-engine
mass-ratio `signedNet`. V0.12 does not use the clamp in the signed signal.

## Sparse saturation

- control natal rate: 0.5014
- candidate natal rate: 0.0000

## Layer-scale notes

See `layer-scale-audit.json`. Annual trigger remains magnitude-aware (`raw/8`).
Major Fortune sparse damping preserved (`referenceMass=4` precedent).

## Coverage

```json
{
  "ok": true,
  "domains": {
    "health": {
      "registryPositive": 6,
      "registryNegative": 1,
      "admittedEvidenceCount": 0,
      "zeroEvidencePalaces": 2,
      "oneEvidencePalaces": 0,
      "mappedPalaceCount": 2
    },
    "family": {
      "registryPositive": 6,
      "registryNegative": 3,
      "admittedEvidenceCount": 4,
      "zeroEvidencePalaces": 0,
      "oneEvidencePalaces": 2,
      "mappedPalaceCount": 3
    },
    "wealth": {
      "registryPositive": 2,
      "registryNegative": 2,
      "admittedEvidenceCount": 2,
      "zeroEvidencePalaces": 1,
      "oneEvidencePalaces": 2,
      "mappedPalaceCount": 3
    },
    "career": {
      "registryPositive": 2,
      "registryNegative": 1,
      "admittedEvidenceCount": 1,
      "zeroEvidencePalaces": 2,
      "oneEvidencePalaces": 1,
      "mappedPalaceCount": 3
    },
    "social": {
      "registryPositive": 4,
      "registryNegative": 3,
      "admittedEvidenceCount": 1,
      "zeroEvidencePalaces": 1,
      "oneEvidencePalaces": 1,
      "mappedPalaceCount": 2
    },
    "romance": {
      "registryPositive": 4,
      "registryNegative": 3,
      "admittedEvidenceCount": 1,
      "zeroEvidencePalaces": 1,
      "oneEvidencePalaces": 1,
      "mappedPalaceCount": 2
    }
  },
  "flags": [
    "STATIC_DOMAIN_MAJOR_STAR_COVERAGE_LOW"
  ]
}
```

## Year sensitivity / domain correlation

```json
{
  "year": {
    "health": {
      "meanAbsYoY": 4.4944444444444445,
      "p50": 3.200000000000003,
      "p90": 9.100000000000001,
      "max": 22.4
    },
    "family": {
      "meanAbsYoY": 4.496527777777778,
      "p50": 3.5,
      "p90": 10.399999999999999,
      "max": 15.600000000000001
    },
    "wealth": {
      "meanAbsYoY": 5.282638888888888,
      "p50": 4.200000000000003,
      "p90": 11.199999999999996,
      "max": 19.4
    },
    "career": {
      "meanAbsYoY": 4.274305555555556,
      "p50": 3.5,
      "p90": 9,
      "max": 15.399999999999999
    },
    "social": {
      "meanAbsYoY": 5.183333333333335,
      "p50": 4.399999999999999,
      "p90": 11.200000000000003,
      "max": 20.700000000000003
    },
    "romance": {
      "meanAbsYoY": 4.957638888888891,
      "p50": 4.200000000000003,
      "p90": 9.699999999999996,
      "max": 19.300000000000004
    }
  },
  "corrWarnings": []
}
```

## Why this candidate

1. Fixes sparse one-sided saturation on natal static layer.
2. Preserves physical-palace dedup and role-weight semantics.
3. Keeps Annual Axes / Palace Overview numeric boundary (ZERO dependency).
4. Does not retune layer mix or domain projection before scale parity.
5. Leaves V0.11 production route untouched.

## Unchanged

- Domain palace projection weights (legacy)
- Resonance weight 0.10
- Annual V0.8.2 trigger mechanics
- Final tanh mapping gain
- Palace Overview module

Artifacts: `.research-artifacts/annual-axes-v012/`
