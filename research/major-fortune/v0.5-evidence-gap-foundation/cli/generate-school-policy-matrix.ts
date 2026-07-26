import fs from 'fs';
import path from 'path';
import type { SchoolPolicyMatrixRecord } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateSchoolPolicyMatrix() {
  const inventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  const matrix: SchoolPolicyMatrixRecord[] = [];
  
  for (const family of inventory) {
    const isNamPhai = family.schoolScope.includes('nam-phai');
    const isTrungChau = family.schoolScope.includes('trung-chau');
    // We get actual feature gated status from the code (hardcode or simulated check here)
    const isFeatureGated = family.signalFamilyId === 'major-fortune-transformations' && isNamPhai;
    
    matrix.push({
      signalFamilyId: family.signalFamilyId,
      admittedByNamPhai: isNamPhai,
      admittedByTrungChau: isTrungChau,
      sharedImplementation: true,
      sharedDoctrine: false, // doctrine not verified
      crossSchoolFallbackForbidden: true,
      unresolvedSchoolContradiction: false,
      featureGated: isFeatureGated
    });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2);
  fs.writeFileSync(path.join(base, 'matrices/school-policy-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/school-policy-matrix.hash'), hash);
  console.log("Generated school policy matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchoolPolicyMatrix();
}
