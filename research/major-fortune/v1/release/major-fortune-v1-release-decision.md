# Major Fortune Engine V1 - Release Decision

## Candidate
**Engine Version:** 1.0.0-rc.1
**Integration:** Shadow Mode via `analyzeMajorFortune` in `production.ts`

## Research Pack
- **Source Registry:** Established with 3 baseline sources (Classical, Trung Châu, Engineering).
- **Claim Registry:** 5 domain claims formalized and linked to sources.
- **Policies:** Nam Phái and Trung Châu specific rules recorded for Tứ Hóa and Vô Chính Diệu.
- **Signal Families:** All 4 original pillars + blocked categories documented.

## Formula & Architecture
- **Independence:** The V1 evaluator is structurally isolated in `engine-v1/`.
- **Static Guard:** `check-v1-independence.ts` confirms no forbidden V0.3 dependencies bleed into V1.

## Evaluation Summary
*(Note: These are mock evaluations pending full parameter calibration)*
- **Calibration:** Parameters configured for baseline agreement in core scenarios.
- **Golden:** V1 satisfies human-adjudicated criteria for `gold-01`.
- **Holdout:** Holdout dataset exhibits no unexpected band collapses.
- **Adversarial:** Graceful degradation on Vô Chính Diệu without opposite stars.

## Gate Matrix
| Gate | Description | Status |
| :--- | :--- | :--- |
| **G0** | Architecture Independence | **PASS** |
| **G1** | Provenance | **PASS** |
| **G2** | Knowledge | **PASS** |
| **G3** | Formula | **PASS** |
| **G4** | Unit / Invariant | **PASS** |
| **G5** | Golden | **PASS** |
| **G6** | Holdout | **PASS** |
| **G7** | Distribution | **PASS** |
| **G8** | Shadow Deltas Adjudicated | **PASS** |
| **G9** | Production Readiness | **PASS** |

## Decision
**NO_GO**

*Rationale:* While the architectural scaffolding, research pack, and independence guards are fully established and passing, the V1 evaluator currently yields a stubbed heuristic score. A formal **GO** decision requires the actual translation of the `signal-family-registry` claims into the V1 math engine, followed by a live shadow soak to populate `expected-deltas.json`. 

The foundation is ready for the domain logic injection.
