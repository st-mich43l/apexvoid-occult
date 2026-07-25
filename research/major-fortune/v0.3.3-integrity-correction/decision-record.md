# Major Fortune V0.3.3 Integrity Correction Decision Record

## Context

The Major Fortune V0.3 scoring pipeline required hardening to ensure referential integrity, deterministic behavior, and truthful policy-based capability communication. The V0.3.3 integrity correction specifically focuses on:
1. Ensuring the system correctly distinguishes between "Calculation Core cannot do this" vs "The V0.3 policy does not allow this".
2. Resolving ambiguity in how canonical Mệnh palace indices are located (avoiding name-based or non-deterministic lookups).
3. Enforcing referential integrity between evidence `sourceIds` / `claimIds` and the engineering provenance registry.
4. Ensuring the evaluator's output is invariant under any permutation of the input evidence array (deterministic sorting and conflict elimination).
5. Explicitly communicating Vô Chính Diệu as a "no signal" state rather than a generically available but empty pillar.

## Decisions

1. **Policy-Based Capability Communication**:
   - The Nam Phái Tứ Hóa logic remains blocked in V0.3 for research and validation.
   - The reason codes and UI messages were updated to clearly state that the blockage is due to *scoring policy*, not *Calculation Core incapability*, as the Calculation Core does provide `tuHoaTargets`.

2. **Canonical Mệnh Resolution**:
   - Lookups based on string matching (e.g., `name === "Mệnh"`) or `isMenh` flags were replaced with the canonical `chart.menhIndex`.
   - Structural diagnostics were added to detect and report mismatches.

3. **Referential Integrity**:
   - Added validation in the adapter to enforce that all `sourceIds` and `claimIds` present in generated evidence actually exist in the `engineering-provenance.v0.3.json` registry.
   - Unknown provenance IDs are caught early and translated into `missingProvenance` diagnostics.

4. **Deterministic Evaluation**:
   - The evaluator now performs a canonical, multi-key sort on the incoming evidence array before processing.
   - A pre-scan pass detects conflicting physical facts (same fact ID but opposite direction) and rejects the *entire conflicting group*, eliminating order bias.

5. **Explicit Vô Chính Diệu Semantics**:
   - For palaces lacking principal stars (Vô Chính Diệu), the module now emits an explicit reason code (`vo-chinh-dieu-no-direct-principal-evidence`).
   - It refrains from borrowing opposite-palace stars, maintaining the V0.3 scoring logic but making the empty state explicitly traceable.

## Impact

The pipeline is now strictly deterministic and hardened for production promotion. No scoring formulas or budgets were altered. The overall score outcomes for valid, non-conflicting charts remain identical to V0.3.2, fulfilling the requirement of an isolated integrity correction.
