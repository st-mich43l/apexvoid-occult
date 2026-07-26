import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MANIFEST_FILES } from './decision-foundation.js';

let baseDir = process.cwd();

export function verifyDecision(opts?: { outputBase?: string }) {
  const base = opts?.outputBase || path.join(baseDir, 'research/major-fortune/v0.5-evidence-gap-foundation');
  const decisionPath = path.join(base, 'decision.json');
  
  if (!fs.existsSync(decisionPath)) {
    throw new Error("decision.json missing.");
  }
  
  const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));
  
  for (const f of MANIFEST_FILES) {
    const fullPath = path.join(base, f);
    if (!fs.existsSync(fullPath)) {
       console.error(`Missing manifest file: ${f}`);
       process.exit(1);
    }
    const content = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    if (decision.canonicalInputHashes[f] !== hash) {
       console.error(`Hash mismatch for ${f}. Expected ${decision.canonicalInputHashes[f]}, got ${hash}`);
       process.exit(1);
    }
  }

  // Cross-check queues
  const sq = JSON.parse(fs.readFileSync(path.join(base, 'queue/source-acquisition-queue.json'), 'utf-8'));
  if (decision.openQueueCounts['source-acquisition'] !== sq.length) {
    console.error("Source acquisition queue length mismatch.");
    process.exit(1);
  }

  if (decision.decision !== 'MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN') {
    console.error(`Invalid decision state: ${decision.decision}`);
    process.exit(1);
  }

  console.log("Decision check passed. All hashes verified.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDecision();
}
