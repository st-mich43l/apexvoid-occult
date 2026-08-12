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

      const laneIndependenceEntries = independenceEntries.filter(
        i => i.familyId === familyId && i.schoolScope === schoolScope
      );

      const primaryBlockingReasonCodes: string[] = [];
      const diagnosticReasonCodes: string[] = [];
      const approvedObligationIds: string[] = [];
      const approvedClaimAdjudicationIds: string[] = [];
      const approvedExtractionIds: string[] = [];
      const approvedVerifiedCopyIds: string[] = [];
      const approvedIndependentCanonicalWorkIds: string[] = [];

      // 1. Obligation check — lane-specific only
      const unverifiedObs = laneObligations.filter(o => o.status !== 'verified');
      const verifiedObs = laneObligations.filter(o => o.status === 'verified');

      if (laneObligations.length === 0) {
        diagnosticReasonCodes.push('MISSING_OBLIGATIONS');
      } else {
        approvedObligationIds.push(...verifiedObs.map(o => o.obligationId));

        for (const obs of unverifiedObs) {
          for (const rc of obs.reasonCodes) {
            diagnosticReasonCodes.push(rc);
            if (rc === 'NO_EXTRACTION_MATCHED') {
              addIfMissing(primaryBlockingReasonCodes, 'MISSING_ARTIFACTS');
            } else if (rc === 'MISSING_TEMPORAL_SCOPE' || rc === 'IMPLICIT_MF_SCOPE_NOT_SUFFICIENT') {
              addIfMissing(primaryBlockingReasonCodes, 'MISSING_TEMPORAL_SCOPE');
            } else if (rc === 'LACKS_CROSS_SOURCE_AGREEMENT' || rc === 'INSUFFICIENT_CANONICAL_WORKS' || rc === 'NO_VERIFIED_COPIES') {
              addIfMissing(primaryBlockingReasonCodes, 'INSUFFICIENT_INDEPENDENT_SOURCES');
            } else if (obs.status === 'contradicted') {
              addIfMissing(primaryBlockingReasonCodes, 'CONFLICTED_DOCTRINE');
            } else {
              addIfMissing(primaryBlockingReasonCodes, 'MISSING_PROVENANCE');
            }
          }
        }
      }

      // 2. Claim adjudication check
      if (laneAdjudications.length === 0) {
        diagnosticReasonCodes.push('MISSING_CLAIMS');
        addIfMissing(primaryBlockingReasonCodes, 'INCOMPLETE_ADJUDICATION');
      } else {
        const supported = laneAdjudications.filter(
          a => a.outcome === 'supported' || a.outcome === 'qualified'
        );
        const contradicted = laneAdjudications.filter(a => a.outcome === 'contradicted');

        if (contradicted.length > 0) {
          addIfMissing(primaryBlockingReasonCodes, 'CONFLICTED_DOCTRINE');
        } else if (supported.length === 0) {
          diagnosticReasonCodes.push('CLAIMS_NOT_SUPPORTED');
          addIfMissing(primaryBlockingReasonCodes, 'INCOMPLETE_ADJUDICATION');
        } else {
          approvedClaimAdjudicationIds.push(...supported.map(a => a.adjudicationId));
          for (const adj of supported) {
            approvedExtractionIds.push(...adj.supportingExtractionIds);
            approvedVerifiedCopyIds.push(...adj.verifiedSourceCopyIds);
          }
        }
      }

      // 3. Independence check — lane-specific
      let hasIndependentAgreement = false;
      let hasConflict = false;

      for (const entry of laneIndependenceEntries) {
        if (entry.status === 'independent-agreement') {
           hasIndependentAgreement = true;
           approvedIndependentCanonicalWorkIds.push(...entry.independentCanonicalWorkIds);
        } else if (entry.status === 'independent-conflict') {
           hasConflict = true;
        }
      }

      if (hasConflict) {
        addIfMissing(primaryBlockingReasonCodes, 'CONFLICTED_DOCTRINE');
      }
      // If we don't have at least one independent agreement, and it hasn't already been caught by obligations
      if (!hasIndependentAgreement && !hasConflict) {
        // Only mark it if we didn't already mark missing artifacts
        if (!primaryBlockingReasonCodes.includes('MISSING_ARTIFACTS')) {
            addIfMissing(primaryBlockingReasonCodes, 'INSUFFICIENT_INDEPENDENT_SOURCES');
        }
      }

      // Filter redundant less-specific blockers if we have a clearer one
      if (primaryBlockingReasonCodes.includes('MISSING_ARTIFACTS')) {
         // Clear all other primary blockers since this is a clean untouched lane
         primaryBlockingReasonCodes.splice(0, primaryBlockingReasonCodes.length, 'MISSING_ARTIFACTS');
      } else if (primaryBlockingReasonCodes.includes('CONFLICTED_DOCTRINE')) {
         // Keep others as diagnostic, but conflict dominates
         primaryBlockingReasonCodes.splice(0, primaryBlockingReasonCodes.length, 'CONFLICTED_DOCTRINE');
      }

      const isAuthorized = primaryBlockingReasonCodes.length === 0;

      return {
        familyId,
        schoolScope,
        authorizedStatus: isAuthorized ? 'source-verified-candidate' : 'blocked',
        approvedObligationIds: [...new Set(approvedObligationIds)],
        approvedClaimAdjudicationIds: [...new Set(approvedClaimAdjudicationIds)],
        approvedExtractionIds: [...new Set(approvedExtractionIds)],
        approvedVerifiedCopyIds: [...new Set(approvedVerifiedCopyIds)],
        approvedIndependentCanonicalWorkIds: [...new Set(approvedIndependentCanonicalWorkIds)],
        primaryBlockingReasonCodes: [...new Set(primaryBlockingReasonCodes)],
        diagnosticReasonCodes: [...new Set(diagnosticReasonCodes)],
      };
    })
  );
}

function addIfMissing(arr: string[], value: string): void {
  if (!arr.includes(value)) arr.push(value);
}
