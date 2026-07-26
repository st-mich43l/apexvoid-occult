import fs from 'fs';
import path from 'path';
import type { SchoolPolicyMatrixRecord } from '../schema/foundation.js';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateSchoolPolicyMatrix() {
  const inventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  const matrix: SchoolPolicyMatrixRecord[] = [];
  
  for (const family of inventory) {
    const isProduction = family.runtimeStatus === 'production-enabled';
    
    // Explicit derivation rather than shared defaults
    let npAdmit = false;
    let tcAdmit = false;
    let npGated = false;
    let tcGated = false;
    let crossSchoolForbidden = true;

    if (family.signalFamilyId === 'major-fortune-transformations') {
      npAdmit = true;
      tcAdmit = true;
      npGated = true; // explicitly feature gated by isMajorFortuneV04NamPhaiTransformationsEnabled
    } else if (family.signalFamilyId === 'severe-pressure-evidence') {
      tcAdmit = true;
    } else if (isProduction) {
      // By default production families are admitted by both if schoolScope contains both
      if (family.schoolScope.includes('nam-phai')) npAdmit = true;
      if (family.schoolScope.includes('trung-chau')) tcAdmit = true;
      crossSchoolForbidden = true; // typical production strictness
    }

    matrix.push({
      signalFamilyId: family.signalFamilyId,
      runtimeAdmittedByNamPhai: npAdmit && isProduction,
      runtimeAdmittedByTrungChau: tcAdmit && isProduction,
      featureGatedByNamPhai: npGated,
      featureGatedByTrungChau: tcGated,
      researchAdmittedByNamPhai: npAdmit,
      researchAdmittedByTrungChau: tcAdmit,
      doctrineVerifiedByNamPhai: false, // all V0.5 doctrines are unverified gap state
      doctrineVerifiedByTrungChau: false,
      sharedImplementation: isProduction && npAdmit && tcAdmit,
      sharedCalculationFacts: npAdmit && tcAdmit,
      sharedDoctrine: false, // doctrine gap
      crossSchoolFallbackForbidden: crossSchoolForbidden,
      unresolvedSchoolContradictions: family.schoolScope === 'unresolved' || family.schoolScope.length === 0
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
