import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import crypto from 'crypto';

const originalBase = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

function hashDir(dir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  const walk = (d: string) => {
    const items = fs.readdirSync(d);
    for (const item of items) {
      if (item === 'schema' || item === 'cli' || item === '__tests__') continue; // only check data
      const fullPath = path.join(d, item);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else {
        if (fullPath.endsWith('.json') || fullPath.endsWith('.hash')) {
          const rel = path.relative(dir, fullPath);
          hashes[rel] = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
        }
      }
    }
  };
  walk(dir);
  return hashes;
}

export function runDeterminism() {
  console.log("Running determinism check...");
  
  // To avoid rewriting the entire pipeline to accept an output directory argument,
  // we will just run the pipeline twice in the actual repo, moving the output files
  // to temp dirs after each run. This is acceptable for this verification script.
  
  const tempA = fs.mkdtempSync(path.join(os.tmpdir(), 'mf-v05-det-A-'));
  const tempB = fs.mkdtempSync(path.join(os.tmpdir(), 'mf-v05-det-B-'));
  
  const genCmd = "npm run research:major-fortune-v05-gap:inventory && npm run research:major-fortune-v05-gap:corpus && npm run research:major-fortune-v05-gap:matrices && npm run research:major-fortune-v05-gap:queues && npm run research:major-fortune-v05-gap:report && npm run research:major-fortune-v05-gap:decision";
  
  const copyOutput = (target: string) => {
    const dirs = ['inventory', 'matrices', 'queue', 'reports', 'sources', 'claims', 'contradictions'];
    for (const d of dirs) {
      if (fs.existsSync(path.join(originalBase, d))) {
        fs.cpSync(path.join(originalBase, d), path.join(target, d), { recursive: true });
      }
    }
    if (fs.existsSync(path.join(originalBase, 'decision.json'))) {
      fs.copyFileSync(path.join(originalBase, 'decision.json'), path.join(target, 'decision.json'));
    }
  };

  try {
    console.log("Generating Run A...");
    execSync(genCmd, { stdio: 'ignore' });
    copyOutput(tempA);
    
    console.log("Generating Run B...");
    execSync(genCmd, { stdio: 'ignore' });
    copyOutput(tempB);
    
    console.log("Comparing Run A and Run B...");
    const hashesA = hashDir(tempA);
    const hashesB = hashDir(tempB);
    
    for (const file of Object.keys(hashesA)) {
       if (hashesA[file] !== hashesB[file]) {
         throw new Error(`Determinism failure: ${file} differed between runs.`);
       }
    }
    
    console.log("Determinism check passed. Run A matches Run B.");
    
    // Verify against committed tree
    console.log("Verifying clean working tree...");
    try {
      execSync('git diff --exit-code research/major-fortune/v0.5-evidence-gap-foundation', { stdio: 'ignore' });
      console.log("Working tree is clean.");
    } catch (e) {
      throw new Error("Working tree is not clean after generation. Committed artifacts do not match generated output.");
    }
    
  } finally {
    fs.rmSync(tempA, { recursive: true, force: true });
    fs.rmSync(tempB, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeterminism();
}
