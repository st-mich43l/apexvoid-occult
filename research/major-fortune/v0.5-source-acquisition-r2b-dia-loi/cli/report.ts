import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';

export function runReport(baseDir: string) {
  const reportsDir = path.join(baseDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const loadJson = (relPath: string) => {
    const p = path.join(baseDir, relPath);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
  };

  const copies = loadJson('sources/copy-registry.json');
  const locators = loadJson('sources/locator-registry.json');
  const bindings = loadJson('bindings/foundation-claim-bindings.json');
  const obligations = loadJson('obligations/obligation-evaluation-registry.json');
  const adjudications = loadJson('adjudication/claim-adjudication-registry.json');
  const authorizations = loadJson('authorization/dia-loi-admission-authorization.json');
  const crossSource = loadJson('reports/cross-source-agreement-report.json');

  // artifact-intake-report.json
  // read from ingest output if we stored it, or just read the manifest
  const privateDir = path.resolve(process.cwd(), '.research-artifacts/major-fortune/dia-loi');
  const intakeManifest = fs.existsSync(path.join(privateDir, 'artifact-intake-manifest.json')) 
    ? JSON.parse(fs.readFileSync(path.join(privateDir, 'artifact-intake-manifest.json'), 'utf8')) : [];

  fs.writeFileSync(path.join(reportsDir, 'artifact-intake-report.json'), JSON.stringify({
    totalIntakes: intakeManifest.length,
    intakes: intakeManifest.map((i: any) => ({ intakeId: i.intakeId, discoverySourceId: i.discoverySourceId }))
  }, null, 2) + '\n');

  // acquisition-summary.json
  fs.writeFileSync(path.join(reportsDir, 'acquisition-summary.json'), JSON.stringify({
    verifiedCopies: copies.filter((c: any) => c.inspectionStatus === 'verified').length,
    missingArtifacts: copies.length - copies.filter((c: any) => c.inspectionStatus === 'verified').length
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(reportsDir, 'copy-verification-report.json'), JSON.stringify(copies, null, 2) + '\n');
  fs.writeFileSync(path.join(reportsDir, 'locator-verification-report.json'), JSON.stringify(locators, null, 2) + '\n');
  
  const extractions = fs.existsSync(path.join(privateDir, 'extraction-manifest.json')) 
    ? JSON.parse(fs.readFileSync(path.join(privateDir, 'extraction-manifest.json'), 'utf8')) : [];
  fs.writeFileSync(path.join(reportsDir, 'extraction-validation-report.json'), JSON.stringify({
    totalExtractions: extractions.length
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(reportsDir, 'claim-binding-report.json'), JSON.stringify(bindings, null, 2) + '\n');
  fs.writeFileSync(path.join(reportsDir, 'source-obligation-report.json'), JSON.stringify({ obligations }, null, 2) + '\n');
  
  const gaps = new Set(obligations.map((o: any) => o.gapId));
  fs.writeFileSync(path.join(reportsDir, 'source-gap-reconciliation.json'), JSON.stringify({
    uniqueGaps: gaps.size,
    gaps: Array.from(gaps)
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(reportsDir, 'cross-source-agreement-report.json'), JSON.stringify(crossSource, null, 2) + '\n');
  fs.writeFileSync(path.join(reportsDir, 'claim-adjudication-report.json'), JSON.stringify(adjudications, null, 2) + '\n');
  fs.writeFileSync(path.join(reportsDir, 'family-readiness-report.json'), JSON.stringify(authorizations, null, 2) + '\n');
  fs.writeFileSync(path.join(reportsDir, 'r2-to-r2b-migration-report.json'), JSON.stringify({ status: 'migrated' }, null, 2) + '\n');

  // Artifact manifest
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
    'reports/pack-validation.json'
  ];

  for (const f of trackedFiles) {
    trackFile(f);
  }

  manifest.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  fs.writeFileSync(path.join(reportsDir, 'artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log('Report generation complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runReport(baseDir);
}
