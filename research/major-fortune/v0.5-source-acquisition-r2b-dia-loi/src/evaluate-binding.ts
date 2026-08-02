import { FoundationClaimBinding } from './types';
import { ValidatedExtraction } from './validate-extractions';
import { generateDeterministicId } from './canonical-json';

export function evaluateBinding(
  inputBindings: any[], 
  extractions: ValidatedExtraction[]
): FoundationClaimBinding[] {
  const bindings: FoundationClaimBinding[] = [];

  for (const b of inputBindings) {
    let structuralStatus: 'valid' | 'invalid' | 'ambiguous' = 'valid';
    let evidenceStatus: 'unverified' | 'partial' | 'verified' | 'rejected' = 'unverified';
    const reasonCodes: string[] = [];

    if (!b.packClaimId || !b.foundationClaimId) {
      structuralStatus = 'invalid';
      reasonCodes.push('MISSING_CLAIM_MAPPING');
    }

    const matchingExtractions = extractions.filter(e => e.claimId === b.packClaimId && e.familyId === b.familyId && e.schoolScope === b.schoolScope);
    
    if (matchingExtractions.length === 0) {
      reasonCodes.push('NO_MATCHING_EXTRACTION');
    } else {
      const verifiedExts = matchingExtractions.filter(e => e.isVerified);
      if (verifiedExts.length > 0) {
        evidenceStatus = 'verified';
      } else {
        evidenceStatus = 'unverified';
        reasonCodes.push('NO_VERIFIED_EXTRACTION');
      }
    }
    
    const seed = `${b.foundationClaimId}|${b.packClaimId}|${b.familyId}|${b.schoolScope}`;
    const bindingId = generateDeterministicId('BND', seed);

    // Duplicate check handled outside or here if we have full state
    const duplicate = bindings.find(x => x.bindingId === bindingId);
    if (duplicate) {
      structuralStatus = 'invalid';
      reasonCodes.push('DUPLICATE_BINDING');
    }

    bindings.push({
      bindingId,
      foundationClaimId: b.foundationClaimId,
      packClaimId: b.packClaimId,
      familyId: b.familyId,
      schoolScope: b.schoolScope,
      structuralStatus,
      evidenceStatus,
      matchedExtractionIds: matchingExtractions.map(e => e.extractionId),
      reasonCodes
    });
  }

  return bindings;
}
