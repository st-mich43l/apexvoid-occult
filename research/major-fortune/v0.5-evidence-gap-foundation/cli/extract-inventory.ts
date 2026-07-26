import fs from 'fs';
import path from 'path';
import type { SignalInventoryRecord, BacklogInventoryRecord, ProvenanceReconciliationRecord } from '../schema/foundation.js';

let baseDir = process.cwd();

export function extractInventory(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  const srcBase = path.join(baseDir, 'src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter');
  const registryBase = path.join(baseDir, 'src/lib/ziwei/analysis/knowledge/major-fortune-scoring/v0.3-ordinal');
  
  const adapterPolicy = JSON.parse(fs.readFileSync(path.join(srcBase, 'policy/adapter-policy.v0.3.json'), 'utf-8'));
  const pillarRegistry = JSON.parse(fs.readFileSync(path.join(registryBase, 'pillar-registry.v0.3.json'), 'utf-8'));
  const oldBacklogRegistry = JSON.parse(fs.readFileSync(path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation/inventory/backlog-registry.json'), 'utf-8'));
  
  const runtimeInventory: SignalInventoryRecord[] = [];
  const backlogInventory: BacklogInventoryRecord[] = [];
  const reconciliation: ProvenanceReconciliationRecord[] = [];
  
  const fileMapping: Record<string, string> = {
    'element-relation': 'emit-thien-thoi.ts',
    'principal-star-dignity': 'emit-dia-loi.ts',
    'support-pressure-auxiliary-sets': 'emit-nhan-hoa.ts',
    'major-fortune-transformations': 'emit-tu-hoa.ts'
  };
  
  const frameMapping: Record<string, "active-palace" | "tam-phuong-tu-chinh" | "direct-active-major-fortune-palace-only" | "active-major-fortune-palace-only"> = {
    'element-relation': 'active-major-fortune-palace-only',
    'principal-star-dignity': 'active-major-fortune-palace-only',
    'support-pressure-auxiliary-sets': 'active-major-fortune-palace-only',
    'major-fortune-transformations': 'direct-active-major-fortune-palace-only'
  };
  
  function extractIds(filename: string): { src: string[], clm: string[], srcSymbol: string, clmSymbol: string } {
    const content = fs.readFileSync(path.join(srcBase, filename), 'utf-8');
    const srcRegex = /const\s+([A-Z_a-z0-9]+)\s*=\s*\[\s*(['"]SRC-.*?['"])\s*\]/;
    const clmRegex = /const\s+([A-Z_a-z0-9]+)\s*=\s*\[\s*(['"]CLM-.*?['"])\s*\]/;
    const srcMatch = content.match(srcRegex);
    const clmMatch = content.match(clmRegex);
    
    const extractString = (match: RegExpMatchArray | null) => {
      if (!match) return [];
      return match[2].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(s => s.length > 0);
    };
    
    return { 
      src: extractString(srcMatch), 
      clm: extractString(clmMatch),
      srcSymbol: srcMatch ? srcMatch[1] : '',
      clmSymbol: clmMatch ? clmMatch[1] : ''
    };
  }
  
  for (const familyId of adapterPolicy.enabledSignalFamilies) {
    const pillar = pillarRegistry.pillars.find((p: any) => p.allowedSignalFamilyIds.includes(familyId));
    const filename = fileMapping[familyId];
    const { src, clm, srcSymbol, clmSymbol } = extractIds(filename);
    
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
    
    runtimeInventory.push({
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
    
    for (const id of src) {
      if (!reconciliation.some(r => r.identifier === id)) {
        reconciliation.push({
          identifier: id,
          identifierKind: "source",
          origin: "runtime",
          definingPath: `src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/${filename}`,
          definingSymbol: srcSymbol,
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
          definingSymbol: clmSymbol,
          runtimeExists: true,
          authorityClass: "engineering-policy",
          schoolScope: ["nam-phai", "trung-chau"],
          relatedIdentifiers: [],
          notes: "Extracted from runtime adapter."
        });
      }
    }
  }
  
  for (const item of oldBacklogRegistry) {
    let proposedFrame: any = "active-palace";
    let targetFrame: any = "active-palace";
    let emittedAsDiagnosticOnly = false;
    
    if (item.signalFamilyId === 'vcd-opposite-borrowing') {
      proposedFrame = "proposed-opposite-palace";
    } else if (item.signalFamilyId === 'out-of-frame-transformation-influence') {
      targetFrame = "out-of-frame-target";
    } else if (item.signalFamilyId === 'natal-transit-transformation-stacking') {
      proposedFrame = "natal-and-major-fortune";
    } else if (item.signalFamilyId === 'partial-auxiliary-pairs') {
      emittedAsDiagnosticOnly = true;
    }

    backlogInventory.push({
      signalFamilyId: item.signalFamilyId,
      implemented: false,
      emittedAsDiagnosticOnly,
      blockedOnEvidence: !item.blockedOnCalculationCore,
      blockedOnCalculationCore: item.blockedOnCalculationCore,
      measurableFromCorpus: item.blockedOnCalculationCore ? "not-measurable" : true,
      schoolScope: item.schoolScope || "unresolved",
      pillarOwnership: item.pillarOwnership || "unresolved",
      proposedFrame,
      targetFrame
    });
  }

  if (!fs.existsSync(path.join(base, 'inventory'))) fs.mkdirSync(path.join(base, 'inventory'), { recursive: true });

  fs.writeFileSync(path.join(base, 'inventory/runtime-signal-inventory.json'), JSON.stringify(runtimeInventory, null, 2) + "\n");
  fs.writeFileSync(path.join(base, 'inventory/research-backlog-registry.json'), JSON.stringify(backlogInventory, null, 2) + "\n");
  fs.writeFileSync(path.join(base, 'inventory/provenance-reconciliation.json'), JSON.stringify(reconciliation, null, 2) + "\n");
  
  console.log("Extracted inventory from runtime.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractInventory();
}
