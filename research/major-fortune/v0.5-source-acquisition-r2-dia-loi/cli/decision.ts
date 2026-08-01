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

export function decision() {
  const auth = readJson('reports/dia-loi-admission-authorization.json') || [];
  
  const allBlocked = auth.every((a: any) => a.authorizedStatus === 'blocked');
  const anyBlockedMissingProvenance = auth.some((a: any) => a.blockingReasonCodes.includes('missing-provenance'));
  
  let finalDecision = 'PROMOTE_DIA_LOI_TO_SOURCE_VERIFIED_CANDIDATE';
  
  if (allBlocked) {
    if (anyBlockedMissingProvenance) {
      finalDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
    } else {
      finalDecision = 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION';
    }
  }

  writeJson('reports/decision.json', {
    decision: finalDecision,
    families: auth.map((a: any) => ({
      familyId: a.familyId,
      schoolScope: a.schoolScope,
      decision: a.authorizedStatus === 'blocked' ? 'blocked' : 'authorized',
      reasons: a.blockingReasonCodes
    }))
  });

  console.log(`Successfully generated decision: ${finalDecision}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  decision();
}
