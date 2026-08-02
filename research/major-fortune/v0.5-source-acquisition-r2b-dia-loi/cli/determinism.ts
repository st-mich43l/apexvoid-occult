import fs from 'fs';
import path from 'path';
import { runGeneration } from './generate';
import { runDecisionCheck } from './decision-check';
import { runReport } from './report';
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

export function testDeterminism(baseDir: string) {
  const tmpA = '/tmp/mf-dia-loi-r2b-run-a';
  const tmpB = '/tmp/mf-dia-loi-r2b-run-b';

  if (fs.existsSync(tmpA)) fs.rmSync(tmpA, { recursive: true, force: true });
  if (fs.existsSync(tmpB)) fs.rmSync(tmpB, { recursive: true, force: true });

  fs.cpSync(path.join(baseDir, 'discovery'), path.join(tmpA, 'discovery'), { recursive: true });
  fs.cpSync(path.join(baseDir, 'discovery'), path.join(tmpB, 'discovery'), { recursive: true });
  if (fs.existsSync(path.join(baseDir, 'config'))) {
    fs.cpSync(path.join(baseDir, 'config'), path.join(tmpA, 'config'), { recursive: true });
    fs.cpSync(path.join(baseDir, 'config'), path.join(tmpB, 'config'), { recursive: true });
  }

  runGeneration(tmpA);
  runDecisionCheck(tmpA);
  runReport(tmpA);

  runGeneration(tmpB);
  runDecisionCheck(tmpB);
  runReport(tmpB);

  const hashA = computeDirHash(path.join(tmpA, 'reports'));
  const hashB = computeDirHash(path.join(tmpB, 'reports'));

  const result = {
    isDeterministic: hashA === hashB && !!hashA,
    runAHash: hashA,
    runBHash: hashB
  };

  fs.mkdirSync(path.join(baseDir, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'reports/determinism-report.json'), JSON.stringify(result, null, 2) + '\n');

  if (!result.isDeterministic) {
    throw new Error(`Determinism test failed! Hashes differ: A=${hashA}, B=${hashB}`);
  }

  console.log('Determinism check passed. Both isolated runs produced byte-identical output.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  testDeterminism(baseDir);
}
