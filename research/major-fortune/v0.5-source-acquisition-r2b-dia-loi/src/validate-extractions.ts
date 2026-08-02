import { DiaLoiExtractionInput, VerifiedLocator, VerifiedSourceCopy } from './types';

export interface ValidatedExtraction extends DiaLoiExtractionInput {
  isVerified: boolean;
  validationReasons: string[];
}

const VALID_DIMENSIONS = new Set([
  'existence', 'majorFortuneTemporalScope', 'palaceFrame', 'targetFrame',
  'polarity', 'strength', 'exceptionPolicy', 'sourceLocatorQuality',
  'crossSourceAgreement', 'schoolScope'
]);

export function validateExtractions(
  inputs: DiaLoiExtractionInput[],
  verifiedLocators: VerifiedLocator[],
  verifiedCopies: VerifiedSourceCopy[],
  claims: any[]
): ValidatedExtraction[] {
  return inputs.map(input => {
    const reasons: string[] = [];

    const claim = claims.find(c => c.claimId === input.claimId);
    if (!claim) {
      reasons.push('UNKNOWN_CLAIM');
    } else {
      if (claim.familyId !== input.familyId) reasons.push('WRONG_FAMILY_FOR_CLAIM');
      if (claim.schoolScope !== input.schoolScope) reasons.push('WRONG_SCHOOL_FOR_CLAIM');
    }

    if (input.familyId !== 'principal-star-dignity' && input.familyId !== 'vcd-opposite-palace-borrowing') {
      reasons.push('UNKNOWN_FAMILY');
    }
    if (input.schoolScope !== 'nam-phai' && input.schoolScope !== 'trung-chau') {
      reasons.push('UNKNOWN_SCHOOL');
    }

    const locator = verifiedLocators.find(l => l.locatorId === input.locatorId);
    if (!locator) {
      reasons.push('UNKNOWN_LOCATOR');
    } else if (locator.verificationStatus !== 'verified') {
      reasons.push('UNVERIFIED_LOCATOR');
    } else {
      const copy = verifiedCopies.find(c => c.copyIdentityId === locator.copyIdentityId);
      if (!copy || copy.inspectionStatus !== 'verified') {
        reasons.push('UNVERIFIED_COPY');
      }
    }

    if (!input.propositionParaphrase || input.propositionParaphrase.trim().length === 0) {
      reasons.push('EMPTY_PROPOSITION_PARAPHRASE');
    }

    for (const d of input.explicitStatementDimensions) {
      if (!VALID_DIMENSIONS.has(d)) reasons.push('UNKNOWN_DIMENSION');
    }
    for (const d of input.inferredDimensions) {
      if (!VALID_DIMENSIONS.has(d)) reasons.push('UNKNOWN_DIMENSION');
    }
    for (const d of input.unsupportedDimensions) {
      if (!VALID_DIMENSIONS.has(d)) reasons.push('UNKNOWN_DIMENSION');
    }

    const explicit = new Set(input.explicitStatementDimensions);
    const inferred = new Set(input.inferredDimensions);
    const unsupported = new Set(input.unsupportedDimensions);

    for (const d of input.explicitStatementDimensions) {
      if (inferred.has(d)) reasons.push('CONTRADICTORY_DIMENSION_CLASSIFICATION_EXPLICIT_INFERRED');
      if (unsupported.has(d)) reasons.push('CONTRADICTORY_DIMENSION_CLASSIFICATION_EXPLICIT_UNSUPPORTED');
    }

    if (input.temporalScope === 'natal' || input.temporalScope === 'annual' || input.temporalScope === 'monthly') {
      // It is valid for its actual scope, but it cannot close the Major Fortune temporal-scope obligation.
      // Wait, user said: "A natal, annual or monthly extraction is not globally invalid. It is valid for its actual scope, but it cannot close the Major Fortune temporal-scope obligation."
      // So we shouldn't push a reason that makes isVerified=false if it's just natal!
      // But we DO want to ensure it doesn't close Major Fortune scope. This should be handled in `evaluate-obligations.ts`.
      // What about "No unsupported temporal promotion"?
      // If temporalScope is natal, and explicitStatementDimensions includes majorFortuneTemporalScope, that's invalid.
      if (explicit.has('majorFortuneTemporalScope')) {
        reasons.push('INVALID_TEMPORAL_SCOPE_FOR_EXPLICIT_DIMENSION');
      }
    }

    const isVerified = reasons.length === 0;

    return {
      ...input,
      isVerified,
      validationReasons: reasons
    };
  });
}
