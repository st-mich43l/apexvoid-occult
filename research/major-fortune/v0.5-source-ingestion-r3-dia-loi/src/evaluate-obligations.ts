import type {
  CanonicalDiaLoiSourceObligation,
  ValidatedExtraction,
  VerifiedLocator,
  FoundationClaimBinding,
  SourceIndependenceEntry,
  ObligationEvaluationResult,
} from './types';

const EXPECTED_COUNT = 38;

/**
 * Evaluate 38 canonical obligations against verified evidence.
 *
 * Status hierarchy:
 *   verified   — evidence satisfies the obligation
 *   contradicted — evidence explicitly contradicts
 *   blocked    — insufficient or missing evidence
 *   not-applicable — obligation not relevant to this lane
 *
 * Key rules:
 * - Only validatedExtractions with isValid === true contribute
 * - crossSourceAgreement dimension derives solely from independenceEntries
 * - Each dimension has specific satisfaction criteria
 * - majorFortuneTemporalScope requires 'explicit' (not 'implicit' or 'absent')
 */
export function evaluateObligations(
  obligations: CanonicalDiaLoiSourceObligation[],
  extractions: ValidatedExtraction[],
  locators: VerifiedLocator[],
  bindings: FoundationClaimBinding[],
  independenceEntries: SourceIndependenceEntry[]
): ObligationEvaluationResult[] {
  const evaluations: ObligationEvaluationResult[] = [];

  for (const obligation of obligations) {
    const reasonCodes: string[] = [];
    const supportingExtractionIds: string[] = [];
    const contradictingExtractionIds: string[] = [];
    const verifiedLocatorIds: string[] = [];
    const verifiedCopyIds: string[] = [];
    const independentCanonicalWorkIds: string[] = [];

    // Only valid extractions for this family/school
    const relevantExtractions = extractions.filter(
      e =>
        e.familyId === obligation.familyId &&
        e.schoolScope === obligation.schoolScope &&
        e.isValid
    );

    // Relevant bindings for this obligation
    const relevantBindings = bindings.filter(
      b =>
        b.foundationClaimId === obligation.foundationClaimId &&
        b.familyId === obligation.familyId &&
        b.schoolScope === obligation.schoolScope
    );

    // Check binding requirement
    if (obligation.foundationClaimId) {
      const evidenceVerifiedBindings = relevantBindings.filter(
        b => b.evidenceStatus === 'verified'
      );
      if (evidenceVerifiedBindings.length === 0) {
        reasonCodes.push('MISSING_EVIDENCE_VERIFIED_BINDING');
      }
    }

    // Handle crossSourceAgreement exclusively via independence result
    if (obligation.dimension === 'crossSourceAgreement') {
      const indep = independenceEntries.find(
        i => i.familyId === obligation.familyId && i.schoolScope === obligation.schoolScope
      );

      if (indep && indep.status === 'independent') {
        independentCanonicalWorkIds.push(...indep.independentCanonicalWorkIds);
        evaluations.push({
          obligationId: obligation.obligationId,
          gapId: obligation.gapId,
          familyId: obligation.familyId,
          schoolScope: obligation.schoolScope,
          dimension: obligation.dimension,
          status: 'verified',
          supportingExtractionIds: [],
          contradictingExtractionIds: [],
          verifiedLocatorIds: [],
          verifiedCopyIds: [],
          independentCanonicalWorkIds,
          reasonCodes: [],
        });
      } else {
        reasonCodes.push('LACKS_CROSS_SOURCE_AGREEMENT');
        if (!indep || indep.blockerReasonCodes.length > 0) {
          reasonCodes.push(...(indep?.blockerReasonCodes ?? ['NO_INDEPENDENCE_RESULT']));
        }
        evaluations.push({
          obligationId: obligation.obligationId,
          gapId: obligation.gapId,
          familyId: obligation.familyId,
          schoolScope: obligation.schoolScope,
          dimension: obligation.dimension,
          status: 'blocked',
          supportingExtractionIds: [],
          contradictingExtractionIds: [],
          verifiedLocatorIds: [],
          verifiedCopyIds: [],
          independentCanonicalWorkIds: [],
          reasonCodes: [...new Set(reasonCodes)],
        });
      }
      continue;
    }

    // For all other dimensions — evaluate from extractions
    if (relevantExtractions.length === 0) {
      reasonCodes.push('NO_EXTRACTION_MATCHED');
      evaluations.push({
        obligationId: obligation.obligationId,
        gapId: obligation.gapId,
        familyId: obligation.familyId,
        schoolScope: obligation.schoolScope,
        dimension: obligation.dimension,
        status: 'blocked',
        supportingExtractionIds: [],
        contradictingExtractionIds: [],
        verifiedLocatorIds: [],
        verifiedCopyIds: [],
        independentCanonicalWorkIds: [],
        reasonCodes: [...new Set(reasonCodes)],
      });
      continue;
    }

    let verified = false;
    let hasContradiction = false;

    for (const ext of relevantExtractions) {
      const satisfies = dimensionSatisfied(ext, obligation.dimension, locators);
      if (satisfies === 'satisfies') {
        supportingExtractionIds.push(ext.extractionId);
        // Add locator and copy to lists
        const loc = locators.find(l => l.locatorId === ext.locatorId);
        if (loc) {
          verifiedLocatorIds.push(loc.locatorId);
          verifiedCopyIds.push(loc.copyIdentityId);
        }
        verified = true;
      } else if (satisfies === 'contradicts') {
        contradictingExtractionIds.push(ext.extractionId);
        hasContradiction = true;
      } else {
        // Record dimension-specific blocker
        reasonCodes.push(...dimensionBlockers(ext, obligation.dimension, locators));
      }
    }

    // Binding check overrides verified if no evidence-verified binding
    if (
      obligation.foundationClaimId &&
      relevantBindings.filter(b => b.evidenceStatus === 'verified').length === 0
    ) {
      verified = false;
      if (!reasonCodes.includes('MISSING_EVIDENCE_VERIFIED_BINDING')) {
        reasonCodes.push('MISSING_EVIDENCE_VERIFIED_BINDING');
      }
    }

    let status: ObligationEvaluationResult['status'] = 'blocked';
    if (hasContradiction && !verified) {
      status = 'contradicted';
    } else if (verified) {
      status = 'verified';
    } else {
      if (reasonCodes.length === 0) {
        reasonCodes.push('NO_MATCHING_EXTRACTION_FOR_DIMENSION');
      }
    }

    evaluations.push({
      obligationId: obligation.obligationId,
      gapId: obligation.gapId,
      familyId: obligation.familyId,
      schoolScope: obligation.schoolScope,
      dimension: obligation.dimension,
      status,
      supportingExtractionIds: [...new Set(supportingExtractionIds)],
      contradictingExtractionIds: [...new Set(contradictingExtractionIds)],
      verifiedLocatorIds: [...new Set(verifiedLocatorIds)],
      verifiedCopyIds: [...new Set(verifiedCopyIds)],
      independentCanonicalWorkIds: [],
      reasonCodes: [...new Set(reasonCodes)],
    });
  }

  if (evaluations.length !== EXPECTED_COUNT) {
    throw new Error(`Expected exactly ${EXPECTED_COUNT} obligation evaluations, got ${evaluations.length}`);
  }

  return evaluations;
}

