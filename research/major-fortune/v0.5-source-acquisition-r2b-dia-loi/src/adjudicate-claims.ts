import { DiaLoiClaimAdjudication, DiaLoiObligationEvaluation, DiaLoiExtractionInput } from './types';

export function adjudicateClaims(
  inputClaims: any[], 
  obligations: DiaLoiObligationEvaluation[], 
  extractions: DiaLoiExtractionInput[]
): DiaLoiClaimAdjudication[] {
  const adjudications: DiaLoiClaimAdjudication[] = [];

  for (const claim of inputClaims) {
    const matchingExtractions = extractions.filter(e => e.claimId === claim.packClaimId);
    
    // The obligation IDs for this family & school
    const requiredObs = obligations.filter(o => o.familyId === claim.familyId && o.schoolScope === claim.schoolScope);
    
    let decision: 'supported' | 'conditionally-supported' | 'mixed' | 'contradicted' | 'insufficient-evidence' = 'insufficient-evidence';
    const unresolvedReasons: string[] = [];
    const supportingExtIds = matchingExtractions.filter(e => e.polarity === 'support').map(e => e.extractionId);
    const contradictingExtIds = matchingExtractions.filter(e => e.polarity === 'pressure').map(e => e.extractionId);

    if (requiredObs.length === 0) {
      unresolvedReasons.push('NO_REQUIRED_OBLIGATIONS_FOUND');
    } else {
      const missingObs = requiredObs.filter(o => o.state !== 'verified');
      if (missingObs.length > 0) {
        decision = 'insufficient-evidence';
        unresolvedReasons.push(`MISSING_OBLIGATIONS_${missingObs.length}`);
      } else {
        if (contradictingExtIds.length > 0) {
          decision = 'mixed';
          if (supportingExtIds.length === 0) {
            decision = 'contradicted';
          }
        } else {
          // Are there conditional logic? Not for now, simplified.
          decision = 'supported';
        }
      }
    }

    adjudications.push({
      adjudicationId: `ADJ-${claim.packClaimId}`,
      claimId: claim.packClaimId,
      familyId: claim.familyId,
      schoolScope: claim.schoolScope,
      decision,
      supportingExtractionIds: supportingExtIds,
      contradictingExtractionIds: contradictingExtIds,
      requiredObligationIds: requiredObs.map(o => o.obligationId),
      unresolvedReasons
    });
  }

  return adjudications;
}
