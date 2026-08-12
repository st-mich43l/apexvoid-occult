import type {
  SourceLineageRecord,
  EvidenceScopeKey,
  EvidenceBearingWork,
  SourceIndependenceEntry,
  DiaLoiFamilyId,
  SchoolScope,
} from './types';

interface PropositionIndependenceResult {
  propositionId: string;
  candidateCanonicalWorkIds: string[];
  independentCanonicalWorkIds: string[];
  status: 'agreement' | 'conflict' | 'dependent' | 'unknown' | 'insufficient';
  blockers: string[];
}

/**
 * Build lineage graph and check for cycles or transitive dependencies
 */
function isTransitivelyDependent(
  idA: string,
  idB: string,
  lineageRegistry: SourceLineageRecord[],
  path: string[] = []
): { dependent: boolean; cycle?: string } {
  if (idA === idB && path.length > 0) return { dependent: true };
  if (path.includes(idA)) {
    const cyclePath = [...path, idA].join('>');
    return { dependent: true, cycle: `LINEAGE_CYCLE:${cyclePath}` };
  }

  const currentPath = [...path, idA];

  const recordA = lineageRegistry.find(r => r.canonicalWorkId === idA);
  if (!recordA) return { dependent: false };

  // Direct derivations
  for (const parentId of recordA.derivedFromCanonicalWorkIds) {
    if (parentId === idB) return { dependent: true };
    const res = isTransitivelyDependent(parentId, idB, lineageRegistry, currentPath);
    if (res.dependent) return res;
  }

  // Translation
  if (recordA.translationOfCanonicalWorkId) {
    if (recordA.translationOfCanonicalWorkId === idB) return { dependent: true };
    const res = isTransitivelyDependent(recordA.translationOfCanonicalWorkId, idB, lineageRegistry, currentPath);
    if (res.dependent) return res;
  }

  // Commentary
  for (const targetId of recordA.commentaryOnCanonicalWorkIds) {
    if (targetId === idB) return { dependent: true };
    const res = isTransitivelyDependent(targetId, idB, lineageRegistry, currentPath);
    if (res.dependent) return res;
  }

  return { dependent: false };
}

