import fs from 'fs';
import path from 'path';
import type { SignalInventoryRecord, ProvenanceReconciliationRecord } from '../schema/foundation.js';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');
const srcBase = path.join(process.cwd(), 'src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter');
const registryBase = path.join(process.cwd(), 'src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.3-ordinal');

function extractIds(filename: string): { src: string[], clm: string[] } {
  const content = fs.readFileSync(path.join(srcBase, filename), 'utf-8');
  const srcMatch = content.match(/const [A-Z_]+_?(?:SOURCE|SRC) = \[([^\]]+)\]/);
  const clmMatch = content.match(/const [A-Z_]+_?(?:CLAIM|CLM) = \[([^\]]+)\]/);
  
  const extractString = (match: RegExpMatchArray | null) => {
    if (!match) return [];
    return match[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(s => s.length > 0);
  };
  
  return { src: extractString(srcMatch), clm: extractString(clmMatch) };
}

export function extractInventory() {
  const adapterPolicy = JSON.parse(fs.readFileSync(path.join(srcBase, 'policy/adapter-policy.v0.3.json'), 'utf-8'));
  const pillarRegistry = JSON.parse(fs.readFileSync(path.join(registryBase, 'pillar-registry.v0.3.json'), 'utf-8'));
  
  const inventory: SignalInventoryRecord[] = [];
  const reconciliation: ProvenanceReconciliationRecord[] = [];
  
  // Mapping from family to module file to extract IDs
  const fileMapping: Record<string, string> = {
    'element-relation': 'emit-thien-thoi.ts',
    'principal-star-dignity': 'emit-dia-loi.ts',
    'support-pressure-auxiliary-sets': 'emit-nhan-hoa.ts',
    'major-fortune-transformations': 'emit-tu-hoa.ts'
  };
  
  const frameMapping: Record<string, "active-palace" | "tam-phuong-tu-chinh" | "direct-active-major-fortune-palace-only" | "active-major-fortune-palace-only"> = {
    'element-relation': 'active-major-fortune-palace-only',
    'principal-star-dignity': 'active-major-fortune-palace-only',
    'support-pressure-auxiliary-sets': 'active-palace',
    'major-fortune-transformations': 'direct-active-major-fortune-palace-only'
  };
  
  // Extract families and construct inventory
  for (const familyId of adapterPolicy.enabledSignalFamilies) {
    const pillar = pillarRegistry.pillars.find((p: any) => p.allowedSignalFamilyIds.includes(familyId));
    const filename = fileMapping[familyId];
    const { src, clm } = extractIds(filename);
    
    // Engineering mappings based on adapter policy
    const engineeringMappings: Array<{ scenario: string; direction: "support" | "pressure" | "neutral"; strength: "normal" | "strong" | "none" }> = [];
    if (familyId === 'element-relation') {
      for (const [scenario, mapping] of Object.entries(adapterPolicy.elementRelationMapping)) {
        engineeringMappings.push({
          scenario,
          direction: (mapping as any).direction,
          strength: (mapping as any).strength
        });
      }
    } else if (familyId === 'principal-star-dignity') {
       for (const [scenario, mapping] of Object.entries(adapterPolicy.dignityMapping)) {
         engineeringMappings.push({
           scenario,
           direction: mapping ? (mapping as any).direction : 'neutral',
           strength: mapping ? (mapping as any).strength : 'none'
         });
       }
    } else if (familyId === 'major-fortune-transformations') {
       for (const [scenario, mapping] of Object.entries(adapterPolicy.transformationPolarity)) {
         engineeringMappings.push({
           scenario,
           direction: (mapping as any).direction,
           strength: (mapping as any).strength
         });
       }
    }
    
    inventory.push({
      signalFamilyId: familyId,
      pillarId: pillar.pillarId,
      runtimeStatus: "production-enabled",
      doctrineStatus: "unverified",
      frame: frameMapping[familyId] || 'active-palace',
      sourceIds: src,
      claimIds: clm,
      schoolScope: ["nam-phai", "trung-chau"],
      engineeringMappings,
      numericAuthority: "engineering-defined"
    });
    
    // Add to reconciliation
    for (const id of src) {
      if (!reconciliation.some(r => r.identifier === id)) {
        reconciliation.push({
          identifier: id,
          identifierKind: "source",
          origin: "runtime",
          definingPath: `src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/${filename}`,
          definingSymbol: "SRC",
          runtimeExists: true,
          authorityClass: "engineering-policy",
          schoolScope: ["nam-phai", "trung-chau"],
          relatedIdentifiers: [],
          notes: "Extracted from runtime adapter."
        });
      }
    }
    for (const id of clm) {
      if (!reconciliation.some(r => r.identifier === id)) {
         reconciliation.push({
          identifier: id,
          identifierKind: "claim",
          origin: "runtime",
          definingPath: `src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/${filename}`,
          definingSymbol: "CLM",
          runtimeExists: true,
          authorityClass: "engineering-policy",
          schoolScope: ["nam-phai", "trung-chau"],
          relatedIdentifiers: [],
          notes: "Extracted from runtime adapter."
        });
      }
    }
  }
  
  // Also add backlog/disabled families
  for (const disabled of adapterPolicy.round1DisabledFamilies) {
     const pillar = pillarRegistry.pillars.find((p: any) => p.allowedSignalFamilyIds.includes(disabled.signalFamilyId));
     let mappedPillarId = pillar?.pillarId;
     if (!mappedPillarId && disabled.signalFamilyId === 'hinh-ho-set') mappedPillarId = 'nhan-hoa';
     inventory.push({
      signalFamilyId: disabled.signalFamilyId,
      pillarId: mappedPillarId || 'unknown',
      runtimeStatus: "production-blocked-on-evidence",
      doctrineStatus: "unverified",
      frame: "active-palace",
      sourceIds: [],
      claimIds: [],
      schoolScope: [],
      engineeringMappings: [],
      numericAuthority: "not-applicable"
    });
  }

  // Ensure directories exist
  if (!fs.existsSync(path.join(base, 'inventory'))) fs.mkdirSync(path.join(base, 'inventory'), { recursive: true });

  fs.writeFileSync(path.join(base, 'inventory/signal-inventory.json'), JSON.stringify(inventory, null, 2));
  fs.writeFileSync(path.join(base, 'inventory/provenance-reconciliation.json'), JSON.stringify(reconciliation, null, 2));
  
  console.log("Extracted inventory from runtime.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractInventory();
}
