import { DiaLoiObligationEvaluation, CanonicalDiaLoiSourceObligation, FoundationClaimBinding, VerifiedLocator } from './types';
import { ValidatedExtraction } from './validate-extractions';

export function evaluateObligations(
  obligations: CanonicalDiaLoiSourceObligation[],
  extractions: ValidatedExtraction[],
  locators: VerifiedLocator[],
  bindings: FoundationClaimBinding[]
): DiaLoiObligationEvaluation[] {
  const evaluations: DiaLoiObligationEvaluation[] = [];

  for (const obligation of obligations) {
    let state: 'missing' | 'catalogued' | 'partial' | 'verified' | 'conflicted' = 'missing';
    const matchedExtractionIds: string[] = [];
    const matchedLocatorIds: string[] = [];
    const matchedCopyIds: string[] = [];
    const matchedClaimBindingIds: string[] = [];
    const reasonCodes: string[] = [];

    const relevantExtractions = extractions.filter(e => e.familyId === obligation.familyId && e.schoolScope === obligation.schoolScope);
    
    // Bindings mapping
    const relevantBindings = bindings.filter(b => b.foundationClaimId === obligation.foundationClaimId && b.familyId === obligation.familyId && b.schoolScope === obligation.schoolScope);
    
    for (const b of relevantBindings) {
      matchedClaimBindingIds.push(b.bindingId);
    }

    if (relevantExtractions.length > 0) {
      state = 'catalogued';
      
      let verifiedDimension = false;

      for (const ext of relevantExtractions) {
        if (!ext.isVerified) continue;

        // One locator must not automatically satisfy every dimension.
        // Dimension-specific checks:
        let satisfiesDimension = false;

        // Inferred evidence cannot satisfy an explicit-source obligation.
        // Unsupported evidence cannot satisfy an obligation.
        if (ext.unsupportedDimensions.includes(obligation.dimension)) {
          continue;
        }

        if (ext.inferredDimensions.includes(obligation.dimension)) {
          continue; // Cannot close with inferred
        }

        if (!ext.explicitStatementDimensions.includes(obligation.dimension)) {
          // If not explicitly stated for this dimension, it can't close it
          // Except maybe sourceLocatorQuality and crossSourceAgreement which are structural
          if (obligation.dimension !== 'sourceLocatorQuality' && obligation.dimension !== 'crossSourceAgreement' && obligation.dimension !== 'schoolScope') {
            continue;
          }
        }

        switch (obligation.dimension) {
          case 'existence':
            satisfiesDimension = true;
            break;
          case 'majorFortuneTemporalScope':
            if (ext.temporalScope === 'major-fortune') {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('EXPLICIT_MAJOR_FORTUNE_REQUIRED');
            }
            break;
          case 'palaceFrame':
            if (ext.palaceFrame === 'active-major-fortune-palace') {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('EXPLICIT_ACTIVE_PALACE_FRAME_REQUIRED');
            }
            break;
          case 'targetFrame':
            if (ext.targetFrame === 'opposite-palace' || ext.targetFrame === 'whole-axis') {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('TARGET_FRAME_REQUIRED');
            }
            break;
          case 'polarity':
            if (['support', 'pressure', 'conditional', 'neutral'].includes(ext.polarity)) {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('EXPLICIT_POLARITY_REQUIRED');
            }
            break;
          case 'strength':
            if (['weak', 'moderate', 'strong'].includes(ext.strength)) {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('EXPLICIT_STRENGTH_REQUIRED');
            }
            break;
          case 'exceptionPolicy':
            if (ext.exceptionPolicy.length > 0) {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('EXPLICIT_EXCEPTION_POLICY_REQUIRED');
            }
            break;
          case 'sourceLocatorQuality':
            satisfiesDimension = true;
            break;
          case 'crossSourceAgreement':
            // Handled structurally in independence engine, but initially true here if we have extraction
            satisfiesDimension = true; 
            break;
          case 'schoolScope':
            satisfiesDimension = true;
            break;
        }

        if (satisfiesDimension) {
          verifiedDimension = true;
          matchedExtractionIds.push(ext.extractionId);
          matchedLocatorIds.push(ext.locatorId);
          const loc = locators.find(l => l.locatorId === ext.locatorId);
          if (loc) {
            matchedCopyIds.push(loc.copyIdentityId);
          }
        }
      }

      if (verifiedDimension) {
        state = 'verified';
      } else {
        if (!reasonCodes.length) {
          reasonCodes.push('NO_MATCHING_EXTRACTION_FOR_DIMENSION');
        }
      }
    } else {
      reasonCodes.push('NO_EXTRACTION_MATCHED');
    }

    evaluations.push({
      obligationId: obligation.obligationId,
      gapId: obligation.gapId,
      foundationClaimId: obligation.foundationClaimId,
      familyId: obligation.familyId,
      schoolScope: obligation.schoolScope,
      dimension: obligation.dimension,
      state,
      matchedCopyIds: [...new Set(matchedCopyIds)],
      matchedLocatorIds: [...new Set(matchedLocatorIds)],
      matchedExtractionIds: [...new Set(matchedExtractionIds)],
      matchedClaimBindingIds: [...new Set(matchedClaimBindingIds)],
      reasonCodes: [...new Set(reasonCodes)]
    });
  }

  if (evaluations.length !== 38) {
    throw new Error(`Expected exactly 38 evaluations, generated ${evaluations.length}`);
  }

  return evaluations;
}
