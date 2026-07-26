import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Decision } from '../schema/foundation.js';

let baseDir = process.cwd();

export const MANIFEST_FILES = [
  'inventory/runtime-signal-inventory.json',
  'inventory/research-backlog-registry.json',
  'inventory/provenance-reconciliation.json',
  'reports/corpus-gap-report.json',
  'reports/corpus-gap-report.hash',
  'matrices/evidence-gap-matrix.json',
  'matrices/evidence-gap-matrix.hash',
  'matrices/school-policy-matrix.json',
  'matrices/school-policy-matrix.hash',
  'matrices/candidate-readiness-matrix.json',
  'matrices/candidate-readiness-matrix.hash',
  'contradictions/contradiction-log.json',
  'queue/source-acquisition-queue.json',
  'queue/claim-adjudication-queue.json',
  'queue/calculation-core-gap-queue.json'
];

export function generateDecision(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  
  const canonicalInputHashes: Record<string, string> = {};
  for (const f of MANIFEST_FILES) {
    const fullPath = path.join(base, f);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Manifest file missing: ${f}`);
    }
    const content = fs.readFileSync(fullPath);
    canonicalInputHashes[f] = crypto.createHash('sha256').update(content).digest('hex');
  }

  const gapMatrix = JSON.parse(fs.readFileSync(path.join(base, 'matrices/evidence-gap-matrix.json'), 'utf-8'));
  const ctrLog = JSON.parse(fs.readFileSync(path.join(base, 'contradictions/contradiction-log.json'), 'utf-8'));
  const sourceQueue = JSON.parse(fs.readFileSync(path.join(base, 'queue/source-acquisition-queue.json'), 'utf-8'));
  const claimQueue = JSON.parse(fs.readFileSync(path.join(base, 'queue/claim-adjudication-queue.json'), 'utf-8'));
  const ccQueue = JSON.parse(fs.readFileSync(path.join(base, 'queue/calculation-core-gap-queue.json'), 'utf-8'));
  
  const eligibleFamilyIds = gapMatrix.filter((g: any) => g.candidateEligibility === 'eligible-for-shape-design').map((g: any) => g.signalFamilyId);
  const blockedFamilyIds = gapMatrix.filter((g: any) => g.candidateEligibility !== 'eligible-for-shape-design' && g.candidateEligibility !== 'metadata-only').map((g: any) => g.signalFamilyId);
  const openContradictionIds = ctrLog.contradictions.filter((c: any) => c.status === 'open').map((c: any) => c.contradictionId);

  const decisionRec: Decision = {
    schemaVersion: "0.5.0",
    decision: "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN",
    canonicalInputHashes,
    failedOrBlockingConditions: [
      "Doctrine unverifiable in Round 1 for most families",
      "Contradictions open",
      "Incomplete corpus data"
    ],
    eligibleFamilyIds,
    blockedFamilyIds,
    openContradictionIds,
    openQueueCounts: {
      "source-acquisition": sourceQueue.length,
      "claim-adjudication": claimQueue.length,
      "calculation-core-gap": ccQueue.length
    },
    corpusReportHash: canonicalInputHashes['reports/corpus-gap-report.hash'],
    matrixHashes: {
      "evidence-gap-matrix": canonicalInputHashes['matrices/evidence-gap-matrix.hash'],
      "school-policy-matrix": canonicalInputHashes['matrices/school-policy-matrix.hash'],
      "candidate-readiness-matrix": canonicalInputHashes['matrices/candidate-readiness-matrix.hash']
    }
  };

  fs.writeFileSync(path.join(base, 'decision.json'), JSON.stringify(decisionRec, null, 2) + "\n");
  console.log("Generated robust decision record.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDecision();
}
