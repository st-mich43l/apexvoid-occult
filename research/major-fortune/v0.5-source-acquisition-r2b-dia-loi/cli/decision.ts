import fs from 'fs';
import path from 'path';
import { deriveDecision } from '../src/derive-decision';

export function makeDecision(baseDir: string) {
  const authPath = path.join(baseDir, 'authorization/dia-loi-admission-authorization.json');
  if (!fs.existsSync(authPath)) {
    throw new Error('Authorization registry missing.');
  }

  const authorizations = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const decisionResult = deriveDecision(authorizations);

  const decisionObj = {
    decision: decisionResult.decision,
    reasonCodes: decisionResult.reasonCodes
  };

  const outPath = path.join(baseDir, 'reports/decision.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(decisionObj, null, 2) + '\n');
  
  console.log(`Decision: ${decisionObj.decision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  makeDecision(baseDir);
}
