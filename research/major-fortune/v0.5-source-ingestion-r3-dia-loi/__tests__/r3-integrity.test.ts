import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';

const BASE_DIR = path.resolve(__dirname, '..');

describe('R3 Integrity Checks', () => {
  it('decision-check.json must have status: match', () => {
    const fullPath = path.join(BASE_DIR, 'reports/decision-check.json');
    expect(fs.existsSync(fullPath)).toBe(true);
    const dc = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    expect(dc.status).toBe('match');
  });

  it('all 38 obligations in obligation-evaluation-registry.json', () => {
    const fullPath = path.join(BASE_DIR, 'obligations/obligation-evaluation-registry.json');
    expect(fs.existsSync(fullPath)).toBe(true);
    const obs = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    expect(Array.isArray(obs)).toBe(true);
    expect(obs.length).toBe(38);
  });

  it('no obligation is silently absent — obligation count reconciles', () => {
    const obs = JSON.parse(
      fs.readFileSync(path.join(BASE_DIR, 'obligations/obligation-evaluation-registry.json'), 'utf8')
    );
    const recon = JSON.parse(
      fs.readFileSync(path.join(BASE_DIR, 'reports/source-gap-reconciliation.json'), 'utf8')
    );
    expect(recon.canonicalObligationCount).toBe(obs.length);
    expect(recon.reconciled).toBe(true);
  });

  it('manifest hashes are consistent with tracked files', () => {
    const manifestPath = path.join(BASE_DIR, 'reports/artifact-manifest.json');
    if (!fs.existsSync(manifestPath)) return; // Optional in this test
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Array<{
      relativePath: string;
      sha256: string;
      byteLength: number;
    }>;
    for (const entry of manifest) {
      const fullPath = path.join(BASE_DIR, entry.relativePath);
      if (fs.existsSync(fullPath)) {
        expect(sha256File(fullPath)).toBe(entry.sha256);
        expect(fs.statSync(fullPath).size).toBe(entry.byteLength);
      }
    }
  });

  it('determinism report passes', () => {
    const fullPath = path.join(BASE_DIR, 'reports/determinism-report.json');
    expect(fs.existsSync(fullPath)).toBe(true);
    const dr = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    expect(dr.pass).toBe(true);
    expect(dr.mismatchedFiles).toHaveLength(0);
  });

  it('no source binary files are tracked in git', () => {
    // Binary file extensions that must not appear in tracked paths
    const binaryExtensions = ['.pdf', '.epub', '.mobi', '.djvu', '.png', '.jpg', '.jpeg'];
    const allFiles = fs.readdirSync(BASE_DIR, { recursive: true }) as string[];
    const trackedBinaries = allFiles.filter(f =>
      binaryExtensions.some(ext => f.toLowerCase().endsWith(ext))
    );
    expect(trackedBinaries).toHaveLength(0);
  });

  it('tracked decision must not be tampered (recomputed must match)', () => {
    // This is tested by decision-check.ts — here we verify the check passed
    const fullPath = path.join(BASE_DIR, 'reports/decision-check.json');
    expect(fs.existsSync(fullPath)).toBe(true);
    const dc = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    expect(dc.decisionMismatch).toBe(false);
    expect(dc.authorizationMismatchLanes).toHaveLength(0);
  });
});
