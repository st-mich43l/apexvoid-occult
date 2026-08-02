import fs from 'fs';
import path from 'path';
import { validateIntakeManifest } from '../src/validate-intake';
import { SourceArtifactIntakeRecord } from '../src/types';

export function runIngest(baseDir: string, overrides?: { privateDir?: string, tmpDir?: string }): SourceArtifactIntakeRecord[] {
  const privateDir = overrides?.privateDir || path.resolve(process.cwd(), '.research-artifacts/major-fortune/dia-loi');
  const intakeManifestPath = path.join(privateDir, 'artifact-intake-manifest.json');
  const policyPath = path.join(baseDir, 'config/acquisition-policy.json');

  let allowedMethods = [
    "owned-physical-copy-scan",
    "licensed-digital-copy",
    "library-access",
    "public-domain-archive",
    "other-authorized-access"
  ];
  if (fs.existsSync(policyPath)) {
    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    if (policy.allowedMethods) allowedMethods = policy.allowedMethods;
  }

  // 1-13 handled by validateIntakeManifest
  const intakes = validateIntakeManifest(intakeManifestPath, allowedMethods, true);

  const normalized = intakes.map(intake => ({
    ...intake,
    // ensure paths are relative
    localArtifactPath: path.relative(process.cwd(), path.resolve(process.cwd(), intake.localArtifactPath))
  }));

  const tmpDir = overrides?.tmpDir || path.resolve(process.cwd(), '.tmp/major-fortune-dia-loi-r2b');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  fs.writeFileSync(path.join(tmpDir, 'normalized-intake.json'), JSON.stringify(normalized, null, 2));

  if (normalized.length === 0) {
    console.log('Ingest complete (no-op for baseline without artifacts)');
  } else {
    console.log(`Ingested ${normalized.length} artifacts.`);
  }

  return normalized;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runIngest(baseDir);
}
