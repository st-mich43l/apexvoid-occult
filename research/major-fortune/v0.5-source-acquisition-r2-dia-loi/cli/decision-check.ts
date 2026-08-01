import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2-dia-loi');

function readJson(filePath: string) {
  const fullPath = path.join(BASE_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writeJson(filePath: string, data: any) {
  const fullPath = path.join(BASE_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

export function decisionCheck() {
  const copies = readJson('sources/copy-registry.json') || [];
  const storedDecision = readJson('reports/decision.json');

  let independentlyCalculated = 'PROMOTE_DIA_LOI_TO_SOURCE_VERIFIED_CANDIDATE';
  
  const hasVerifiedSources = copies.some((c: any) => c.inspectionStatus === 'verified' && c.artifactSha256);
  if (!hasVerifiedSources) {
    independentlyCalculated = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
  }

  if (independentlyCalculated !== storedDecision?.decision) {
    console.error(`Decision mismatch! Stored: ${storedDecision?.decision}, Calculated: ${independentlyCalculated}`);
    process.exit(1);
  }

  writeJson('reports/decision-check.json', {
    status: 'match',
    recalculatedDecision: independentlyCalculated,
    originalDecision: storedDecision?.decision
  });

  console.log(`Decision check passed: ${independentlyCalculated}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  decisionCheck();
}
