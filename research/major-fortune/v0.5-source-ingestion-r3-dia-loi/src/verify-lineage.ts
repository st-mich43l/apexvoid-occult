import type {
  SourceLineageRecord,
  EvidenceScopeKey,
  EvidenceBearingWork,
  SourceIndependenceEntry,
  DiaLoiFamilyId,
  SchoolScope,
} from './types';

/**
 * Build lineage graph and check for cycles or transitive dependencies
 */
function isTransitivelyDependent(
  idA: string,
  idB: string,
  lineageRegistry: SourceLineageRecord[],
  visited: Set<string> = new Set()
): boolean {
  if (idA === idB) return true;
  if (visited.has(idA)) return false; // Cycle detected, but handled elsewhere
  visited.add(idA);

  const recordA = lineageRegistry.find(r => r.canonicalWorkId === idA);
  if (!recordA) return false;

  // Direct derivations
  for (const parentId of recordA.derivedFromCanonicalWorkIds) {
    if (parentId === idB) return true;
    if (isTransitivelyDependent(parentId, idB, lineageRegistry, new Set(visited))) return true;
  }
  
  // Translation
  if (recordA.translationOfCanonicalWorkId) {
    if (recordA.translationOfCanonicalWorkId === idB) return true;
    if (isTransitivelyDependent(recordA.translationOfCanonicalWorkId, idB, lineageRegistry, new Set(visited))) return true;
  }

  // Commentary
  for (const targetId of recordA.commentaryOnCanonicalWorkIds) {
    if (targetId === idB) return true;
    if (isTransitivelyDependent(targetId, idB, lineageRegistry, new Set(visited))) return true;
  }

  return false;
}

export function evaluateEvidenceScopedIndependence(
  scope: EvidenceScopeKey,
  evidenceBearingWorks: EvidenceBearingWork[],
  lineageRegistry: SourceLineageRecord[]
): SourceIndependenceEntry {
  const { familyId, schoolScope, claimId, dimension } = scope;
  const candidateCanonicalWorkIds: string[] = [];
  const independentCanonicalWorkIds: string[] = [];
  const blockerReasonCodes: string[] = [];
  const evidenceUsed: any[] = [];
  let propositionId: string | null = null;
  
  // 1. Filter works by scope
  const scopedWorks = evidenceBearingWorks.filter(w => 
    w.familyId === familyId &&
    w.schoolScope === schoolScope &&
    w.claimId === claimId
  );

  // Note: we might have multiple propositions. We need to group by propositionKey.
  // For crossSourceAgreement, we need agreement on the SAME proposition.
  
  // Group by propositionKey
  const byProp = new Map<string, EvidenceBearingWork[]>();
  for (const w of scopedWorks) {
    const list = byProp.get(w.propositionKey) || [];
    list.push(w);
    byProp.set(w.propositionKey, list);
  }

  // Find if there's any proposition that has independent agreement
  let bestStatus: SourceIndependenceEntry['status'] = 'insufficient';
  let bestWorks: EvidenceBearingWork[] = [];
  let bestIndepWorkIds: string[] = [];

  for (const [propKey, works] of byProp.entries()) {
    const workIds = [...new Set(works.map(w => w.canonicalWorkId))];
    candidateCanonicalWorkIds.push(...workIds);

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
      blockerReasonCodes.push(`UNKNOWN_LINEAGE_FOR_PROP:${propKey}`);
      if (bestStatus === 'insufficient') bestStatus = 'unknown';
      continue;
    }

    if (workIds.length < 2) {
      blockerReasonCodes.push(`INSUFFICIENT_WORKS_FOR_PROP:${propKey}`);
      continue;
    }

    // Pairwise check
    const pairs = getPairs(works);
    const independentPairs: Array<[EvidenceBearingWork, EvidenceBearingWork]> = [];
    let hasConflict = false;

    for (const [wa, wb] of pairs) {
      if (wa.canonicalWorkId === wb.canonicalWorkId) continue; // Same work

      const lineageA = lineageMap.get(wa.canonicalWorkId)!;
      const lineageB = lineageMap.get(wb.canonicalWorkId)!;

      const result = arePairIndependent(wa.canonicalWorkId, lineageA, wb.canonicalWorkId, lineageB, lineageRegistry);
      if (result.independent) {
        if (wa.supportPolarity === 'contradicts' || wb.supportPolarity === 'contradicts' || wa.supportPolarity !== wb.supportPolarity) {
          // If they are independent but have different polarities (e.g. one supports, one contradicts)
          // it's a conflict!
          if (wa.supportPolarity === 'contradicts' && wb.supportPolarity === 'contradicts') {
             // Both contradict - that's agreement on contradiction, which might be valid, but spec says independent-conflict if they materially disagree.
             // Actually, if they both contradict, they agree on contradiction. 
             // If one supports and one contradicts, they conflict.
          }
          if (wa.supportPolarity !== wb.supportPolarity && (wa.supportPolarity === 'contradicts' || wb.supportPolarity === 'contradicts')) {
            hasConflict = true;
            blockerReasonCodes.push(`CONFLICTED_DOCTRINE:${propKey}`);
          }
        }
        
        if (!hasConflict) {
           independentPairs.push([wa, wb]);
        }
      } else {
        blockerReasonCodes.push(...result.blockers);
      }
    }

    if (hasConflict) {
      bestStatus = 'independent-conflict';
      propositionId = propKey;
      // Gather all evidence
      for (const w of works) {
         evidenceUsed.push({
           canonicalWorkId: w.canonicalWorkId,
           copyIdentityIds: w.copyIdentityIds,
           locatorIds: w.locatorIds,
           extractionIds: w.extractionIds,
           lineageRecordId: lineageMap.get(w.canonicalWorkId)!.canonicalWorkId
         });
      }
      break; // Conflict overrides everything
    } else if (independentPairs.length > 0) {
      bestStatus = 'independent-agreement';
      propositionId = propKey;
      const indepSet = new Set<string>();
      for (const [wa, wb] of independentPairs) {
         indepSet.add(wa.canonicalWorkId);
         indepSet.add(wb.canonicalWorkId);
         bestWorks.push(wa, wb);
      }
      bestIndepWorkIds = [...indepSet];
      
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
      break;
    }
  }

  // Deduplicate
  const finalCandidates = [...new Set(candidateCanonicalWorkIds)];
  
  if (bestStatus === 'insufficient' && finalCandidates.length > 1) {
    // We had enough candidates, but no independent pairs
    bestStatus = 'dependent';
  }

  return {
    familyId,
    schoolScope,
    claimId,
    dimension,
    candidateCanonicalWorkIds: finalCandidates,
    evidenceBearingCanonicalWorkIds: [...new Set(bestWorks.map(w => w.canonicalWorkId))],
    independentCanonicalWorkIds: bestIndepWorkIds,
    propositionId,
    status: bestStatus,
    blockerReasonCodes: [...new Set(blockerReasonCodes)],
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
  if (isTransitivelyDependent(idA, idB, lineageRegistry)) {
    blockers.push(`A_TRANSITIVELY_DEPENDENT_ON_B:${idA}->${idB}`);
    return { independent: false, blockers };
  }
  if (isTransitivelyDependent(idB, idA, lineageRegistry)) {
    blockers.push(`B_TRANSITIVELY_DEPENDENT_ON_A:${idB}->${idA}`);
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
