import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Major Fortune Địa Lợi R2b Provenance', () => {
  const baseDir = path.resolve(__dirname, '..');

  const loadJson = (relPath: string) => {
    const fullPath = path.join(baseDir, relPath);
    return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
  };

  it('must contain exactly 38 canonical obligations', () => {
    const obligations = loadJson('obligations/obligation-evaluation-registry.json');
    expect(obligations).toBeDefined();
    expect(obligations.length).toBe(38);
  });

  it('must block all four target lanes due to missing artifacts', () => {
    const auth = loadJson('authorization/dia-loi-admission-authorization.json');
    expect(auth).toBeDefined();
    expect(auth.length).toBe(4);

    for (const a of auth) {
      expect(a.authorizedStatus).toBe('blocked');
      expect(a.blockingReasonCodes).toContain('NO_EXTRACTION_MATCHED');
    }
  });

  it('must make KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS decision', () => {
    const decision = loadJson('reports/decision.json');
    expect(decision).toBeDefined();
    expect(decision.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
  });

  it('must not leak absolute paths in the artifact manifest', () => {
    const manifest = loadJson('reports/artifact-manifest.json');
    expect(manifest).toBeDefined();
    for (const m of manifest) {
      expect(m.relativePath.startsWith('/')).toBe(false);
      expect(m.relativePath.includes(process.cwd())).toBe(false);
    }
  });

  it('must reflect 0 provided intakes and exact missing count', () => {
    const summary = loadJson('reports/acquisition-summary.json');
    expect(summary).toBeDefined();
    expect(summary.artifactsAcquired).toBe(0);
    expect(summary.discoveryLeads).toBe(2);
    expect(summary.missingArtifacts).toBe(2);
  });
});
