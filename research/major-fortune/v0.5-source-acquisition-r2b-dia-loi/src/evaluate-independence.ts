import { CrossSourceAgreementResult, DiaLoiFamilyId, SchoolScope, VerifiedSourceCopy, VerifiedLocator } from './types';
import { ValidatedExtraction } from './validate-extractions';
import fs from 'fs';
import path from 'path';

export function evaluateIndependence(
  familyId: DiaLoiFamilyId,
  schoolScope: SchoolScope,
  dimension: string,
  claimId: string,
  extractions: ValidatedExtraction[],
  locators: VerifiedLocator[],
  verifiedCopies: VerifiedSourceCopy[]
): CrossSourceAgreementResult {
  const policyPath = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi/config/independence-policy.json');
  let policyRequireDifferentCanonicalWorks = true;
  if (fs.existsSync(policyPath)) {
    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    policyRequireDifferentCanonicalWorks = policy.requireDifferentCanonicalWorks;
  }

  const candidateWorks = new Set<string>();
  const independentWorks = new Set<string>();
  const allPropositions = new Set<string>();
  
  // Filter for matching family, school, dimension, and claim
  const matchingExtractions = extractions.filter(e => 
    e.familyId === familyId && 
    e.schoolScope === schoolScope && 
    e.claimId === claimId &&
    e.isVerified &&
    e.explicitStatementDimensions.includes(dimension)
  );

  for (const ext of matchingExtractions) {
    const loc = locators.find(l => l.locatorId === ext.locatorId);
    if (!loc) continue;

    const copy = verifiedCopies.find(c => c.copyIdentityId === loc.copyIdentityId);
    if (!copy || copy.inspectionStatus !== 'verified') continue;

    candidateWorks.add(copy.canonicalWorkId);
    independentWorks.add(copy.canonicalWorkId);
    allPropositions.add(ext.propositionParaphrase); // In a real system, we'd check polarity/strength etc., but we use proposition string for now or explicit contradictory extraction logic.
  }

  let status: 'insufficient' | 'agreement' | 'conflict' | 'not-required' = 'not-required';
  const reasonCodes: string[] = [];

  const candidateWorksArray = Array.from(candidateWorks);
  const independentWorksArray = Array.from(independentWorks);

  // Detect conflict
  // We'll consider it a conflict if the same claim for the same dimension has fundamentally conflicting extractions, 
  // but "conflicting propositions produce conflict" requires an explicit contradiction manifest, which we'll handle in adjudication.
  // For independence itself, if there are multiple canonical works, we call it agreement (if no contradiction, assuming they support the claim).

  if (policyRequireDifferentCanonicalWorks) {
    if (independentWorksArray.length >= 2) {
      status = 'agreement';
    } else {
      status = 'insufficient';
      reasonCodes.push('REQUIRES_MULTIPLE_CANONICAL_WORKS');
    }
  }

  return {
    familyId,
    schoolScope,
    dimension,
    claimId,
    candidateCanonicalWorkIds: candidateWorksArray,
    independentCanonicalWorkIds: independentWorksArray,
    status,
    reasonCodes
  };
}
