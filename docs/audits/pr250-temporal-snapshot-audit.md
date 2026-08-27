# PR #250 — Deterministic Multi-Year Temporal Snapshot Protocol

**Baseline:** `ffe6514` (master after PR #249)  
**Branch:** `feat/pr250-multi-year-temporal-snapshots`  
**STATUS:** CURRENT

## 1. Baseline

PR #249 established: stateless engines, `calculateForAnnualYear()`, school-aware
narrative gate, fail-closed Calculation Core inputs, no Python foreign-year
synthesis.

## 2. Existing single-year flow

```text
AiChat → POST /api/interpret {question, chartText, chart}
  → school gate
  → build_focus(anchor)
  → KB + LLM stream
```

## 3. Temporal authority matrix

| Concern | Owner |
| --- | --- |
| Year language resolution | Backend `temporal_request.py` |
| Year-specific physical chart | TypeScript Calculation Core ONLY |
| Snapshot transport | Frontend ChartDTO bundle |
| Snapshot validation | Backend `temporal_validate.py` |
| Multi-year focus | Backend `temporal_focus.py` |
| Doctrine | School KB (Nam Phái only today) |
| Narrative | LLM |

`BACKEND_ZIWEI_PLACEMENT_CALCULATION = ZERO`

## 4. Protocol design

```text
question → resolve years vs anchor
  → missing foreign years?
       NO  → single-chart interpret
       YES → 409 TEMPORAL_SNAPSHOTS_REQUIRED
            → FE calculateForAnnualYear + serializeChart
            → retry once with temporalSnapshots
            → validate → isolated focus → KB → LLM
```

Handshake: 0 LLM, 0 events, 0 observations.

## 5. Year resolver grammar

Supports: explicit YYYY, ranges, `2027 28 29`, relative (năm nay/sau/trước),
`N năm tới` (1–5). Conservative: bare `28`, `28 tuổi`, `N năm kinh nghiệm` → no target.
Max 5 years. Domain 1900..2100. Anchor = `chart.annualYear` (never server now).

## 6. Snapshot identity contract

`anchorAnnualYear == chart.annualYear`; exact foreign year set; same natal fields;
palace topology; natalMutagens; optional static star signature (excludes annual/
annual-mutagen/major-mutagen/monthly-flow).

## 7. Temporal isolation invariant

Each year block may only use that snapshot’s annualStem/Branch, mutagens,
Tiểu Hạn, Thái Tuế, annual head, major fortune, annual stars, flowMonths.

## 8. Side-effect analysis

| Path | LLM | record_event | record_observation |
| --- | --- | --- | --- |
| TEMPORAL_SNAPSHOTS_REQUIRED | 0 | 0 | 0 |
| Interpretation (any years) | 1 stream | conservative asserted only | anchor only |

Generated snapshots are QUERY CONTEXT, not observations.

## 9. Event-parser finding

Forecast questions (`có…không?`, `liệu`, `N năm tới`, …) no longer become events.
Require assertive retrospective language (`đã`, `bị`, `năm ngoái tôi`, …).

## 10. Rate-limit behavior

Interpretation budget charged only after successful snapshot negotiation
(handshake excluded).

## 11. Test matrix

Resolver grammar; range/domain; bundle set; identity; isolation; school-before-
negotiation; handshake side effects; forecast≠event; FE single/multi snapshot;
AiChat one-shot retry; ordinary single request.

## 12. Deferred

- Cross-turn “năm đó” coreference
- Trung Châu narrative KB
- Full ZiweiSchoolPolicy extraction
- Snapshot signing
- `annualViewMode` on DTO (not required: flow geometry embedded via captured BirthInput)

## annualViewMode audit

Narrative monthly context uses `flowMonths` already present on ChartDTO.
Snapshots are generated with the captured `flowBase` BirthInput. No separate
serialized `annualViewMode` field added in this PR.
