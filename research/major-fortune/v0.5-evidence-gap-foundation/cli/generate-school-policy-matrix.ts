import fs from 'fs';
import path from 'path';
import type { SchoolPolicyMatrixRecord, ContradictionLog } from '../schema/foundation.js';
import crypto from 'crypto';

let baseDir = process.cwd();

export function generateSchoolPolicyMatrix(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  const inventoryPath = path.join(base, 'inventory/runtime-signal-inventory.json');
  const backlogPath = path.join(base, 'inventory/research-backlog-registry.json');
  
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));
  
  const matrix: SchoolPolicyMatrixRecord[] = [];
  const allFamilies = [...inventory, ...backlog];
  
  // A simplistic mock for reading feature flag logic since the file uses environment vars
  const isNamPhaiTransGated = true; 
  
  // Note: we check if schoolScope explicitly contains the school
  for (const family of allFamilies) {
    const isProduction = family.runtimeStatus === 'production-enabled' || family.runtimeStatus === 'production-blocked-on-evidence' || family.runtimeStatus === 'production-blocked-on-calculation-core';
    
    let npAdmit = false;
    let tcAdmit = false;
    let npGated = false;
    let tcGated = false;
    let crossSchoolForbidden = true;

    // Derived logic
    const scopes = family.schoolScope || [];
    if (scopes.includes('nam-phai')) npAdmit = true;
    if (scopes.includes('trung-chau')) tcAdmit = true;
    
    if (family.signalFamilyId === 'major-fortune-transformations') {
       npGated = isNamPhaiTransGated;
    }

    matrix.push({
      signalFamilyId: family.signalFamilyId,
      runtimeAdmittedByNamPhai: npAdmit && isProduction,
      runtimeAdmittedByTrungChau: tcAdmit && isProduction,
      featureGatedByNamPhai: npGated,
      featureGatedByTrungChau: tcGated,
      researchAdmittedByNamPhai: npAdmit,
      researchAdmittedByTrungChau: tcAdmit,
      doctrineVerifiedByNamPhai: family.doctrineStatus === 'verified' && npAdmit,
      doctrineVerifiedByTrungChau: family.doctrineStatus === 'verified' && tcAdmit,
      sharedImplementation: isProduction && npAdmit && tcAdmit,
      sharedCalculationFacts: npAdmit && tcAdmit,
      sharedDoctrine: family.doctrineStatus === 'verified' && npAdmit && tcAdmit,
      crossSchoolFallbackForbidden: crossSchoolForbidden,
      unresolvedSchoolContradictions: family.schoolScope === 'unresolved' || scopes.length === 0 || family.doctrineStatus === 'school-specific-unresolved'
    });
  }
  
  if (!fs.existsSync(path.join(base, 'matrices'))) fs.mkdirSync(path.join(base, 'matrices'), { recursive: true });
  
  const outStr = JSON.stringify(matrix, null, 2) + "\n";
  fs.writeFileSync(path.join(base, 'matrices/school-policy-matrix.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'matrices/school-policy-matrix.hash'), hash + "\n");
  console.log("Generated school policy matrix.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchoolPolicyMatrix();
}
