import type {
  SourceLineageRecord,
  VerifiedSourceCopy,
  SourceIndependenceEntry,
  DiaLoiFamilyId,
  SchoolScope,
} from './types';

/**
 * R3 Source Lineage Independence Model
 *
 * Rules enforced:
 * - Two editions of the same canonical work → NOT independent
 * - Two copies of the same edition → NOT independent
 * - Translation and original → NOT automatically independent (fail-closed)
 * - Abridgment/reprint/republication → NOT independent
 * - Commentary/derivative → NOT automatically independent
 * - Unknown lineage → fail closed (NOT independent)
 * - Different canonical-work IDs alone → NOT sufficient for independence
 *
 * Independence requires:
 * - At least 2 verified copies
 * - Each copy's canonical work has verified lineage status
 * - The canonical works are NOT in each other's derivedFrom, translation, or commentary chains
 * - The canonical works do NOT share the same authorshipLineageId
 * - The canonical works do NOT share the same editionFamilyId
 */
export function evaluateLineageIndependence(
  familyId: DiaLoiFamilyId,
  schoolScope: SchoolScope,
  verifiedCopies: VerifiedSourceCopy[],
  lineageRegistry: SourceLineageRecord[]
): SourceIndependenceEntry {
  const dimension = 'crossSourceAgreement';
  const claimId = null;
  const candidateCanonicalWorkIds: string[] = [];
  const independentCanonicalWorkIds: string[] = [];
  const blockerReasonCodes: string[] = [];
  const evidenceUsed: string[] = [];

  // Get verified copies for this lane
  const laneCopies = verifiedCopies.filter(
    c => c.schoolScope === schoolScope && c.inspectionStatus === 'verified'
  );

  if (laneCopies.length === 0) {
    return {
      familyId,
      schoolScope,
      dimension,
      claimId,
      candidateCanonicalWorkIds: [],
      independentCanonicalWorkIds: [],
      status: 'insufficient',
      blockerReasonCodes: ['NO_VERIFIED_COPIES'],
      evidenceUsed: [],
    };
  }

  // Collect unique canonical work IDs from verified copies
  const workIds = [...new Set(laneCopies.map(c => c.canonicalWorkId))];
  candidateCanonicalWorkIds.push(...workIds);

  // Look up lineage for each work
  const lineageMap = new Map<string, SourceLineageRecord>();
  for (const workId of workIds) {
    const record = lineageRegistry.find(r => r.canonicalWorkId === workId);
    if (record) {
      lineageMap.set(workId, record);
    }
  }

  // Check for unknown lineage — fail closed
  for (const workId of workIds) {
    const record = lineageMap.get(workId);
    if (!record || record.lineageStatus === 'unknown') {
      blockerReasonCodes.push(`UNKNOWN_LINEAGE:${workId}`);
    }
  }

  if (blockerReasonCodes.length > 0) {
    return {
      familyId,
      schoolScope,
      dimension,
      claimId,
      candidateCanonicalWorkIds,
      independentCanonicalWorkIds: [],
      status: 'unknown',
      blockerReasonCodes,
      evidenceUsed,
    };
  }

  // Need at least 2 distinct canonical works with verified lineage
  if (workIds.length < 2) {
    return {
      familyId,
      schoolScope,
      dimension,
      claimId,
      candidateCanonicalWorkIds,
      independentCanonicalWorkIds: [],
      status: 'insufficient',
      blockerReasonCodes: ['INSUFFICIENT_CANONICAL_WORKS'],
      evidenceUsed,
    };
  }

  // Pairwise independence check
  const pairs = getPairs(workIds);
  const verifiedIndependentPairs: Array<[string, string]> = [];

  for (const [a, b] of pairs) {
    const lineageA = lineageMap.get(a)!;
    const lineageB = lineageMap.get(b)!;
    const result = arePairIndependent(a, lineageA, b, lineageB);
    if (result.independent) {
      verifiedIndependentPairs.push([a, b]);
      evidenceUsed.push(...result.evidence);
    } else {
      blockerReasonCodes.push(...result.blockers);
    }
  }

  if (verifiedIndependentPairs.length === 0) {
    return {
      familyId,
      schoolScope,
      dimension,
      claimId,
      candidateCanonicalWorkIds,
      independentCanonicalWorkIds: [],
      status: 'dependent',
      blockerReasonCodes: [...new Set(blockerReasonCodes)],
      evidenceUsed,
    };
  }

  // Collect all works that appear in at least one independent pair
  const independentWorkSet = new Set<string>();
  for (const [a, b] of verifiedIndependentPairs) {
    independentWorkSet.add(a);
    independentWorkSet.add(b);
  }

  independentCanonicalWorkIds.push(...independentWorkSet);

  return {
    familyId,
    schoolScope,
    dimension,
    claimId,
    candidateCanonicalWorkIds,
    independentCanonicalWorkIds,
    status: 'independent',
    blockerReasonCodes: [],
    evidenceUsed: [...new Set(evidenceUsed)],
  };
}

