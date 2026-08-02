import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';

export function runReport(baseDir: string, overrides?: { privateDir?: string, tmpDir?: string }) {
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
  const privateDir = overrides?.privateDir || path.resolve(process.cwd(), '.research-artifacts/major-fortune/dia-loi');
  const intakeManifest = fs.existsSync(path.join(privateDir, 'artifact-intake-manifest.json'))
    ? JSON.parse(fs.readFileSync(path.join(privateDir, 'artifact-intake-manifest.json'), 'utf8')) : [];

  fs.writeFileSync(path.join(reportsDir, 'artifact-intake-report.json'), JSON.stringify({
    totalIntakes: intakeManifest.length,
    intakes: intakeManifest.map((i: any) => ({ intakeId: i.intakeId, discoverySourceId: i.discoverySourceId }))
  }, null, 2) + '\n');

  const tmpDir = overrides?.tmpDir || path.resolve(process.cwd(), '.tmp/major-fortune-dia-loi-r2b');
  const normalizedIntakePath = path.join(tmpDir, 'normalized-intake.json');
  let intakes = [];
  if (fs.existsSync(normalizedIntakePath)) {
    intakes = JSON.parse(fs.readFileSync(normalizedIntakePath, 'utf8'));
  }

  const discoveryRegistryPath = path.join(baseDir, 'discovery/discovery-source-registry.json');
  const discoveryRegistry = fs.existsSync(discoveryRegistryPath) ? JSON.parse(fs.readFileSync(discoveryRegistryPath, 'utf8')) : [];
  const discoveryLeads = discoveryRegistry.length;

  const intakesSupplied = intakes.length;
  const missingArtifacts = discoveryLeads - intakesSupplied;

  const acquiredUninspected = copies.filter(
    (c: any) => c.inspectionStatus === "acquired-uninspected"
  ).length;

  const inspectedUnverified = copies.filter(
    (c: any) => c.inspectionStatus === "inspected-unverified"
  ).length;

  const verifiedCopies = copies.filter(
    (c: any) => c.inspectionStatus === "verified"
  ).length;

  const rejectedCopies = copies.filter(
    (c: any) => c.inspectionStatus === "rejected"
  ).length;

  const artifactsAcquired = acquiredUninspected + inspectedUnverified + verifiedCopies + rejectedCopies;

  if (artifactsAcquired !== intakesSupplied) {
    throw new Error(`Reconciliation failure: artifactsAcquired (${artifactsAcquired}) does not match intakesSupplied (${intakesSupplied})`);
  }

  if (missingArtifacts < 0) {
    throw new Error(`Negative missingArtifacts calculated: ${missingArtifacts}`);
  }

  if (discoveryLeads !== missingArtifacts + artifactsAcquired) {
    throw new Error(`Reconciliation failure: discoveryLeads (${discoveryLeads}) != missingArtifacts (${missingArtifacts}) + artifactsAcquired (${artifactsAcquired})`);
  }

  fs.writeFileSync(path.join(reportsDir, 'acquisition-summary.json'), JSON.stringify({
    discoveryLeads,
    intakesSupplied,
    artifactsAcquired,
    missingArtifacts,
    acquiredUninspected,
    inspectedUnverified,
    verifiedCopies,
    rejectedCopies
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

  console.log('Report generation complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runReport(baseDir);
}
