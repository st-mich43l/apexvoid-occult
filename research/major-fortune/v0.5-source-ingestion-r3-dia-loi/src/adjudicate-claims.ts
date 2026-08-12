import type {
  ClaimAdjudicationResult,
  ObligationEvaluationResult,
  ValidatedExtraction,
  SourceIndependenceEntry,
  DiaLoiFamilyId,
  SchoolScope,
} from './types';

interface ClaimInput {
  claimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
}

/**
 * Adjudicate claims from verified evidence.
 *
 * Outcome precedence:
 *   - not-applicable: no obligations for this lane
 *   - insufficient-evidence: obligations exist but none verified
 *   - contradicted: evidence explicitly contradicts with no supporting counter
 *   - qualified: some evidence supports but major caveats exist
 *   - supported: all obligations verified, no blocking contradictions
 *
 * Each adjudication references:
 *   - obligation IDs
 *   - supporting extraction IDs
 *   - contradicting extraction IDs
 *   - verified source copy IDs
 *   - verified locator IDs
 *   - independence result
 *   - Major Fortune temporal scope result
 *   - school scope confirmation
 */
export function adjudicateClaims(
  claimInputs: ClaimInput[],
  obligations: ObligationEvaluationResult[],
  extractions: ValidatedExtraction[],
  independenceEntries: SourceIndependenceEntry[]
): ClaimAdjudicationResult[] {
  return claimInputs.map(claim => {
    const claimObligations = obligations.filter(
      o => o.familyId === claim.familyId && o.schoolScope === claim.schoolScope
    );

    const claimExtractions = extractions.filter(
      e =>
        e.claimId === claim.claimId &&
        e.familyId === claim.familyId &&
        e.schoolScope === claim.schoolScope &&
        e.isValid
    );

    const independenceEntry =
      independenceEntries.find(
        i => i.familyId === claim.familyId && i.schoolScope === claim.schoolScope
      ) ?? null;

    const supportingExtractionIds = claimExtractions
      .filter(e => e.polarity === 'supports')
      .map(e => e.extractionId);

    const contradictingExtractionIds = claimExtractions
      .filter(e => e.polarity === 'contradicts')
      .map(e => e.extractionId);

    const verifiedSourceCopyIds = [
      ...new Set(
        claimExtractions
          .filter(e => e.polarity === 'supports')
          .map(e => {
            // copyId is tracked in verifiedLocatorIds via obligations; use extractionId as proxy here
            return e.extractionId;
          })
      ),
    ];

    const verifiedLocatorIds = [
      ...new Set(
        claimExtractions
          .filter(e => e.polarity === 'supports')
          .map(e => e.locatorId)
      ),
    ];

    // Determine Major Fortune temporal scope result
    const mfScopeResult = deriveMfScopeResult(claimExtractions);

    const obligationIds = claimObligations.map(o => o.obligationId);
    const reasonCodes: string[] = [];

    let outcome: ClaimAdjudicationResult['outcome'] = 'insufficient-evidence';

    if (claimObligations.length === 0) {
      outcome = 'not-applicable';
      reasonCodes.push('NO_OBLIGATIONS_FOR_LANE');
    } else {
      const verifiedObs = claimObligations.filter(o => o.status === 'verified');
      const contradictedObs = claimObligations.filter(o => o.status === 'contradicted');
      const blockedObs = claimObligations.filter(o => o.status === 'blocked');

      if (contradictedObs.length > 0) {
        outcome = 'contradicted';
        reasonCodes.push('CONTRADICTED_OBLIGATIONS');
      } else if (blockedObs.length > 0) {
        outcome = 'insufficient-evidence';
        reasonCodes.push(`BLOCKED_OBLIGATIONS:${blockedObs.length}`);
      } else if (verifiedObs.length === claimObligations.length) {
        // All obligations verified — check independence
        if (independenceEntry && independenceEntry.status === 'independent') {
          if (mfScopeResult === 'explicit') {
            outcome = 'supported';
          } else if (mfScopeResult === 'implicit') {
            outcome = 'qualified';
            reasonCodes.push('IMPLICIT_MF_SCOPE');
          } else {
            outcome = 'insufficient-evidence';
            reasonCodes.push('MISSING_TEMPORAL_SCOPE');
          }
        } else {
          outcome = 'insufficient-evidence';
          reasonCodes.push('INSUFFICIENT_INDEPENDENT_SOURCES');
        }
      } else {
        outcome = 'insufficient-evidence';
        reasonCodes.push(`PARTIAL_OBLIGATIONS:${verifiedObs.length}/${claimObligations.length}`);
      }
    }

    return {
      adjudicationId: `ADJ-R3-${claim.claimId}-${claim.familyId}-${claim.schoolScope}`,
      claimId: claim.claimId,
      familyId: claim.familyId,
      schoolScope: claim.schoolScope,
      outcome,
      obligationIds,
      supportingExtractionIds,
      contradictingExtractionIds,
      verifiedSourceCopyIds,
      verifiedLocatorIds,
      independenceResult: independenceEntry,
      majorFortuneTemporalScopeResult: mfScopeResult,
      schoolScope_confirmed: claim.schoolScope,
      reasonCodes: [...new Set(reasonCodes)],
    };
  });
}

function deriveMfScopeResult(
  extractions: ValidatedExtraction[]
): 'explicit' | 'implicit' | 'absent' | 'not-evaluated' {
  if (extractions.length === 0) return 'not-evaluated';
  const supportingExts = extractions.filter(e => e.polarity === 'supports');
  if (supportingExts.length === 0) return 'not-evaluated';
  if (supportingExts.some(e => e.majorFortuneTemporalScope === 'explicit')) return 'explicit';
  if (supportingExts.some(e => e.majorFortuneTemporalScope === 'implicit')) return 'implicit';
  return 'absent';
}
