import type {
  FoundationClaimBinding,
  ValidatedExtraction,
  VerifiedLocator,
} from './types';

/**
 * Evaluate foundation claim bindings.
 *
 * Structural validity: the mapping between foundationClaimId and packClaimId exists and is valid.
 * Evidence validity: extractions that support or contradict the binding's claim.
 *
 * These are INDEPENDENT assessments — structural mapping may be valid while evidence remains insufficient.
 */
export function evaluateBindings(
  bindingInputs: FoundationClaimBinding[],
  extractions: ValidatedExtraction[],
  locators: VerifiedLocator[]
): FoundationClaimBinding[] {
  return bindingInputs.map(binding => {
    const matchedExtractionIds: string[] = [];
    const reasonCodes: string[] = [...binding.reasonCodes];

    // Find valid extractions that match this binding's claim and scope
    const matchingExtractions = extractions.filter(
      e =>
        e.claimId === binding.packClaimId &&
        e.familyId === binding.familyId &&
        e.schoolScope === binding.schoolScope &&
        e.isValid
    );

    for (const ext of matchingExtractions) {
      matchedExtractionIds.push(ext.extractionId);
    }

    // Determine evidence status
    const supportingExtracts = matchingExtractions.filter(e => e.polarity === 'supports');
    const contradictingExtracts = matchingExtractions.filter(e => e.polarity === 'contradicts');

    let evidenceStatus: FoundationClaimBinding['evidenceStatus'] = 'insufficient';

    if (contradictingExtracts.length > 0 && supportingExtracts.length === 0) {
      evidenceStatus = 'contradicted';
      reasonCodes.push('ALL_EXTRACTIONS_CONTRADICT');
    } else if (supportingExtracts.length > 0) {
      // Check if any supporting extraction has verified locator quality
      const hasVerifiedLocator = supportingExtracts.some(ext => {
        const loc = locators.find(l => l.locatorId === ext.locatorId);
        return loc && loc.verificationStatus === 'verified' && loc.inspectedPageHashes.length > 0;
      });
      if (hasVerifiedLocator) {
        evidenceStatus = 'verified';
      } else {
        evidenceStatus = 'insufficient';
        reasonCodes.push('NO_VERIFIED_LOCATOR_FOR_EXTRACTION');
      }
    } else {
      reasonCodes.push('NO_SUPPORTING_EXTRACTION');
    }

    return {
      ...binding,
      structuralStatus: binding.structuralStatus, // Preserve structural status from input
      evidenceStatus,
      matchedExtractionIds: [...new Set(matchedExtractionIds)],
      reasonCodes: [...new Set(reasonCodes)],
    };
  });
}