export function evaluateEvidenceScopedIndependence(
  scope: EvidenceScopeKey,
  evidenceBearingWorks: EvidenceBearingWork[],
  lineageRegistry: SourceLineageRecord[]
): SourceIndependenceEntry {
  const { familyId, schoolScope, claimId, dimension } = scope;

  // 1. Filter works by scope
  const scopedWorks = evidenceBearingWorks.filter(w =>
    w.familyId === familyId &&
    w.schoolScope === schoolScope &&
    w.claimId === claimId
  );

  // Group by propositionKey
  const byProp = new Map<string, EvidenceBearingWork[]>();
  for (const w of scopedWorks) {
    const list = byProp.get(w.propositionKey) || [];
    list.push(w);
    byProp.set(w.propositionKey, list);
  }

  const propResults: PropositionIndependenceResult[] = [];
  const evidenceUsed: any[] = [];

  for (const [propKey, works] of byProp.entries()) {
    const workIds = [...new Set(works.map(w => w.canonicalWorkId))];

    const lineageMap = new Map<string, SourceLineageRecord>();
    let hasUnknown = false;
    for (const workId of workIds) {
      const record = lineageRegistry.find(r => r.canonicalWorkId === workId);
      if (record) {
        lineageMap.set(workId, record);
        if (record.lineageStatus === 'unknown') hasUnknown = true;
      } else {
        hasUnknown = true;
      }
    }

    if (hasUnknown) {
      propResults.push({
        propositionId: propKey,
        candidateCanonicalWorkIds: workIds,
        independentCanonicalWorkIds: [],
        status: 'unknown',
        blockers: [`UNKNOWN_LINEAGE_FOR_PROP:${propKey}`]
      });
      continue;
    }

    if (workIds.length < 2) {
      propResults.push({
        propositionId: propKey,
        candidateCanonicalWorkIds: workIds,
        independentCanonicalWorkIds: [],
        status: 'insufficient',
        blockers: [`INSUFFICIENT_WORKS_FOR_PROP:${propKey}`]
      });
      continue;
    }

    // Pairwise check
    const pairs = getPairs(works);
    const independentPairs: Array<[EvidenceBearingWork, EvidenceBearingWork]> = [];
    let hasConflict = false;
    const propBlockers: string[] = [];

    for (const [wa, wb] of pairs) {
      if (wa.canonicalWorkId === wb.canonicalWorkId) continue;

      const lineageA = lineageMap.get(wa.canonicalWorkId)!;
      const lineageB = lineageMap.get(wb.canonicalWorkId)!;

      const result = arePairIndependent(wa.canonicalWorkId, lineageA, wb.canonicalWorkId, lineageB, lineageRegistry);
      if (result.independent) {
        const p1 = wa.supportPolarity;
        const p2 = wb.supportPolarity;

        let pairConflict = false;
        if (p1 === 'supports' && p2 === 'contradicts') pairConflict = true;
        if (p1 === 'contradicts' && p2 === 'supports') pairConflict = true;

        if (pairConflict) {
          hasConflict = true;
          propBlockers.push(`CONFLICTED_DOCTRINE:${propKey}`);
        } else {
          independentPairs.push([wa, wb]);
        }
      } else {
        propBlockers.push(...result.blockers);
      }
    }

    if (hasConflict) {
      propResults.push({
        propositionId: propKey,
        candidateCanonicalWorkIds: workIds,
        independentCanonicalWorkIds: [],
        status: 'conflict',
        blockers: [...new Set(propBlockers)]
      });

      for (const w of works) {
         evidenceUsed.push({
           canonicalWorkId: w.canonicalWorkId,
           copyIdentityIds: w.copyIdentityIds,
           locatorIds: w.locatorIds,
           extractionIds: w.extractionIds,
           lineageRecordId: lineageMap.get(w.canonicalWorkId)!.canonicalWorkId
         });
      }
    } else if (independentPairs.length > 0) {
      const indepSet = new Set<string>();
      for (const [wa, wb] of independentPairs) {
         indepSet.add(wa.canonicalWorkId);
         indepSet.add(wb.canonicalWorkId);
      }
      propResults.push({
        propositionId: propKey,
        candidateCanonicalWorkIds: workIds,
        independentCanonicalWorkIds: [...indepSet],
        status: 'agreement',
        blockers: [...new Set(propBlockers)]
      });

      for (const w of works) {
         if (indepSet.has(w.canonicalWorkId)) {
           evidenceUsed.push({
             canonicalWorkId: w.canonicalWorkId,
             copyIdentityIds: w.copyIdentityIds,
             locatorIds: w.locatorIds,
             extractionIds: w.extractionIds,
             lineageRecordId: lineageMap.get(w.canonicalWorkId)!.canonicalWorkId
           });
         }
      }
    } else {
      propResults.push({
        propositionId: propKey,
        candidateCanonicalWorkIds: workIds,
        independentCanonicalWorkIds: [],
        status: 'dependent',
        blockers: [...new Set(propBlockers)]
      });
    }
  }

  // Aggregate results across all propositions
  let overallStatus: SourceIndependenceEntry['status'] = 'insufficient';
  let overallPropId: string | null = null;
  const overallCandidates = new Set<string>();
  const overallIndep = new Set<string>();
  const overallBlockers = new Set<string>();

  for (const pr of propResults) {
    pr.candidateCanonicalWorkIds.forEach(id => overallCandidates.add(id));
    pr.blockers.forEach(b => overallBlockers.add(b));
  }

  const conflicts = propResults.filter(pr => pr.status === 'conflict');
  const agreements = propResults.filter(pr => pr.status === 'agreement');
  const dependents = propResults.filter(pr => pr.status === 'dependent');
  const unknowns = propResults.filter(pr => pr.status === 'unknown');

  if (conflicts.length > 0) {
    overallStatus = 'independent-conflict';
    overallPropId = conflicts[0].propositionId;
  } else if (agreements.length > 0) {
    overallStatus = 'independent-agreement';
    overallPropId = agreements[0].propositionId;
    agreements.forEach(pr => pr.independentCanonicalWorkIds.forEach(id => overallIndep.add(id)));
  } else if (dependents.length > 0) {
    overallStatus = 'dependent';
  } else if (unknowns.length > 0) {
    overallStatus = 'unknown';
  }

  // Check for self-cycles early by scanning all candidate works
  for (const workId of overallCandidates) {
    const cycleCheck = isTransitivelyDependent(workId, workId, lineageRegistry, []);
    if (cycleCheck.cycle) {
      overallBlockers.add(cycleCheck.cycle);
      overallStatus = 'dependent'; // cycle means they can't be independent
    }
  }

  return {
    familyId,
    schoolScope,
    claimId,
    dimension,
    candidateCanonicalWorkIds: [...overallCandidates],
    evidenceBearingCanonicalWorkIds: [...overallCandidates],
    independentCanonicalWorkIds: [...overallIndep],
    propositionId: overallPropId,
    status: overallStatus,
    blockerReasonCodes: [...overallBlockers],
    evidence: evidenceUsed
  };
}

