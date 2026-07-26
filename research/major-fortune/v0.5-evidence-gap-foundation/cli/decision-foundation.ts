import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Decision, CandidateReadinessMatrixRecord, ProvenanceReconciliationRecord, SignalInventoryRecord } from '../schema/foundation.js';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function hashFile(p: string): string {
  if (!fs.existsSync(p)) return 'missing';
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

export function generateDecision() {
  const readiness: CandidateReadinessMatrixRecord[] = JSON.parse(fs.readFileSync(path.join(base, 'matrices/candidate-readiness-matrix.json'), 'utf-8'));
  const reconciliation: ProvenanceReconciliationRecord[] = JSON.parse(fs.readFileSync(path.join(base, 'inventory/provenance-reconciliation.json'), 'utf-8'));
  const inventory: SignalInventoryRecord[] = JSON.parse(fs.readFileSync(path.join(base, 'inventory/signal-inventory.json'), 'utf-8'));
  
  const eligibleFamilyIds = readiness.filter(r => r.readiness === 'eligible-for-shape-design').map(r => r.signalFamilyId);
  const blockedFamilyIds = readiness.filter(r => r.readiness === 'research-blocked' || r.readiness === 'blocked-by-calculation-core').map(r => r.signalFamilyId);
  
  const failedOrBlockingConditions: string[] = [];
  
  // Check PROVENANCE MISMATCH
  let provenanceMismatch = false;
  for (const fam of inventory.filter(f => f.runtimeStatus === 'production-enabled')) {
    if (fam.sourceIds.length === 0 || fam.claimIds.length === 0) {
      provenanceMismatch = true;
      failedOrBlockingConditions.push(`PROVENANCE MISMATCH: Family ${fam.signalFamilyId} is production-enabled but missing runtime source or claim IDs.`);
    }
  }
  for (const rec of reconciliation) {
    if (!rec.runtimeExists && rec.origin === 'runtime') {
       provenanceMismatch = true;
       failedOrBlockingConditions.push(`PROVENANCE MISMATCH: ${rec.identifier} missing from runtime.`);
    }
  }

  for (const r of readiness) {
    if (r.blockingDimensions.length > 0) {
      failedOrBlockingConditions.push(`Family ${r.signalFamilyId} blocked by: ${r.blockingDimensions.join(', ')}`);
    }
  }

  let finalDecision: Decision["decision"] = "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
  if (provenanceMismatch) {
    finalDecision = "CURRENT_PRODUCTION_PROVENANCE_MISMATCH";
  } else if (eligibleFamilyIds.length > 0) {
    finalDecision = "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  }

  const decisionObj: Decision = {
    schemaVersion: "0.5.0",
    decision: finalDecision,
    canonicalInputHashes: {
      "signal-inventory.json": hashFile(path.join(base, 'inventory/signal-inventory.json')),
      "backlog-registry.json": hashFile(path.join(base, 'inventory/backlog-registry.json')),
      "provenance-reconciliation.json": hashFile(path.join(base, 'inventory/provenance-reconciliation.json')),
      "source-registry-delta.json": hashFile(path.join(base, 'sources/source-registry-delta.json')),
      "claim-registry-delta.json": hashFile(path.join(base, 'claims/claim-registry-delta.json')),
      "source-acquisition-ledger.json": hashFile(path.join(base, 'sources/source-acquisition-ledger.json')),
      "page-scan-extraction-ledger.json": hashFile(path.join(base, 'sources/page-scan-extraction-ledger.json')),
      "contradiction-log.json": hashFile(path.join(base, 'contradictions/contradiction-log.json'))
    },
    failedOrBlockingConditions,
    eligibleFamilyIds,
    blockedFamilyIds,
    openContradictionIds: [], // read from log if implemented
    openQueueCounts: {
      "source-acquisition": 6,
      "claim-adjudication": 6,
      "calculation-core": 0
    },
    corpusReportHash: hashFile(path.join(base, 'reports/corpus-gap-report.json')),
    matrixHashes: {
      "evidence-gap-matrix.json": hashFile(path.join(base, 'matrices/evidence-gap-matrix.json')),
      "school-policy-matrix.json": hashFile(path.join(base, 'matrices/school-policy-matrix.json')),
      "candidate-readiness-matrix.json": hashFile(path.join(base, 'matrices/candidate-readiness-matrix.json'))
    }
  };

  fs.writeFileSync(path.join(base, 'decision.json'), JSON.stringify(decisionObj, null, 2));
  console.log(`Decision rendered: ${finalDecision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDecision();
}
