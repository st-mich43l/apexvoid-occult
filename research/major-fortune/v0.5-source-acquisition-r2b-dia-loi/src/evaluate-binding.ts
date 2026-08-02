import { FoundationClaimBinding } from './types';
import { ValidatedExtraction } from './validate-extractions';
import { generateDeterministicId } from './canonical-json';

export function evaluateBinding(
  inputBindings: any[],
  extractions: ValidatedExtraction[],
  claims: any[]
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

    const packClaim = claims.find(c => c.claimId === b.packClaimId);
    if (!packClaim) {
      structuralStatus = 'invalid';
      reasonCodes.push('UNKNOWN_PACK_CLAIM');
    } else {
      if (packClaim.familyId !== b.familyId) {
        structuralStatus = 'invalid';
        reasonCodes.push('WRONG_FAMILY_FOR_CLAIM');
      }
      if (packClaim.schoolScope !== b.schoolScope) {
        structuralStatus = 'invalid';
        reasonCodes.push('WRONG_SCHOOL_FOR_CLAIM');
      }
    }

    // Check for duplicate / ambiguous mapping
    const ambiguous = inputBindings.filter(x =>
      x.packClaimId === b.packClaimId &&
      x.familyId === b.familyId &&
      x.schoolScope === b.schoolScope &&
      x.foundationClaimId !== b.foundationClaimId
    );
    if (ambiguous.length > 0) {
      structuralStatus = 'ambiguous';
      reasonCodes.push('AMBIGUOUS_BINDING_MAPPING');
    }

    const matchingExtractions = extractions.filter(e =>
      e.claimId === b.packClaimId &&
      e.familyId === b.familyId &&
      e.schoolScope === b.schoolScope
    );

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
