import { DiaLoiClaimAdjudication, DiaLoiObligationEvaluation, DiaLoiExtractionInput } from './types';

export function adjudicateClaims(
  inputClaims: any[], 
  obligations: DiaLoiObligationEvaluation[], 
  extractions: DiaLoiExtractionInput[]
): DiaLoiClaimAdjudication[] {
  const adjudications: DiaLoiClaimAdjudication[] = [];

  for (const claim of inputClaims) {
    const requiredObs = obligations.filter(o => o.familyId === claim.familyId && o.schoolScope === claim.schoolScope);
    
    let decision: 'supported' | 'conditionally-supported' | 'mixed' | 'contradicted' | 'insufficient-evidence' = 'insufficient-evidence';
    const unresolvedReasons: string[] = [];

    // Since we don't have the fully validated extraction list here directly, we'll map extractions matching the claim.
    const matchingExtractions = extractions.filter(e => e.claimId === claim.packClaimId);
    const supportingExtIds = matchingExtractions.filter(e => e.polarity === 'support').map(e => e.extractionId);
    const contradictingExtIds = matchingExtractions.filter(e => e.polarity === 'pressure').map(e => e.extractionId);

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
        decision = 'supported';
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
