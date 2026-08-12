import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');

function loadJson<T>(relPath: string): T | null {
  const fullPath = path.join(BASE_DIR, relPath);
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
}

describe('R3 Địa Lợi Baseline Integrity', () => {
  it('must have exactly 38 canonical obligations', () => {
    const obligations = loadJson<any[]>('obligations/obligation-evaluation-registry.json');
    expect(Array.isArray(obligations)).toBe(true);
    expect(obligations!.length).toBe(38);
  });

  it('must have exactly 4 lane authorizations', () => {
    const auth = loadJson<any[]>('authorization/dia-loi-admission-authorization.json');
    expect(Array.isArray(auth)).toBe(true);
    expect(auth!.length).toBe(4);
  });

  it('must block all 4 lanes when no private artifacts are present', () => {
    const auth = loadJson<any[]>('authorization/dia-loi-admission-authorization.json');
    expect(auth).not.toBeNull();
    for (const lane of auth!) {
      expect(lane.authorizedStatus).toBe('blocked');
    }
  });

  it('must have a valid decision.json', () => {
    const decision = loadJson<any>('reports/decision.json');
    expect(decision).not.toBeNull();
    expect(typeof decision!.decision).toBe('string');
    expect(Array.isArray(decision!.lanes)).toBe(true);
    expect(decision!.lanes.length).toBe(4);
  });

  it('must produce KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS when no artifacts', () => {
    const decision = loadJson<any>('reports/decision.json');
    expect(decision).not.toBeNull();
    // With no private artifacts ingested, must be missing artifacts
    expect(decision!.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
  });

  it('must have gap reconciliation report with zero discrepancy', () => {
    const reconciliation = loadJson<any>('reports/source-gap-reconciliation.json');
    expect(reconciliation).not.toBeNull();
    expect(reconciliation!.reconciled).toBe(true);
    expect(reconciliation!.discrepancy).toBe(0);
  });

  it('must have a valid pack-validation report', () => {
    const packValidation = loadJson<any>('reports/pack-validation.json');
    expect(packValidation).not.toBeNull();
    expect(packValidation!.status).toBe('valid');
  });

  it('must not contain absolute paths in tracked reports', () => {
    const absPathPattern = /(\/home\/|\/Users\/|[A-Z]:\\Users\\)/;
    const trackedFiles = [
      'reports/acquisition-summary.json',
      'reports/source-independence-report.json',
      'reports/source-obligation-report.json',
      'reports/claim-adjudication-report.json',
      'reports/decision.json',
      'reports/decision-check.json',
    ];
    for (const relPath of trackedFiles) {
      const fullPath = path.join(BASE_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(
          absPathPattern.test(content),
          `Absolute path found in ${relPath}`
        ).toBe(false);
      }
    }
  });

  it('must have decision-check.json with status: match', () => {
    const decisionCheck = loadJson<any>('reports/decision-check.json');
    expect(decisionCheck).not.toBeNull();
    expect(decisionCheck!.status).toBe('match');
  });

  it('must have all 4 lanes in decision.json', () => {
    const decision = loadJson<any>('reports/decision.json');
    expect(decision).not.toBeNull();
    const expectedLanes = [
      { familyId: 'principal-star-dignity', schoolScope: 'nam-phai' },
      { familyId: 'principal-star-dignity', schoolScope: 'trung-chau' },
      { familyId: 'vcd-opposite-palace-borrowing', schoolScope: 'nam-phai' },
      { familyId: 'vcd-opposite-palace-borrowing', schoolScope: 'trung-chau' },
    ];
    for (const expected of expectedLanes) {
      const lane = decision!.lanes.find(
        (l: any) => l.familyId === expected.familyId && l.schoolScope === expected.schoolScope
      );
      expect(lane, `Lane ${expected.familyId}/${expected.schoolScope} missing`).toBeDefined();
    }
  });
});
