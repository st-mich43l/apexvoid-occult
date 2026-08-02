import { DiaLoiObligationEvaluation, CanonicalDiaLoiSourceObligation, FoundationClaimBinding, VerifiedLocator, CrossSourceAgreementResult } from './types';
import { ValidatedExtraction } from './validate-extractions';

export function evaluateObligations(
  obligations: CanonicalDiaLoiSourceObligation[],
  extractions: ValidatedExtraction[],
  locators: VerifiedLocator[],
  bindings: FoundationClaimBinding[],
  independenceResults: CrossSourceAgreementResult[]
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
    const relevantBindings = bindings.filter(b => b.foundationClaimId === obligation.foundationClaimId && b.familyId === obligation.familyId && b.schoolScope === obligation.schoolScope);

    for (const b of relevantBindings) {
      matchedClaimBindingIds.push(b.bindingId);
    }

    if (obligation.foundationClaimId) {
      const verifiedBindings = relevantBindings.filter(b => b.evidenceStatus === 'verified');
      if (verifiedBindings.length === 0) {
        reasonCodes.push('MISSING_EVIDENCE_VERIFIED_BINDING');
      }
    }

    if (relevantExtractions.length > 0) {
      state = 'catalogued';
      let verifiedDimension = false;

      for (const ext of relevantExtractions) {
        if (!ext.isVerified) continue;

        if (ext.unsupportedDimensions.includes(obligation.dimension) || ext.inferredDimensions.includes(obligation.dimension)) {
          continue;
        }

        if (!ext.explicitStatementDimensions.includes(obligation.dimension)) {
          if (obligation.dimension !== 'sourceLocatorQuality' && obligation.dimension !== 'crossSourceAgreement' && obligation.dimension !== 'schoolScope') {
            continue;
          }
        }

        let satisfiesDimension = false;
        switch (obligation.dimension) {
          case 'existence':
            satisfiesDimension = true;
            break;
          case 'majorFortuneTemporalScope':
            if (ext.temporalScope === 'major-fortune') satisfiesDimension = true;
            else reasonCodes.push('EXPLICIT_MAJOR_FORTUNE_REQUIRED');
            break;
          case 'palaceFrame':
            if (ext.palaceFrame === 'active-major-fortune-palace') satisfiesDimension = true;
            else reasonCodes.push('EXPLICIT_ACTIVE_PALACE_FRAME_REQUIRED');
            break;
          case 'targetFrame':
            if (ext.targetFrame === 'opposite-palace' || ext.targetFrame === 'whole-axis') satisfiesDimension = true;
            else reasonCodes.push('TARGET_FRAME_REQUIRED');
            break;
          case 'polarity':
            if (['support', 'pressure', 'conditional', 'neutral'].includes(ext.polarity)) satisfiesDimension = true;
            else reasonCodes.push('EXPLICIT_POLARITY_REQUIRED');
            break;
          case 'strength':
            if (['weak', 'moderate', 'strong'].includes(ext.strength)) satisfiesDimension = true;
            else reasonCodes.push('EXPLICIT_STRENGTH_REQUIRED');
            break;
          case 'exceptionPolicy':
            // Support explicit exceptions found or explicitly verified no-exception statement
            if (ext.exceptionPolicy && ext.exceptionPolicy.length > 0) satisfiesDimension = true;
            else if (ext.explicitStatementDimensions.includes('exceptionPolicy')) satisfiesDimension = true; // explicitly verified no-exception
            else reasonCodes.push('EXPLICIT_EXCEPTION_POLICY_REQUIRED');
            break;
          case 'schoolScope':
            satisfiesDimension = true;
            break;
          case 'sourceLocatorQuality':
            const loc = locators.find(l => l.locatorId === ext.locatorId);
            if (loc && loc.verificationStatus === 'verified' && loc.pageImageHashes && loc.pageImageHashes.length > 0 && loc.verifiedBy && loc.verificationNotes && loc.verificationNotes.length > 0) {
              satisfiesDimension = true;
            } else {
              reasonCodes.push('INCOMPLETE_SOURCE_LOCATOR_QUALITY');
            }
            break;
          case 'crossSourceAgreement':
            // State must come exclusively from matching independence result
            break;
        }

        if (satisfiesDimension) {
          verifiedDimension = true;
          matchedExtractionIds.push(ext.extractionId);
          matchedLocatorIds.push(ext.locatorId);
          const loc = locators.find(l => l.locatorId === ext.locatorId);
          if (loc) matchedCopyIds.push(loc.copyIdentityId);
        }
      }

      if (obligation.dimension === 'crossSourceAgreement') {
        const indep = independenceResults.find(i =>
          i.familyId === obligation.familyId &&
          i.schoolScope === obligation.schoolScope &&
          i.dimension === obligation.dimension &&
          i.claimId === obligation.foundationClaimId // Or packClaimId, depending on how independence is generated
        );
        if (indep && indep.status === 'agreement') {
          verifiedDimension = true;
        } else {
          verifiedDimension = false;
          reasonCodes.push('LACKS_CROSS_SOURCE_AGREEMENT');
        }
      }

      // Check if we failed the binding requirement
      if (obligation.foundationClaimId && relevantBindings.filter(b => b.evidenceStatus === 'verified').length === 0) {
        verifiedDimension = false; // Cannot be verified without matching evidence-verified binding
      }

      if (verifiedDimension) state = 'verified';
      else if (!reasonCodes.length) reasonCodes.push('NO_MATCHING_EXTRACTION_FOR_DIMENSION');
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

  if (evaluations.length !== 38) throw new Error(`Expected exactly 38 evaluations, generated ${evaluations.length}`);

  return evaluations;
}
