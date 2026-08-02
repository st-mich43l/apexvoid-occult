import { DiaLoiClaimAdjudication, DiaLoiObligationEvaluation, DiaLoiExtractionInput } from './types';

export function adjudicateClaims(
  inputClaims: any[],
  obligations: DiaLoiObligationEvaluation[],
  extractions: DiaLoiExtractionInput[],
  contradictionsInput: any[]
): DiaLoiClaimAdjudication[] {
  const adjudications: DiaLoiClaimAdjudication[] = [];

  for (const claim of inputClaims) {
    const requiredObs = obligations.filter(o => o.familyId === claim.familyId && o.schoolScope === claim.schoolScope);

    let decision: 'supported' | 'conditionally-supported' | 'mixed' | 'contradicted' | 'insufficient-evidence' = 'insufficient-evidence';
    const unresolvedReasons: string[] = [];

    const matchingExtractions = extractions.filter(e => e.claimId === claim.claimId);
    const supportingExtIds = matchingExtractions.filter(e => e.polarity === 'support').map(e => e.extractionId);

    // Contradictions evaluation
    // If the claim has any unresolved contradictions targeting it, we must reflect it
    const relevantContradictions = contradictionsInput.filter(c => c.targetClaimId === claim.claimId);
    const unresolvedContradictions = relevantContradictions.filter(c => c.resolutionStatus !== 'resolved');

    const contradictingExtIds = matchingExtractions.filter(e => e.polarity === 'pressure').map(e => e.extractionId);

    const missingObs = requiredObs.filter(o => o.state !== 'verified');

    if (missingObs.length > 0) {
      decision = 'insufficient-evidence';
      unresolvedReasons.push(`MISSING_OBLIGATIONS_${missingObs.length}`);
    } else {
      if (unresolvedContradictions.length > 0) {
        decision = 'mixed';
        if (supportingExtIds.length === 0) {
          decision = 'contradicted';
        }
        unresolvedReasons.push('UNRESOLVED_CONTRADICTIONS');
      } else if (contradictingExtIds.length > 0) {
        // If there are pressure polarities but no tracked contradictions, it's mixed
        decision = 'mixed';
      } else {
        decision = 'supported';
      }
    }

    adjudications.push({
      adjudicationId: `ADJ-${claim.claimId}`,
      claimId: claim.claimId,
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
