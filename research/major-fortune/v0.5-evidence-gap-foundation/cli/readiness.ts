import type { EvidenceGapMatrixRecord, CandidateEligibilityStatus, EvidenceDimension } from '../schema/foundation.js';

export function calculateCandidateReadiness(mat: EvidenceGapMatrixRecord): { readiness: CandidateEligibilityStatus; blockingDimensions: string[] } {
  const mandatory = [
    { k: 'existence', d: mat.existence },
    { k: 'schoolScope', d: mat.schoolScope },
    { k: 'majorFortuneTemporalScope', d: mat.majorFortuneTemporalScope },
    { k: 'palaceFrame', d: mat.palaceFrame },
    { k: 'targetFrame', d: mat.targetFrame },
    { k: 'polarity', d: mat.polarity },
    { k: 'strength', d: mat.strength },
    { k: 'pillarOwnership', d: mat.pillarOwnership },
    { k: 'stacking', d: mat.stacking },
    { k: 'deduplication', d: mat.deduplication },
    { k: 'exceptionPolicy', d: mat.exceptionPolicy },
    { k: 'calculationCoreReadiness', d: mat.calculationCoreReadiness },
    { k: 'sourceLocatorQuality', d: mat.sourceLocatorQuality },
    { k: 'corpusMeasurability', d: mat.corpusMeasurability }
  ];

  const blockingDimensions: string[] = [];

  for (const { k, d } of mandatory) {
    // If it's undefined, it's not applicable for this family (e.g. targetFrame for non-transformations)
    if (!d) continue;

    const allowed = ['verified', 'not-applicable'];
    
    // Engineering-only polarity must block candidate eligibility.
    // Allow engineering-only for strength, deduplication if applicable, but not polarity.
    if (['strength', 'deduplication'].includes(k)) {
       allowed.push('engineering-only');
    }

    if (!allowed.includes(d.status)) {
      blockingDimensions.push(k);
    }
  }

  const hasContradiction = mandatory.some(m => m.d?.status === 'contradicted');
  if (hasContradiction) {
    return { readiness: 'contradicted', blockingDimensions };
  }

  const ccBlocked = mat.calculationCoreReadiness.status === 'missing' || mat.calculationCoreReadiness.status === 'blocked-by-calculation-core';
  if (ccBlocked) {
    return { readiness: 'blocked-by-calculation-core', blockingDimensions };
  }

  if (blockingDimensions.length > 0) {
    return { readiness: 'research-blocked', blockingDimensions };
  }

  return { readiness: 'eligible-for-shape-design', blockingDimensions };
}
