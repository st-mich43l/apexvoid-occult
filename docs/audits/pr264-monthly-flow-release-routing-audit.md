# PR #264 — Monthly Flow School-Aware Production Release Routing Audit

**Baseline:** `1b28263a761eabee7e22ecf06d2a2f252f8af5f7` (master after PR #263)
**Branch:** `fix/pr264-monthly-flow-school-aware-release-routing`
**STATUS:** COMPLETE

## 1. Baseline SHA

Verified: branch starts at `1b28263a761eabee7e22ecf06d2a2f252f8af5f7`.

## 2. Current production routing (pre-fix)

```text
getAnalysisStatus():
  Nam + V03 ON → available @ 0.3.0
  otherwise    → available @ 0.1.2   ← ghost

production.ts analyzeMonthlyFlow():
  → analyzeMonthlyFlowProductionV03 for every school

V0.3 contract: school = "nam-phai" (return type) but options accepted ZiweiSchool
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

Options now `school: "nam-phai"` with runtime `MonthlyFlowV03UnsupportedSchoolError`.

## 7. Feature-flag fallback bug

`V03 OFF` now maps to unavailable (`v03-disabled`), not ghost `0.1.2`.

## 8. False-confidence TC test

Replaced. School rejection is proven by throw / public non-execution spy.

## 9. Production debug log

Removed `console.log` of full `engineResult`.

## 10. Chosen release policy

`release-policy.ts` SSOT:

```text
V01 OFF → module-disabled
school ≠ nam-phai → unsupported-school
V03 OFF → v03-disabled
else → Nam Phái V0.3 @ 0.3.0
```

## 11. Why V0.1.2 is NOT restored

Historical wrapper would risk wiring current `analyze.ts` (V1 RC1) into
production. TC stays unavailable until a separate qualification PR.

## 12. Nam zero-delta proof

Frozen fixture
`__tests__/fixtures/nam-phai-v03-1990-canh-2026.json`
(15/08/1990 Canh Ngọ female, annual 2026):

```text
canonical analyzeMonthlyFlow === direct V0.3
slim(canonical) === frozen fixture
```

## 13. TC fail-closed proof

Status rebuilding; production returns `school=trung-chau` unavailable;
V0.3 spy not called; ChartPage shows rebuilding for monthly-flow.

## 14. V1 unchanged proof

`release:monthly-flow-v1:gate` still imports `analyze.ts`; expected `GO_SHADOW`.

## 15. Golden / Calculation Core proof

Expected empty diffs for engines, schools, calculation, `tests/golden`.

## 16. Verification results

See PR body (typecheck, test, build, knip, gates, api:check, backend).

## 17. Unresolved findings

- `VITE_ZIWEI_MONTHLY_FLOW_V01` naming debt (umbrella kill-switch) deferred.
- TC Monthly Flow still needs a future qualified release path.

## 18. Recommended next PR

```text
#265 research(analysis): measure post-Trung-Chau correction sensitivity across temporal modules
```

Research-only; no scoring promotion.
