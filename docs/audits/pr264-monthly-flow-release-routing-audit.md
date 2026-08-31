# PR #264 — Monthly Flow School-Aware Production Release Routing Audit

**Baseline:** `1b28263a761eabee7e22ecf06d2a2f252f8af5f7` (master after PR #263)
**Branch:** `fix/pr264-monthly-flow-school-aware-release-routing`
**STATUS:** IN PROGRESS

## 1. Baseline SHA

Verified: branch starts at `1b28263a761eabee7e22ecf06d2a2f252f8af5f7`.

## 2. Current production routing (pre-fix)

```text
getAnalysisStatus():
  Nam + V03 ON → available @ 0.3.0
  otherwise    → available @ 0.1.2   ← ghost

production.ts analyzeMonthlyFlow():
  → analyzeMonthlyFlowProductionV03 for every school

V0.3 contract: school = "nam-phai" (return type) but options accept ZiweiSchool
```

## 3. Historical timeline

| Milestone | Fact |
| --- | --- |
| V0.1.2 | School-aware production path existed |
| PR #138 | V0.3 promoted for Nam Phái; 0.1.2 retained as fallback |
| `8b953d0` | V0.1/V0.1.2 implementation deleted as unused; status fallback remained |
| Later | `production.ts` became V0.3-only; stale `0.1.2` status survived |
| PR #264 | Removes ghost fallback; unsupported school fail-closed |

## 4. Root cause

Status advertised school-generic `0.1.2` after the executor was deleted, while
the public resolver always ran Nam-only V0.3.

## 5. Ghost 0.1.2 status

Live `available @ 0.1.2` existed only in `contracts/common.ts` with no executor.

## 6. V0.3 Nam-only contract

V0.3 types already declare `school: "nam-phai"`. Options incorrectly accepted
`ZiweiSchool`; TC provider can be created and would score if Annual Axes present.

## 7. Feature-flag fallback bug

`V03 OFF` incorrectly fell through to ghost `0.1.2` instead of unavailable.

## 8. False-confidence TC test

Existing TC call without Annual Axes observed `unavailable` — not school routing.

## 9. Production debug log

`console.log` full `engineResult` dump in `analyze-production.ts`.

## 10–18.

Filled as commits land.