type DimensionSatisfied = 'satisfies' | 'contradicts' | 'blocked';

function dimensionSatisfied(
  ext: ValidatedExtraction,
  dimension: string,
  locators: VerifiedLocator[]
): DimensionSatisfied {
  switch (dimension) {
    case 'existence':
      return ext.polarity === 'supports' ? 'satisfies' :
             ext.polarity === 'contradicts' ? 'contradicts' : 'blocked';

    case 'majorFortuneTemporalScope':
      if (ext.majorFortuneTemporalScope === 'explicit') return 'satisfies';
      if (ext.polarity === 'contradicts') return 'contradicts';
      return 'blocked';

    case 'schoolScope':
      // Satisfied if the extraction is for the correct school
      return 'satisfies';

    case 'polarity':
      return ext.polarity === 'supports' || ext.polarity === 'qualifies' ? 'satisfies' :
             ext.polarity === 'contradicts' ? 'contradicts' : 'blocked';

    case 'palaceFrame':
    case 'targetFrame':
    case 'strength':
    case 'exceptionPolicy':
      // These require explicit statement in the dimensions list
      if (ext.explicitStatementDimensions.includes(dimension as any)) {
        return ext.polarity === 'contradicts' ? 'contradicts' : 'satisfies';
      }
      return 'blocked';

    case 'sourceLocatorQuality': {
      const loc = locators.find(l => l.locatorId === ext.locatorId);
      if (
        loc &&
        loc.verificationStatus === 'verified' &&
        loc.inspectedPageHashes.length > 0
      ) {
        return 'satisfies';
      }
      return 'blocked';
    }

    default:
      return 'blocked';
  }
}

function dimensionBlockers(
  ext: ValidatedExtraction,
  dimension: string,
  locators: VerifiedLocator[]
): string[] {
  switch (dimension) {
    case 'majorFortuneTemporalScope':
      if (ext.majorFortuneTemporalScope === 'implicit') return ['IMPLICIT_MF_SCOPE_NOT_SUFFICIENT'];
      if (ext.majorFortuneTemporalScope === 'absent') return ['MISSING_TEMPORAL_SCOPE'];
      return ['EXPLICIT_MAJOR_FORTUNE_REQUIRED'];
    case 'palaceFrame':
      return ['EXPLICIT_PALACE_FRAME_REQUIRED'];
    case 'targetFrame':
      return ['TARGET_FRAME_NOT_STATED'];
    case 'strength':
      return ['EXPLICIT_STRENGTH_REQUIRED'];
    case 'exceptionPolicy':
      return ['EXCEPTION_POLICY_NOT_STATED'];
    case 'sourceLocatorQuality': {
      const loc = locators.find(l => l.locatorId === ext.locatorId);
      if (!loc) return ['LOCATOR_NOT_FOUND'];
      if (loc.verificationStatus !== 'verified') return ['LOCATOR_NOT_VERIFIED'];
      if (loc.inspectedPageHashes.length === 0) return ['NO_INSPECTED_PAGE_HASHES'];
      return ['INCOMPLETE_LOCATOR_QUALITY'];
    }
    default:
      return [`DIMENSION_NOT_SATISFIED:${dimension}`];
  }
}
