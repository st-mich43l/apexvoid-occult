import fs from 'fs';
import path from 'path';
import { runGeneration } from './generate';
import { makeDecision } from './decision';
import { runDecisionCheck } from './decision-check';
import crypto from 'crypto';

function computeDirHash(dirPath: string): string {
  if (!fs.existsSync(dirPath)) return '';
  const files = fs.readdirSync(dirPath).sort();
  const hashes = files.map(f => {
    const p = path.join(dirPath, f);
    if (fs.statSync(p).isDirectory()) {
      return computeDirHash(p);
    }
    const buf = fs.readFileSync(p);
    return crypto.createHash('sha256').update(buf).digest('hex');
  });
  return crypto.createHash('sha256').update(hashes.join(',')).digest('hex');
}

export function testDeterminism() {
  const tmpA = '/tmp/mf-dia-loi-r2b-run-a';
  const tmpB = '/tmp/mf-dia-loi-r2b-run-b';
  
  if (fs.existsSync(tmpA)) fs.rmSync(tmpA, { recursive: true, force: true });
  if (fs.existsSync(tmpB)) fs.rmSync(tmpB, { recursive: true, force: true });

  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  
  // To simulate properly, we must copy inputs to tmp
  fs.cpSync(path.join(baseDir, 'discovery'), path.join(tmpA, 'discovery'), { recursive: true });
  fs.cpSync(path.join(baseDir, 'discovery'), path.join(tmpB, 'discovery'), { recursive: true });

  runGeneration(tmpA);
  makeDecision(tmpA);
  runDecisionCheck(tmpA);

  runGeneration(tmpB);
  makeDecision(tmpB);
  runDecisionCheck(tmpB);

  const hashA = computeDirHash(tmpA);
  const hashB = computeDirHash(tmpB);

  if (hashA !== hashB || !hashA) {
    throw new Error(`Determinism test failed! Hashes differ: A=${hashA}, B=${hashB}`);
  }

  console.log('Determinism check passed. Both isolated runs produced byte-identical output.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDeterminism();
}
