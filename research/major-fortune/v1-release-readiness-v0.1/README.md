# Major Fortune V1 — Release readiness requalification (v0.1)

**STATUS:** RESEARCH_ONLY  
**Runtime authority:** false

## Question

Is the current Major Fortune V1 implementation an auditable and properly governed
research candidate under current architecture, evidence authority, coverage, and
quality contracts?

## How to regenerate

```bash
npm run research:major-fortune-v1:readiness
```

Run twice and confirm `readiness-report.json` is byte-identical.

## Artifacts

- `readiness-report.json` — deterministic machine-readable report
- `REPORT.md` — human-readable summary from the same run

## Harness

`src/lib/ziwei/analysis/research/major-fortune-v1-readiness/`

## Non-goals

No V1 score tuning, no Tứ Hóa scoring implementation, no production promotion,
no restoration of the deleted historical release gate as current authority.
