import fs from 'fs';
import path from 'path';

// This is an independent check. It must not rely on `deriveDecision` or `generate.ts`.
export function runDecisionCheck(baseDir: string) {
  const intakeManifestPath = path.join(process.cwd(), '.research-artifacts/major-fortune/dia-loi/artifact-intake-manifest.json');
  const authPath = path.join(baseDir, 'authorization/dia-loi-admission-authorization.json');
  const decisionPath = path.join(baseDir, 'reports/decision.json');

  const authorizations = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const trackedDecision = JSON.parse(fs.readFileSync(decisionPath, 'utf8'));

  // Very simplified independent logic for baseline:
  let allBlocked = true;
  for (const auth of authorizations) {
    if (auth.authorizedStatus === 'source-verified-candidate') {
      allBlocked = false;
    }
  }

  let expectedDecision = 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE';
  if (allBlocked) {
    expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  }

  if (trackedDecision.decision !== expectedDecision) {
    throw new Error(`Decision mismatch! Expected ${expectedDecision}, got ${trackedDecision.decision}`);
  }

  const outPath = path.join(baseDir, 'reports/decision-check.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ verified: true, expectedDecision }, null, 2) + '\n');
  console.log('Decision check passed independently.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runDecisionCheck(baseDir);
}
