import { DiaLoiAdmissionAuthorization, DiaLoiClaimAdjudication, DiaLoiObligationEvaluation, DiaLoiFamilyId, SchoolScope, CrossSourceAgreementResult } from './types';

export function authorizeLanes(
  adjudications: DiaLoiClaimAdjudication[],
  obligations: DiaLoiObligationEvaluation[],
  independenceResults: CrossSourceAgreementResult[]
): DiaLoiAdmissionAuthorization[] {
  const authorizations: DiaLoiAdmissionAuthorization[] = [];
  const families: DiaLoiFamilyId[] = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const schools: SchoolScope[] = ['nam-phai', 'trung-chau'];

  for (const family of families) {
    for (const school of schools) {
      const familySchoolAdjudications = adjudications.filter(a => a.familyId === family && a.schoolScope === school);
      const familySchoolObligations = obligations.filter(o => o.familyId === family && o.schoolScope === school);
      const laneIndependenceResults = independenceResults.filter(i => i.familyId === family && i.schoolScope === school);
      const hasAgreement = laneIndependenceResults.some(i => i.status === 'agreement');
      const hasAny = laneIndependenceResults.length > 0;
      let authorizedStatus: 'source-verified-candidate' | 'blocked' = 'source-verified-candidate';
      const blockingReasonCodes: string[] = [];

      // Check obligations
      if (familySchoolObligations.length === 0) {
        authorizedStatus = 'blocked';
        blockingReasonCodes.push('MISSING_OBLIGATIONS');
      } else {
        const unverifiedObs = familySchoolObligations.filter(o => o.state !== 'verified');
        if (unverifiedObs.length > 0) {
          authorizedStatus = 'blocked';
          blockingReasonCodes.push('UNVERIFIED_OBLIGATIONS');

          for (const obs of unverifiedObs) {
            for (const rc of obs.reasonCodes) {
              if (rc === 'NO_EXTRACTION_MATCHED' || rc === 'NO_VERIFIED_EXTRACTION_FOR_DIMENSION' || rc === 'NO_MATCHING_EXTRACTION_FOR_DIMENSION') {
                blockingReasonCodes.push('NO_EXTRACTION_MATCHED');
              } else if (rc === 'REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE' || rc === 'EXPLICIT_MAJOR_FORTUNE_REQUIRED') {
                blockingReasonCodes.push('REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE');
              } else {
                blockingReasonCodes.push(rc);
              }
            }
          }
        }
      }

      // Check claims
      if (familySchoolAdjudications.length === 0) {
        authorizedStatus = 'blocked';
        blockingReasonCodes.push('MISSING_CLAIMS');
      } else {
        const invalidClaims = familySchoolAdjudications.filter(a => a.decision !== 'supported' && a.decision !== 'conditionally-supported');
        if (invalidClaims.length > 0) {
          authorizedStatus = 'blocked';
          blockingReasonCodes.push('CLAIMS_NOT_SUPPORTED');
        }
      }

      // Check independence if required
      if (hasAny && !hasAgreement) {
        authorizedStatus = 'blocked';
        blockingReasonCodes.push('INSUFFICIENT_INDEPENDENT_SOURCES');
      }

      authorizations.push({
        familyId: family,
        schoolScope: school,
        authorizedStatus,
        approvedSourceObligationIds: familySchoolObligations.filter(o => o.state === 'verified').map(o => o.obligationId),
        approvedClaimAdjudicationIds: familySchoolAdjudications.filter(a => a.decision === 'supported' || a.decision === 'conditionally-supported').map(a => a.adjudicationId),
        openContradictionIds: [],
        blockingReasonCodes: [...new Set(blockingReasonCodes)]
      });
    }
  }

  return authorizations;
}
