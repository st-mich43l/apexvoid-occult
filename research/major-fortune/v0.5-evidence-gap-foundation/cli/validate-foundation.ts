import fs from 'fs';
import path from 'path';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function loadJson(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) throw new Error(`Missing ${relPath}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function validateFoundation(mocks?: any) {
  const inventory = mocks?.inventory || loadJson('inventory/signal-inventory.json');
  const reconciliation = mocks?.reconciliation || loadJson('inventory/provenance-reconciliation.json');
  const schoolPolicy = mocks?.schoolPolicy || loadJson('matrices/school-policy-matrix.json');
  const ctr = mocks?.ctr || loadJson('contradictions/contradiction-log.json');
  
  const requiredProductionFamilies = [
    "element-relation",
    "principal-star-dignity",
    "support-pressure-auxiliary-sets",
    "major-fortune-transformations"
  ];
  
  // 1. Missing production families
  for (const fam of requiredProductionFamilies) {
    if (!inventory.some((i: any) => i.signalFamilyId === fam)) {
      throw new Error(`Production signal missing from inventory: ${fam}`);
    }
  }
  
  // 2. Disabled/backlog family omitted
  if (!inventory.some((i: any) => i.signalFamilyId === "severe-pressure-evidence")) {
     throw new Error(`Backlog family missing from inventory: severe-pressure-evidence`);
  }
  
  // 3. Runtime identifiers and invented IDs
  const allSourceIds = new Set(inventory.flatMap((i: any) => i.sourceIds));
  const allClaimIds = new Set(inventory.flatMap((i: any) => i.claimIds));
  
  for (const rec of reconciliation) {
     if (rec.origin === "runtime") {
       if (rec.identifierKind === "source" && !allSourceIds.has(rec.identifier)) {
          throw new Error(`Runtime source identifier does not exist in inventory: ${rec.identifier}`);
       }
       if (rec.identifierKind === "claim" && !allClaimIds.has(rec.identifier)) {
          throw new Error(`Runtime claim identifier does not exist in inventory: ${rec.identifier}`);
       }
       if (!rec.identifier.startsWith("SRC-MF-V03") && !rec.identifier.startsWith("CLM-MF-V03")) {
          throw new Error(`Invented identifier marked runtime: ${rec.identifier}`);
       }
     }
     
     // 4. Mismatched IDs
     if (rec.identifierKind === "source" && rec.identifier.startsWith("CLM")) {
        throw new Error(`Claim ID used as a source ID: ${rec.identifier}`);
     }
     if (rec.identifierKind === "claim" && rec.identifier.startsWith("SRC")) {
        throw new Error(`Source ID used as a claim ID: ${rec.identifier}`);
     }
     
     // 5. Engineering policy labelled Calculation Core fact
     if (rec.origin === "runtime" && rec.authorityClass === "calculation-core-fact") {
        throw new Error(`Engineering policy labelled Calculation Core fact: ${rec.identifier}`);
     }
     
     // 6. Unscoped doctrine claim applied to both schools
     if (rec.authorityClass === "school-manual-supported" && rec.schoolScope.length > 1) {
        throw new Error(`Unscoped doctrine claim applied to both schools: ${rec.identifier}`);
     }
     
     // 7. Internal source labelled classical
     if (rec.origin === "runtime" && rec.authorityClass.includes("supported")) {
        throw new Error(`Internal source labelled classical: ${rec.identifier}`);
     }
  }
  
  // 8. Missing school scope
  for (const inv of inventory) {
     if (inv.runtimeStatus === "production-enabled" && inv.schoolScope.length === 0) {
        throw new Error(`Missing school scope for ${inv.signalFamilyId}`);
     }
     if (inv.pillarId !== "thien-thoi" && inv.pillarId !== "dia-loi" && inv.pillarId !== "nhan-hoa" && inv.pillarId !== "tu-hoa-sat-tinh") {
        throw new Error(`Wrong canonical pillar ID: ${inv.pillarId}`);
     }
     if (inv.signalFamilyId === "support-pressure-auxiliary-sets" && inv.frame === "tam-phuong-tu-chinh") {
        throw new Error(`Nhân Hòa frame declared TP4C while runtime is active palace`);
     }
     if (inv.signalFamilyId === "element-relation") {
        const same = inv.engineeringMappings.find((m: any) => m.scenario === "same_element");
        if (same && same.direction === "neutral") {
           throw new Error(`same_element declared neutral while policy says support`);
        }
     }
     if (inv.engineeringMappings.length > 0 && inv.numericAuthority !== "engineering-defined") {
        throw new Error(`Numeric weight added (numericAuthority not engineering-defined) for ${inv.signalFamilyId}`);
     }
  }
  
  // 9. Cross-school doctrine fallback
  for (const pol of schoolPolicy) {
    if (pol.admittedByNamPhai && pol.admittedByTrungChau && !pol.crossSchoolFallbackForbidden && !pol.unresolvedSchoolContradiction && !pol.sharedDoctrine) {
      throw new Error(`Cross-school doctrine fallback detected for ${pol.signalFamilyId}`);
    }
  }

  // 10. Historical contradiction dropped
  if (!ctr.contradictions.some((c: any) => c.contradictionId === "CTR-MFV02-LOC-001")) {
     throw new Error(`Historical contradiction dropped: CTR-MFV02-LOC-001`);
  }

  console.log("Validation passed.");
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateFoundation();
}
