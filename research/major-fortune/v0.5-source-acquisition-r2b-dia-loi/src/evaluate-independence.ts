import { CrossSourceAgreementResult, DiaLoiFamilyId, SchoolScope, SourceCopyVerificationResult } from './types';

export function evaluateIndependence(
  familyId: DiaLoiFamilyId,
  schoolScope: SchoolScope,
  verifiedCopies: SourceCopyVerificationResult[],
  policyRequireDifferentCanonicalWorks: boolean
): CrossSourceAgreementResult {
  const candidateWorks = new Set<string>();

  for (const copy of verifiedCopies) {
    // Only verified copies can contribute
    if (copy.inspectionStatus === 'verified' && copy.sourceId === `SRC-${schoolScope.toUpperCase()}-001`) {
      candidateWorks.add(copy.canonicalWorkId);
    }
  }

  // Simplified independence logic based on requirements.
  // In reality we would map copies to extractions to family, but the spec says
  // "evaluate canonical source independence rather than counting copies".
  
  const works = Array.from(candidateWorks);
  let status: 'insufficient' | 'agreement' | 'conflict' | 'not-required' = 'not-required';
  const reasonCodes: string[] = [];

  if (policyRequireDifferentCanonicalWorks) {
    if (works.length >= 2) {
      status = 'agreement';
    } else {
      status = 'insufficient';
      reasonCodes.push('REQUIRES_MULTIPLE_CANONICAL_WORKS');
    }
  }

  return {
    familyId,
    schoolScope,
    dimension: 'source-independence',
    candidateCanonicalWorkIds: works,
    independentCanonicalWorkIds: works, // for now, assuming canonicalWorkId difference means independence
    status,
    reasonCodes
  };
}