function getPairs<T>(items: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

function arePairIndependent(
  idA: string,
  lineageA: SourceLineageRecord,
  idB: string,
  lineageB: SourceLineageRecord,
  lineageRegistry: SourceLineageRecord[]
): { independent: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (idA === idB) {
    blockers.push(`SAME_CANONICAL_WORK:${idA}`);
    return { independent: false, blockers };
  }

  if (lineageA.authorshipLineageId && lineageA.authorshipLineageId === lineageB.authorshipLineageId) {
    blockers.push(`SAME_AUTHORSHIP_LINEAGE:${lineageA.authorshipLineageId}`);
    return { independent: false, blockers };
  }

  if (lineageA.editionFamilyId && lineageA.editionFamilyId === lineageB.editionFamilyId) {
    blockers.push(`SAME_EDITION_FAMILY:${lineageA.editionFamilyId}`);
    return { independent: false, blockers };
  }

  // Transitive checks
  const depAB = isTransitivelyDependent(idA, idB, lineageRegistry);
  if (depAB.dependent) {
    if (depAB.cycle) blockers.push(depAB.cycle);
    else blockers.push(`A_TRANSITIVELY_DEPENDENT_ON_B:${idA}->${idB}`);
    return { independent: false, blockers };
  }

  const depBA = isTransitivelyDependent(idB, idA, lineageRegistry);
  if (depBA.dependent) {
    if (depBA.cycle) blockers.push(depBA.cycle);
    else blockers.push(`B_TRANSITIVELY_DEPENDENT_ON_A:${idB}->${idA}`);
    return { independent: false, blockers };
  }

  if (
    lineageA.sourceTraditionId &&
    lineageA.sourceTraditionId === lineageB.sourceTraditionId &&
    (lineageA.lineageStatus !== 'verified' || lineageB.lineageStatus !== 'verified')
  ) {
    blockers.push(`SAME_TRADITION_UNVERIFIED:${lineageA.sourceTraditionId}`);
    return { independent: false, blockers };
  }

  return { independent: true, blockers };
}

/**
 * Generate the source independence report for all required scopes based on evidence.
 */
export function generateSourceIndependenceReport(
  evidenceBearingWorks: EvidenceBearingWork[],
  lineageRegistry: SourceLineageRecord[]
): SourceIndependenceEntry[] {
  const entries: SourceIndependenceEntry[] = [];

  // We need to evaluate independence for every distinct (family, school, claim) present in the evidence
  // and for dimension = 'crossSourceAgreement'

  const scopes = new Set<string>();
  for (const w of evidenceBearingWorks) {
    if (w.claimId) {
      scopes.add(`${w.familyId}|${w.schoolScope}|${w.claimId}`);
    }
  }

  // Also ensure we produce at least one entry per lane if no evidence exists, to satisfy downstream structure if needed
  const families: DiaLoiFamilyId[] = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const schools: SchoolScope[] = ['nam-phai', 'trung-chau'];

  for (const f of families) {
    for (const s of schools) {
      scopes.add(`${f}|${s}|null`); // Baseline fallback
    }
  }

  for (const scopeStr of scopes) {
    const [familyId, schoolScope, claimIdStr] = scopeStr.split('|') as [DiaLoiFamilyId, SchoolScope, string];
    const claimId = claimIdStr === 'null' ? null : claimIdStr;

    entries.push(
      evaluateEvidenceScopedIndependence(
        { familyId, schoolScope, claimId, dimension: 'crossSourceAgreement' },
        evidenceBearingWorks,
        lineageRegistry
      )
    );
  }

  return entries;
}
