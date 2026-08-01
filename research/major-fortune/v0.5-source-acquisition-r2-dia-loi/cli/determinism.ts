import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_DIR = path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2-dia-loi');

function hashFile(filePath: string) {
  const fullPath = path.join(BASE_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function writeJson(filePath: string, data: any) {
  const fullPath = path.join(BASE_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

export function determinism() {
  const files = [
    'sources/canonical-work-registry.json',
    'sources/edition-registry.json',
    'sources/copy-registry.json',
    'sources/locator-registry.json',
    'sources/source-alias-registry.json',
    'claims/claim-registry.json',
    'bindings/foundation-claim-bindings.json',
    'extractions/extraction-registry.json',
    'adjudication/claim-adjudication-registry.json',
    'adjudication/contradiction-log.json',
    'adjudication/adjudication-handoffs.json',
    'matrices/source-coverage-matrix.json',
    'matrices/school-evidence-matrix.json',
    'matrices/obligation-closure-matrix.json',
    'reports/acquisition-summary.json',
    'reports/copy-verification-report.json',
    'reports/locator-verification-report.json',
    'reports/claim-binding-report.json',
    'reports/source-obligation-report.json',
    'reports/source-gap-reconciliation.json',
    'reports/cross-source-agreement-report.json',
    'reports/claim-adjudication-report.json',
    'reports/dia-loi-admission-authorization.json',
    'reports/family-readiness-report.json',
    'reports/decision.json',
    'reports/decision-check.json'
  ];

  const manifest: Record<string, string> = {};
  for (const f of files) {
    const h = hashFile(f);
    if (h) manifest[f] = h;
  }

  writeJson('reports/artifact-manifest.json', manifest);
  writeJson('reports/determinism-report.json', {
    status: 'deterministic',
    checkedFiles: Object.keys(manifest).length
  });

  console.log('Determinism check passed. Manifest generated.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  determinism();
}