function getPairs(ids: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i], ids[j]]);
    }
  }
  return pairs;
}

function arePairIndependent(
  idA: string,
  lineageA: SourceLineageRecord,
  idB: string,
  lineageB: SourceLineageRecord
): { independent: boolean; evidence: string[]; blockers: string[] } {
  const blockers: string[] = [];
  const evidence: string[] = [];

  // Same canonical work ID
  if (idA === idB) {
    blockers.push(`SAME_CANONICAL_WORK:${idA}`);
    return { independent: false, evidence, blockers };
  }

  // Same authorship lineage
  if (
    lineageA.authorshipLineageId !== null &&
    lineageA.authorshipLineageId === lineageB.authorshipLineageId
  ) {
    blockers.push(`SAME_AUTHORSHIP_LINEAGE:${lineageA.authorshipLineageId}`);
    return { independent: false, evidence, blockers };
  }

  // Same edition family
  if (
    lineageA.editionFamilyId !== null &&
    lineageA.editionFamilyId === lineageB.editionFamilyId
  ) {
    blockers.push(`SAME_EDITION_FAMILY:${lineageA.editionFamilyId}`);
    return { independent: false, evidence, blockers };
  }

  // A is derived from B or vice versa
  if (lineageA.derivedFromCanonicalWorkIds.includes(idB)) {
    blockers.push(`A_DERIVED_FROM_B:${idA}<-${idB}`);
    return { independent: false, evidence, blockers };
  }
  if (lineageB.derivedFromCanonicalWorkIds.includes(idA)) {
    blockers.push(`B_DERIVED_FROM_A:${idB}<-${idA}`);
    return { independent: false, evidence, blockers };
  }

  // A is translation of B or vice versa — fail closed unless explicitly established independent
  if (lineageA.translationOfCanonicalWorkId === idB) {
    blockers.push(`A_TRANSLATION_OF_B:${idA}->${idB}`);
    return { independent: false, evidence, blockers };
  }
  if (lineageB.translationOfCanonicalWorkId === idA) {
    blockers.push(`B_TRANSLATION_OF_A:${idB}->${idA}`);
    return { independent: false, evidence, blockers };
  }

  // A is commentary on B or vice versa
  if (lineageA.commentaryOnCanonicalWorkIds.includes(idB)) {
    blockers.push(`A_COMMENTARY_ON_B:${idA}->${idB}`);
    return { independent: false, evidence, blockers };
  }
  if (lineageB.commentaryOnCanonicalWorkIds.includes(idA)) {
    blockers.push(`B_COMMENTARY_ON_A:${idB}->${idA}`);
    return { independent: false, evidence, blockers };
  }

  // Same source tradition + unknown does not auto-grant independence
  if (
    lineageA.sourceTraditionId !== null &&
    lineageA.sourceTraditionId === lineageB.sourceTraditionId &&
    (lineageA.lineageStatus !== 'verified' || lineageB.lineageStatus !== 'verified')
  ) {
    blockers.push(`SAME_TRADITION_UNVERIFIED:${lineageA.sourceTraditionId}`);
    return { independent: false, evidence, blockers };
  }

  // Passed all checks
  evidence.push(`VERIFIED_LINEAGE:${idA}`);
  evidence.push(`VERIFIED_LINEAGE:${idB}`);

  return { independent: true, evidence, blockers };
}

/**
 * Generate the source independence report for all 4 lanes.
 */
export function generateSourceIndependenceReport(
  verifiedCopies: VerifiedSourceCopy[],
  lineageRegistry: SourceLineageRecord[]
): SourceIndependenceEntry[] {
  const families: DiaLoiFamilyId[] = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const schools: SchoolScope[] = ['nam-phai', 'trung-chau'];
  const entries: SourceIndependenceEntry[] = [];

  for (const familyId of families) {
    for (const schoolScope of schools) {
      entries.push(evaluateLineageIndependence(familyId, schoolScope, verifiedCopies, lineageRegistry));
    }
  }

  return entries;
}
