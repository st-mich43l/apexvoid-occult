import fs from 'fs';
import path from 'path';
import type { CandidateReadinessMatrixRecord } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateCandidateReadinessMatrix() {
  const gapMatrix = JSON.parse(fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8'));
  const matrix: CandidateReadinessMatrixRecord[] = [];
  
  for (const row of gapMatrix) {
    const blocking = [];
    if (row.schoolDoctrine.status !== "verified" && row.schoolDoctrine.status !== "not-applicable") {
      blocking.push("schoolDoctrine");
    }
    if (row.polarityAgreement.status !== "verified" && row.polarityAgreement.status !== "not-applicable") {
      blocking.push("polarityAgreement");
    }
    if (row.frameConsistency.status !== "verified" && row.frameConsistency.status !== "not-applicable") {
       blocking.push("frameConsistency");
    }
    if (row.calculationCoreReadiness.status !== "verified") {
       blocking.push("calculationCoreReadiness");
    }
    
    let readiness: "ready" | "research-blocked" | "blocked-by-calculation-core" = "ready";
    if (blocking.length > 0) {
      if (blocking.includes("calculationCoreReadiness")) {
         readiness = "blocked-by-calculation-core";
      } else {
         readiness = "research-blocked";
      }
    }
    
    matrix.push({
      signalFamilyId: row.signalFamilyId,
      readiness,
      blockingDimensions: blocking
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
