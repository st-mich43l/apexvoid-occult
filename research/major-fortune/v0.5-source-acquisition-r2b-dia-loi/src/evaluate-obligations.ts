import { DiaLoiObligationEvaluation, DiaLoiExtractionInput, VerifiedLocator, Gap } from './types';

export function evaluateObligations(
  gaps: Gap[],
  extractions: DiaLoiExtractionInput[],
  locators: VerifiedLocator[]
): DiaLoiObligationEvaluation[] {
  const evaluations: DiaLoiObligationEvaluation[] = [];

  for (const gap of gaps) {
    const families = [gap.familyId];
    const schools: Array<'nam-phai' | 'trung-chau'> = ['nam-phai', 'trung-chau'];

    for (const family of families) {
      for (const school of schools) {
        const obligationId = `OBL-${gap.gapId}-${school.toUpperCase()}`;
        
        let state: 'missing' | 'catalogued' | 'partial' | 'verified' | 'conflicted' = 'missing';
        const matchedExtractionIds: string[] = [];
        const matchedLocatorIds: string[] = [];
        const matchedCopyIds: string[] = [];
        const reasonCodes: string[] = [];

        const matchingExtractions = extractions.filter(e => e.familyId === family && e.schoolScope === school);
        if (matchingExtractions.length > 0) {
          state = 'catalogued';
          for (const ext of matchingExtractions) {
            matchedExtractionIds.push(ext.extractionId);
            
            const locator = locators.find(l => l.locatorId === ext.locatorId);
            if (locator) {
              matchedLocatorIds.push(locator.locatorId);
              if (locator.verificationStatus === 'verified') {
                matchedCopyIds.push(locator.copyIdentityId);
                state = 'verified'; // Simplified logic, in reality checking dimensions
              }
            }
          }
          if (state !== 'verified') {
            reasonCodes.push('NO_VERIFIED_LOCATOR');
          }
        } else {
          reasonCodes.push('NO_EXTRACTION_MATCHED');
        }

        // According to requirements: "Natal-only extraction cannot close Major Fortune scope."
        // "Inferred temporal scope cannot close explicit temporal obligation."
        if (state === 'verified') {
          const dimension = gap.gapId.split('-').slice(-2, -1)[0];
          if (dimension === 'TEMPORAL') { // TEMPORAL-SCOPE
            const hasMF = matchingExtractions.some(e => e.temporalScope === 'major-fortune');
            if (!hasMF) {
              state = 'catalogued';
              reasonCodes.push('REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE');
            }
          }
        }

        evaluations.push({
          obligationId,
          gapId: gap.gapId,
          familyId: family as any,
          schoolScope: school,
          dimension: gap.gapId.split('-').slice(-2, -1)[0] || 'UNKNOWN',
          state,
          matchedCopyIds: [...new Set(matchedCopyIds)],
          matchedLocatorIds: [...new Set(matchedLocatorIds)],
          matchedExtractionIds: [...new Set(matchedExtractionIds)],
          matchedClaimBindingIds: [], // handled elsewhere or mocked
          reasonCodes
        });
      }
    }
  }

  // Hard gates checks
  const obIds = evaluations.map(e => e.obligationId);
  const uniqueObIds = new Set(obIds);
  if (obIds.length !== uniqueObIds.size) {
    throw new Error(`Duplicate obligation IDs generated: count ${obIds.length}, unique ${uniqueObIds.size}`);
  }

  return evaluations;
}
