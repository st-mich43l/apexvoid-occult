import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function loadJson(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) throw new Error(`Missing ${relPath}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function calcHash(relPath: string) {
  const p = path.join(base, relPath);
  if (!fs.existsSync(p)) return "missing";
  const content = fs.readFileSync(p, 'utf-8');
  // Need to reproduce the exact hashing logic from generators
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function checkDecision() {
  const p = path.join(base, 'decision.json');
  if (!fs.existsSync(p)) {
    console.error("Decision file not found.");
    process.exit(1);
  }
  const dec = JSON.parse(fs.readFileSync(p, 'utf-8'));
  
  // Independent reload
  const readiness = loadJson('matrices/candidate-readiness-matrix.json');
  
  // Recalculate decision
  const eligible = readiness.filter((r: any) => r.readiness === "ready").map((r: any) => r.signalFamilyId);
  const expectedDecision = eligible.length > 0 ? "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN" : "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
  
  if (dec.decision !== expectedDecision) {
    console.error(`Unexpected decision: got ${dec.decision}, expected ${expectedDecision}`);
    process.exit(1);
  }
  
  // Check hashes (stale artifact check)
  const expectedCorpusHash = calcHash('reports/corpus-gap-report.json');
  if (dec.corpusReportHash !== expectedCorpusHash) {
    console.error("Stale artifact: corpus-gap-report.json hash mismatch.");
    process.exit(1);
  }
  
  const expectedEvHash = calcHash('matrices/evidence-gap-matrix.json');
  if (dec.matrixHashes.evidenceGap !== expectedEvHash) {
     console.error("Stale generated matrix: evidence-gap-matrix.json hash mismatch.");
     process.exit(1);
  }
  
  const expectedSchoolHash = calcHash('matrices/school-policy-matrix.json');
  if (dec.matrixHashes.schoolPolicy !== expectedSchoolHash) {
     console.error("Stale generated matrix: school-policy-matrix.json hash mismatch.");
     process.exit(1);
  }
  
  const expectedReadinessHash = calcHash('matrices/candidate-readiness-matrix.json');
  if (dec.matrixHashes.candidateReadiness !== expectedReadinessHash) {
     console.error("Stale generated matrix: candidate-readiness-matrix.json hash mismatch.");
     process.exit(1);
  }
  
  console.log("Decision check passed. All artifacts fresh and decision derived correctly.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkDecision();
}
