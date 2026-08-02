import { DiaLoiExtractionInput, VerifiedLocator } from './types';

export interface ValidatedExtraction extends DiaLoiExtractionInput {
  isVerified: boolean;
  validationReasons: string[];
}

export function validateExtractions(
  inputs: DiaLoiExtractionInput[],
  verifiedLocators: VerifiedLocator[]
): ValidatedExtraction[] {
  return inputs.map(input => {
    const reasons: string[] = [];
    const locator = verifiedLocators.find(l => l.locatorId === input.locatorId);

    if (!locator) {
      reasons.push('MISSING_LOCATOR');
    } else if (locator.verificationStatus !== 'verified') {
      reasons.push('UNVERIFIED_LOCATOR');
    }

    if (input.temporalScope === 'natal' || input.temporalScope === 'annual' || input.temporalScope === 'monthly') {
      reasons.push('TEMPORAL_SCOPE_CANNOT_CLOSE_MAJOR_FORTUNE');
    }
    
    if (input.explicitStatementDimensions.includes('majorFortuneTemporalScope') && input.temporalScope !== 'major-fortune') {
      reasons.push('INVALID_TEMPORAL_SCOPE_FOR_EXPLICIT_DIMENSION');
    }

    const isVerified = reasons.length === 0 && !!locator && locator.verificationStatus === 'verified';

    return {
      ...input,
      isVerified,
      validationReasons: reasons
    };
  });
}
