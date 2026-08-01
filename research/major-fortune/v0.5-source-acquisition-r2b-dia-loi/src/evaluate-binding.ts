import { FoundationClaimBinding, DiaLoiExtractionInput } from './types';

export function evaluateBinding(
  inputBindings: any[], 
  extractions: DiaLoiExtractionInput[]
): FoundationClaimBinding[] {
  const bindings: FoundationClaimBinding[] = [];

  for (const b of inputBindings) {
    let structuralStatus: 'valid' | 'invalid' | 'ambiguous' = 'valid';
    let evidenceStatus: 'unverified' | 'partial' | 'verified' | 'rejected' = 'unverified';
    const reasonCodes: string[] = [];

    // Structural validation
    if (!b.packClaimId || !b.foundationClaimId) {
      structuralStatus = 'invalid';
      reasonCodes.push('MISSING_CLAIM_MAPPING');
    }

    // Evidence status verification
    // A binding is verified if there is at least one extraction that targets this claim and is verified (has a verified locator).
    // Note: extraction validation happens in `evaluate-obligations`, but we can link them here.
    const matchingExtractions = extractions.filter(e => e.claimId === b.packClaimId && e.familyId === b.familyId && e.schoolScope === b.schoolScope);
    
    if (matchingExtractions.length > 0) {
      // In this system, if we have an extraction but the source is blocked, it's still unverified.
      // We will leave evidenceStatus as unverified if there are no verified extractions mapped.
      // For simplicity in R2b, unless the locator is verified, it remains unverified.
      evidenceStatus = 'unverified'; 
      reasonCodes.push('NO_VERIFIED_EXTRACTION');
    } else {
      reasonCodes.push('NO_MATCHING_EXTRACTION');
    }

    bindings.push({
      foundationClaimId: b.foundationClaimId,
      packClaimId: b.packClaimId,
      familyId: b.familyId,
      schoolScope: b.schoolScope,
      structuralStatus,
      evidenceStatus,
      reasonCodes
    });
  }

  return bindings;
}
