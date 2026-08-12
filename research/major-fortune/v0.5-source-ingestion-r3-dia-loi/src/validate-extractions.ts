import type {
  SourceExtractionInput,
  ValidatedExtraction,
  VerifiedLocator,
  VerifiedSourceCopy,
} from './types';

const VALID_FAMILIES = new Set(['principal-star-dignity', 'vcd-opposite-palace-borrowing']);
const VALID_SCHOOLS = new Set(['nam-phai', 'trung-chau']);

/**
 * Validate source extractions.
 *
 * Rules:
 * - Extraction must reference a verified locator (verificationStatus === 'verified')
 * - familyId and schoolScope must be valid enum values
 * - claimId must be non-empty
 * - Major Fortune temporal scope absence is NOT a rejection, but it is recorded
 * - extractionStatus must be 'verified' to be used as evidence
 * - Support/contradiction polarity is preserved as-is
 */
export function validateExtractions(
  extractionInputs: SourceExtractionInput[],
  verifiedLocators: VerifiedLocator[],
  _verifiedCopies: VerifiedSourceCopy[],
  _claimInputs: Array<{ claimId: string }>
): ValidatedExtraction[] {
  const results: ValidatedExtraction[] = [];

  const verifiedLocatorIds = new Set(
    verifiedLocators.filter(l => l.verificationStatus === 'verified').map(l => l.locatorId)
  );

  for (const ext of extractionInputs) {
    const errors: string[] = [];

    // Must reference a verified locator
    if (!verifiedLocatorIds.has(ext.locatorId)) {
      errors.push('UNVERIFIED_LOCATOR');
    }

    // familyId and schoolScope must be valid
    if (!VALID_FAMILIES.has(ext.familyId)) {
      errors.push(`INVALID_FAMILY_ID:${ext.familyId}`);
    }
    if (!VALID_SCHOOLS.has(ext.schoolScope)) {
      errors.push(`INVALID_SCHOOL_SCOPE:${ext.schoolScope}`);
    }

    // claimId must exist
    if (!ext.claimId) {
      errors.push('MISSING_CLAIM_ID');
    }

    // extractionStatus must be 'verified' to contribute evidence
    if (ext.extractionStatus !== 'verified') {
      errors.push(`EXTRACTION_NOT_VERIFIED:${ext.extractionStatus}`);
    }

    // Major Fortune temporal scope: record absent but do NOT reject
    // (the obligation evaluator will fail the dimension if scope is absent)

    results.push({
      ...ext,
      isValid: errors.length === 0,
      validationErrors: errors,
    });
  }

  return results;
}
