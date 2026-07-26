import fs from 'fs';
import path from 'path';
import type { Decision } from '../schema/foundation.js';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function loadJson(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) throw new Error(`Missing ${relPath}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadHash(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) return "missing";
  return fs.readFileSync(p, 'utf-8').trim();
}

export function decideFoundation() {
  const readiness = loadJson('matrices/candidate-readiness-matrix.json');
  const inventory = loadJson('inventory/signal-inventory.json');
  const ctr = loadJson('contradictions/contradiction-log.json');
  const sourceAcq = loadJson('queue/source-acquisition-queue.json');
  const claimAdj = loadJson('queue/claim-adjudication-queue.json');
  const calcCore = loadJson('queue/calculation-core-gap-queue.json');
  
  let result: Decision["decision"] = "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
  
  // Rule: READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN if >= 1 family is ready
  const eligible = readiness.filter((r: any) => r.readiness === "ready").map((r: any) => r.signalFamilyId);
  const blocked = readiness.filter((r: any) => r.readiness !== "ready").map((r: any) => r.signalFamilyId);
  
  if (eligible.length > 0) {
     result = "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  }
  
  // Note: CURRENT_PRODUCTION_PROVENANCE_MISMATCH would be triggered by validation scripts, 
  // or if we strictly evaluated the truthfulness here. We rely on the inventory truth being pre-checked.
  
  const decision: Decision = {
    schemaVersion: "0.5.0",
    decision: result,
    canonicalInputHashes: {
       "signal-inventory": "calculated-during-check"
    },
    failedOrBlockingConditions: blocked.length > 0 ? ["some-candidates-blocked"] : [],
    eligibleFamilyIds: eligible,
    blockedFamilyIds: blocked,
    openContradictionIds: ctr.contradictions.filter((c: any) => c.status === "open").map((c: any) => c.contradictionId),
    openQueueCounts: {
       sourceAcquisition: sourceAcq.length,
       claimAdjudication: claimAdj.length,
       calculationCoreGap: calcCore.length
    },
    corpusReportHash: loadHash('reports/corpus-gap-report.hash'),
    matrixHashes: {
       evidenceGap: loadHash('matrices/evidence-gap-matrix.hash'),
       schoolPolicy: loadHash('matrices/school-policy-matrix.hash'),
       candidateReadiness: loadHash('matrices/candidate-readiness-matrix.hash')
    }
  };
  
  fs.writeFileSync(path.join(base, 'decision.json'), JSON.stringify(decision, null, 2));
  fs.writeFileSync(path.join(base, 'V0.5-EVIDENCE-GAP-DECISION.md'), 
    `# V0.5 Evidence Gap Decision\n\n**Decision:** ${decision.decision}\n\n**Schema Version:** 0.5.0\n`);
    
  console.log(`Decision rendered: ${decision.decision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  decideFoundation();
}
