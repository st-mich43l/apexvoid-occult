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

describe('Major Fortune V0.5 Dia Loi R2b CI Baseline', () => {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');

  beforeAll(() => {
    // Run the pipeline for baseline
    runGeneration(baseDir);
    makeDecision(baseDir);
    runReport(baseDir);
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
    expect(check.actualDecision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
    expect(check.tamperedAuthorization).toBe(false);
  });

  it('passes validate', () => {
    // We must mock console.log and process.exit to not kill vitest if we were testing failure,
    // but here we expect it to succeed.
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
