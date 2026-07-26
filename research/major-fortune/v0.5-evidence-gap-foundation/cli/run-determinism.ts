import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractInventory } from './extract-inventory.js';
import { runCorpusReport } from './report-corpus.js';
import { generateEvidenceGapMatrix } from './generate-evidence-gap-matrix.js';
import { generateSchoolPolicyMatrix } from './generate-school-policy-matrix.js';
import { generateCandidateReadinessMatrix } from './generate-candidate-readiness-matrix.js';
import { generateQueues } from './generate-queues.js';
import { generateDecision } from './decision-foundation.js';
import { verifyDecision } from './decision-check.js';
import { MANIFEST_FILES } from './decision-foundation.js';

function runPipeline(outputBase: string) {
  extractInventory({ outputBase });
  runCorpusReport({ outputBase });
  generateEvidenceGapMatrix({ outputBase });
  generateSchoolPolicyMatrix({ outputBase });
  generateCandidateReadinessMatrix({ outputBase });
  generateQueues({ outputBase });
  generateDecision({ outputBase });
  verifyDecision({ outputBase });
}

function hashFile(p: string): string {
  if (!fs.existsSync(p)) return 'MISSING';
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

export function runDeterminism() {
  const baseDir = process.cwd();
  const tmpA = path.join(baseDir, 'tmp/mf-v05-run-a');
  const tmpB = path.join(baseDir, 'tmp/mf-v05-run-b');
  const canonicalDir = path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');

  // Clean tmp dirs
  if (fs.existsSync(tmpA)) fs.rmSync(tmpA, { recursive: true, force: true });
  if (fs.existsSync(tmpB)) fs.rmSync(tmpB, { recursive: true, force: true });

  fs.mkdirSync(tmpA, { recursive: true });
  fs.mkdirSync(tmpB, { recursive: true });

  // Add dummy json files to tmpA and tmpB for inputs not generated but required?
  // Actually, extractInventory creates inventory, runCorpus creates reports, etc.
  // The only file that needs to exist is backlog-registry, but extract-inventory reads it from canonical!
  // Wait, in my extract-inventory I hardcoded reading from baseDir/research.../inventory/backlog-registry.json
  // That's perfect because the backlog is an input, not a generated output!
  
  console.log("Running Pipeline A...");
  runPipeline(tmpA);
  
  console.log("Running Pipeline B...");
  runPipeline(tmpB);

  let mismatched = false;
  
  // Also check decision.json
  const filesToCheck = [...MANIFEST_FILES, 'decision.json'];

  for (const f of filesToCheck) {
    const hashA = hashFile(path.join(tmpA, f));
    const hashB = hashFile(path.join(tmpB, f));
    const hashC = hashFile(path.join(canonicalDir, f));

    if (hashA !== hashB) {
      console.error(`Determinism failure between Run A and Run B for ${f}`);
      mismatched = true;
    }
    
    if (hashA !== hashC) {
      console.error(`Mismatch between Run A and canonical working tree for ${f}`);
      console.error(`Run A: ${hashA}`);
      console.error(`Canonical: ${hashC}`);
      mismatched = true;
    }
  }

  if (mismatched) {
    process.exit(1);
  }

  console.log("Absolute determinism verified! All generated artifacts match bit-for-bit with canonical files.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeterminism();
}
