# Nam Phái monthly scoring v2 (experimental)

Status: **experimental**. Default production profile remains `legacy-v1`.

## Data

| File | Role |
|------|------|
| `scoring-profile-v2.json` | Geometry, multipliers, minor caps, soft-sat scales, ĐV context |
| `frame-pattern-rules.json` | Declarative frame / same-star / monthly-context rules |
| `regression-cases.json` | One reference chart + soft calibration bands (v0.1.1) |
| `sources.json` | Concept provenance only — numeric weights are not classical constants |

## Opt-in

```ts
getLuuNienTrend(chart, {
  school: "nam-phai",
  birthInput,
  scoringProfile: "nam-phai-monthly-v2-experimental",
});
```

## Calibration bands (v0.1.1)

`preferred` ranges are **non-blocking expert audit bands**.

They are human-audit targets for one reference chart — **not** classical truth and **not** hard acceptance criteria for the whole system.

Do **not** retune seed weights to fit every preferred band on a single chart (overfit risk).

| Field | CI behavior |
|-------|-------------|
| `preferred` | Report / table only — never fails CI alone |
| `hardMin` / `hardMax` / `atLeastLegacy` | Honors `severity`: `report` \| `warning` \| `error` |

Expert floors recorded for the high-signal months (same-star Quyền–Kỵ / ĐV reactivate + SPT):

- `activation.hardMin = 70`
- `conflict.hardMin = 60`
- `risk.atLeastLegacy = true` (severity **error**)

With seed **0.1.0** (no single-chart retune), measured normalized values on the reference chart are below the activation/conflict floors (e.g. Quyền–Kỵ month ≈ act 44 / conflict 28). Those two floors stay as `hardMin` for audit but use severity **warning** until thầy duyệt one of:

1. lower `hardMin` to the honest measured band, or
2. a **global** activation/conflict normalization-scale change (seed policy allows global defects only), then raise severity back to `error`.

## Seed policy

Retune seeds in this profile only for **global** defects (e.g. normalization scale saturates most charts, caps not applied, an axis has no score path, monotonicity broken). Never retune for one regression month missing a preferred band.

## Invariants

- Legacy output unchanged when experimental profile is not selected
- No chart/month/palace hard-coding in the scorer
- Benefit and risk independent; no whole-column multipliers
- No fake normalization `ScoreLine`; raw + normalized exposed
- `cat === normalized.benefit`, `hung === normalized.risk`
