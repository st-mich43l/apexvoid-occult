import fs from 'fs';
import path from 'path';
import type { CandidateReadinessMatrixRecord, EvidenceGapMatrixRecord } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateCandidateReadinessMatrix() {
  const gapMatrix: EvidenceGapMatrixRecord[] = JSON.parse(fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8'));
  const matrix: CandidateReadinessMatrixRecord[] = [];
  
  for (const family of gapMatrix) {
    const blockingDims: string[] = [];
    
    // Check all mandatory dimensions
    const mandatory = [
      { k: 'existence', v: family.existence.status },
      { k: 'schoolScope', v: family.schoolScope.status },
      { k: 'majorFortuneTemporalScope', v: family.majorFortuneTemporalScope.status },
      { k: 'palaceFrame', v: family.palaceFrame.status },
      { k: 'polarity', v: family.polarity.status },
      { k: 'pillarOwnership', v: family.pillarOwnership.status },
      { k: 'stacking', v: family.stacking.status },
      { k: 'deduplication', v: family.deduplication.status },
      { k: 'exceptionPolicy', v: family.exceptionPolicy.status },
      { k: 'calculationCoreReadiness', v: family.calculationCoreReadiness.status },
      { k: 'sourceLocatorQuality', v: family.sourceLocatorQuality.status },
      { k: 'corpusMeasurability', v: family.corpusMeasurability.status },
    ];
    
    for (const d of mandatory) {
      const allowed = ['verified', 'not-applicable'];
      if (['polarity', 'strength', 'deduplication'].includes(d.k)) allowed.push('engineering-only');
      if (!allowed.includes(d.v)) {
        blockingDims.push(d.k);
      }
    }
    
    let readiness: CandidateReadinessMatrixRecord["readiness"];
    if (family.calculationCoreReadiness.status === 'missing' || family.calculationCoreReadiness.status === 'blocked-by-calculation-core') {
       readiness = "blocked-by-calculation-core";
    } else if (blockingDims.length > 0) {
       readiness = "research-blocked";
    } else {
       readiness = "eligible-for-shape-design";
    }
    
    matrix.push({
      signalFamilyId: family.signalFamilyId,
      readiness,
      blockingDimensions: blockingDims
    });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2);
  fs.writeFileSync(path.join(base, 'matrices/candidate-readiness-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/candidate-readiness-matrix.hash'), hash);
  console.log("Generated candidate readiness matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateCandidateReadinessMatrix();
}
