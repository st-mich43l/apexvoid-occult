import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';

export function runManifest(baseDir: string) {
  const reportsDir = path.join(baseDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const manifest: any[] = [];
  const trackFile = (relPath: string) => {
    const fullPath = path.join(baseDir, relPath);
    if (fs.existsSync(fullPath)) {
      manifest.push({
        relativePath: relPath,
        sha256: sha256File(fullPath),
        byteLength: fs.statSync(fullPath).size
      });
    }
  };

  const trackedFiles = [
    'sources/copy-registry.json',
    'sources/locator-registry.json',
    'bindings/foundation-claim-bindings.json',
    'obligations/obligation-evaluation-registry.json',
    'adjudication/claim-adjudication-registry.json',
    'authorization/dia-loi-admission-authorization.json',
    'reports/decision.json',
    'reports/decision-check.json',
    'reports/acquisition-summary.json',
    'reports/artifact-intake-report.json',
    'reports/copy-verification-report.json',
    'reports/locator-verification-report.json',
    'reports/extraction-validation-report.json',
    'reports/claim-binding-report.json',
    'reports/source-obligation-report.json',
    'reports/source-gap-reconciliation.json',
    'reports/cross-source-agreement-report.json',
    'reports/claim-adjudication-report.json',
    'reports/family-readiness-report.json',
    'reports/r2-to-r2b-migration-report.json',
    'reports/determinism-report.json'
  ];

  for (const f of trackedFiles) {
    trackFile(f);
  }

  manifest.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  fs.writeFileSync(path.join(reportsDir, 'artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('Artifact manifest generation complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runManifest(baseDir);
}
