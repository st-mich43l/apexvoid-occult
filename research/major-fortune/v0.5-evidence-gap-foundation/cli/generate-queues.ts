import fs from 'fs';
import path from 'path';
import type { ContradictionLog } from '../schema/foundation.js';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function generateQueues() {
  const inventory = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  
  // 1. Contradictions
  const contradictions: ContradictionLog = {
    schemaVersion: "0.5.0",
    contradictions: [
      {
        contradictionId: "CTR-MFV02-LOC-001",
        priorContradictionIds: [],
        status: "open",
        affectedFamilies: ["support-pressure-auxiliary-sets"],
        affectedSchools: ["nam-phai", "trung-chau"],
        positions: [],
        adjudicationEvidenceIds: [],
        resolution: null
      }
    ]
  };
  
  if (!fs.existsSync(path.join(base, 'contradictions'))) fs.mkdirSync(path.join(base, 'contradictions'), { recursive: true });
  fs.writeFileSync(path.join(base, 'contradictions/contradiction-log.json'), JSON.stringify(contradictions, null, 2));

  // 2. Queues
  const sourceAcquisition = [];
  const claimAdjudication = [];
  const calculationCoreGap = [];
  
  for (const family of inventory) {
    if (family.doctrineStatus === "unverified" || family.doctrineStatus === "missing") {
       sourceAcquisition.push({
         signalFamilyId: family.signalFamilyId,
         priority: family.runtimeStatus === "production-enabled" ? "high" : "medium",
         reason: "Doctrine unverified for " + family.signalFamilyId
       });
       claimAdjudication.push({
         signalFamilyId: family.signalFamilyId,
         priority: family.runtimeStatus === "production-enabled" ? "high" : "medium",
         reason: "Claims require adjudication for " + family.signalFamilyId
       });
    }
    if (family.runtimeStatus === "production-blocked-on-calculation-core") {
       calculationCoreGap.push({
         signalFamilyId: family.signalFamilyId,
         priority: "low",
         reason: "Blocked on Calculation Core"
       });
    }
  }
  
  if (!fs.existsSync(path.join(base, 'queue'))) fs.mkdirSync(path.join(base, 'queue'), { recursive: true });
  fs.writeFileSync(path.join(base, 'queue/source-acquisition-queue.json'), JSON.stringify(sourceAcquisition, null, 2));
  fs.writeFileSync(path.join(base, 'queue/claim-adjudication-queue.json'), JSON.stringify(claimAdjudication, null, 2));
  fs.writeFileSync(path.join(base, 'queue/calculation-core-gap-queue.json'), JSON.stringify(calculationCoreGap, null, 2));

  console.log("Generated queues and contradictions.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateQueues();
}
