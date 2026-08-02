import { describe, it, expect, beforeAll } from 'vitest';
import { runGeneration } from '../cli/generate';
import { runValidate } from '../cli/validate';
import { runDecisionCheck } from '../cli/decision-check';
import { testDeterminism } from '../cli/determinism';
import path from 'path';
import fs from 'fs';
import { runReport } from '../cli/report';
import { makeDecision } from '../cli/decision';
import { runManifest } from '../cli/manifest';
import { runIngest } from '../cli/ingest';

describe('Major Fortune V0.5 Dia Loi R2b CI Baseline', () => {
  const sourceBaseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  const baseDir = path.resolve(process.cwd(), '.tmp/test-packs/baseline');

  beforeAll(() => {
    // Isolate by copying source files to tmp
    fs.rmSync(baseDir, { recursive: true, force: true });
    fs.mkdirSync(baseDir, { recursive: true });

    // We only need discovery
    fs.cpSync(path.join(sourceBaseDir, 'discovery'), path.join(baseDir, 'discovery'), { recursive: true });

    // Run the pipeline for baseline (no artifacts)
    runIngest(baseDir, { tmpDir: path.join(baseDir, '.tmp') });
    runGeneration(baseDir, { tmpDir: path.join(baseDir, '.tmp') });
    makeDecision(baseDir);
    runReport(baseDir, { tmpDir: path.join(baseDir, '.tmp') });
    runDecisionCheck(baseDir);
    runManifest(baseDir);
  });

  it('generates zero verified copies when artifacts are absent', () => {
    const copies = JSON.parse(fs.readFileSync(path.join(baseDir, 'sources/copy-registry.json'), 'utf8'));
    const verified = copies.filter((c: any) => c.inspectionStatus === 'verified');
    expect(verified.length).toBe(0);
  });

  it('produces blocked authorizations for all lanes', () => {
    const auths = JSON.parse(fs.readFileSync(path.join(baseDir, 'authorization/dia-loi-admission-authorization.json'), 'utf8'));
    expect(auths.length).toBe(4);
    for (const auth of auths) {
      expect(auth.authorizedStatus).toBe('blocked');
    }
  });

  it('derives KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS decision (not MISSING_PROVENANCE)', () => {
    const decision = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/decision.json'), 'utf8'));
    expect(decision.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
  });

  it('passes decision check', () => {
    expect(() => runDecisionCheck(baseDir)).not.toThrow();
    const check = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/decision-check.json'), 'utf8'));
    expect(check.status).toBe('match');
    expect(check.decisionMismatch).toBe(false);
    expect(check.authorizationMismatchLanes.length).toBe(0);
    expect(check.obligationMismatchIds.length).toBe(0);
  });

  it('passes validate', () => {
    expect(() => runValidate(baseDir)).not.toThrow();
    const val = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/pack-validation.json'), 'utf8'));
    expect(val.status).toBe('valid');
  });

  it('passes determinism test', () => {
    expect(() => testDeterminism(baseDir)).not.toThrow();
    const det = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/determinism-report.json'), 'utf8'));
    expect(det.status).toBe('deterministic');
  });
});
