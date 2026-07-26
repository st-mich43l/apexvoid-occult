import fs from 'fs';
import path from 'path';
import type { CandidateReadinessMatrixRecord, EvidenceGapMatrixRecord } from '../schema/foundation.js';
import crypto from 'crypto';
import { calculateCandidateReadiness } from './readiness.js';

let baseDir = process.cwd();

export function generateCandidateReadinessMatrix(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  
  const gapMatrixStr = fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8');
  const gapMatrix: EvidenceGapMatrixRecord[] = JSON.parse(gapMatrixStr);
  
  const matrix: CandidateReadinessMatrixRecord[] = [];
  
  for (const gapRec of gapMatrix) {
     const res = calculateCandidateReadiness(gapRec);
     matrix.push({
       signalFamilyId: gapRec.signalFamilyId,
       readiness: res.readiness,
       blockingDimensions: res.blockingDimensions
     });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2) + "\n";
  fs.writeFileSync(path.join(base, 'matrices/candidate-readiness-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/candidate-readiness-matrix.hash'), hash + "\n");
  console.log("Generated candidate readiness matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateCandidateReadinessMatrix();
}
