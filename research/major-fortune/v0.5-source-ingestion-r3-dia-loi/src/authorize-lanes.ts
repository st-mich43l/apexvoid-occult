import type {
  LaneAuthorization,
  ClaimAdjudicationResult,
  ObligationEvaluationResult,
  SourceIndependenceEntry,
  DiaLoiFamilyId,
  SchoolScope,
} from './types';

const FAMILIES: DiaLoiFamilyId[] = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
const SCHOOLS: SchoolScope[] = ['nam-phai', 'trung-chau'];

/**
 * Authorize lanes independently.
 *
 * Rules:
 * - Each lane is evaluated independently from ALL other lanes
 * - Nam Phái evidence does NOT authorize Trung Châu
 * - Dignity evidence does NOT authorize VCD
 * - A lane requires ALL its obligations verified to be authorized
 * - A lane requires at least one supported/qualified adjudication
 * - A lane requires independence: 'independent' status for its school/family
 * - Blocker precedence within a lane:
 *     NO_EXTRACTION_MATCHED → MISSING_ARTIFACTS
 *     MISSING_TEMPORAL_SCOPE → MISSING_TEMPORAL_SCOPE
 *     LACKS_CROSS_SOURCE_AGREEMENT → INSUFFICIENT_INDEPENDENT_SOURCES
 *     CONTRADICTED → CONFLICTED_DOCTRINE
 */
export function authorizeLanes(
  adjudications: ClaimAdjudicationResult[],
  obligations: ObligationEvaluationResult[],
  independenceEntries: SourceIndependenceEntry[]
): LaneAuthorization[] {
  return FAMILIES.flatMap(familyId =>
    SCHOOLS.map(schoolScope => {
      const laneObligations = obligations.filter(
        o => o.familyId === familyId && o.schoolScope === schoolScope
      );

      const laneAdjudications = adjudications.filter(
        a => a.familyId === familyId && a.schoolScope === schoolScope
      );

      const laneIndependence = independenceEntries.find(
        i => i.familyId === familyId && i.schoolScope === schoolScope
      );

      const blockingReasonCodes: string[] = [];
      const approvedObligationIds: string[] = [];
      const approvedClaimAdjudicationIds: string[] = [];
      const approvedExtractionIds: string[] = [];
      const approvedVerifiedCopyIds: string[] = [];
      const approvedIndependentCanonicalWorkIds: string[] = [];

      // 1. Obligation check — lane-specific only
      const unverifiedObs = laneObligations.filter(o => o.status !== 'verified');
      const verifiedObs = laneObligations.filter(o => o.status === 'verified');

      if (laneObligations.length === 0) {
        blockingReasonCodes.push('MISSING_OBLIGATIONS');
      } else {
        approvedObligationIds.push(...verifiedObs.map(o => o.obligationId));

        for (const obs of unverifiedObs) {
          // Translate obligation reason codes to blocker categories
          for (const rc of obs.reasonCodes) {
            if (rc === 'NO_EXTRACTION_MATCHED') {
              addIfMissing(blockingReasonCodes, 'NO_EXTRACTION_MATCHED');
            } else if (rc === 'MISSING_TEMPORAL_SCOPE' || rc === 'IMPLICIT_MF_SCOPE_NOT_SUFFICIENT') {
              addIfMissing(blockingReasonCodes, 'MISSING_TEMPORAL_SCOPE');
            } else if (rc === 'LACKS_CROSS_SOURCE_AGREEMENT' || rc === 'INSUFFICIENT_CANONICAL_WORKS' || rc === 'NO_VERIFIED_COPIES') {
              addIfMissing(blockingReasonCodes, 'INSUFFICIENT_INDEPENDENT_SOURCES');
            } else if (obs.status === 'contradicted') {
              addIfMissing(blockingReasonCodes, 'CONFLICTED_DOCTRINE');
            } else {
              addIfMissing(blockingReasonCodes, 'UNVERIFIED_OBLIGATIONS');
            }
          }
        }
      }

      // 2. Claim adjudication check
      if (laneAdjudications.length === 0) {
        addIfMissing(blockingReasonCodes, 'MISSING_CLAIMS');
      } else {
        const supported = laneAdjudications.filter(
          a => a.outcome === 'supported' || a.outcome === 'qualified'
        );
        const contradicted = laneAdjudications.filter(a => a.outcome === 'contradicted');

        if (contradicted.length > 0) {
          addIfMissing(blockingReasonCodes, 'CONFLICTED_DOCTRINE');
        } else if (supported.length === 0) {
          addIfMissing(blockingReasonCodes, 'CLAIMS_NOT_SUPPORTED');
        } else {
          approvedClaimAdjudicationIds.push(...supported.map(a => a.adjudicationId));
          for (const adj of supported) {
            approvedExtractionIds.push(...adj.supportingExtractionIds);
            approvedVerifiedCopyIds.push(...adj.verifiedSourceCopyIds);
          }
        }
      }

      // 3. Independence check — lane-specific
      if (!laneIndependence || laneIndependence.status !== 'independent') {
        addIfMissing(blockingReasonCodes, 'INSUFFICIENT_INDEPENDENT_SOURCES');
      } else {
        approvedIndependentCanonicalWorkIds.push(...laneIndependence.independentCanonicalWorkIds);
      }

      const isAuthorized = blockingReasonCodes.length === 0;

      return {
        familyId,
        schoolScope,
        authorizedStatus: isAuthorized ? 'source-verified-candidate' : 'blocked',
        approvedObligationIds: [...new Set(approvedObligationIds)],
        approvedClaimAdjudicationIds: [...new Set(approvedClaimAdjudicationIds)],
        approvedExtractionIds: [...new Set(approvedExtractionIds)],
        approvedVerifiedCopyIds: [...new Set(approvedVerifiedCopyIds)],
        approvedIndependentCanonicalWorkIds: [...new Set(approvedIndependentCanonicalWorkIds)],
        blockingReasonCodes: [...new Set(blockingReasonCodes)],
      };
    })
  );
}

function addIfMissing(arr: string[], value: string): void {
  if (!arr.includes(value)) arr.push(value);
}
