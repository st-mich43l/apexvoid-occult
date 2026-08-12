import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateIntakes } from '../src/validate-intake';
import type { ArtifactIntakeRecord } from '../src/types';

const PRIVATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-intake-test-'));

function makeIntake(overrides: Partial<ArtifactIntakeRecord> = {}): ArtifactIntakeRecord {
  return {
    intakeId: 'INTAKE-TEST-001',
    discoverySourceId: 'DISCOVERY-TEST-001',
    normalizedArtifactPath: 'test-artifact.pdf',
    acquisitionMethod: 'owned-physical-copy-scan',
    rightsNotes: ['Test rights note'],
    ...overrides,
  };
}

describe('R3 Artifact Intake Validation', () => {
  it('rejects intake when file does not exist', () => {
    const results = validateIntakes([makeIntake({ normalizedArtifactPath: 'nonexistent.pdf' })], PRIVATE_DIR);
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('ARTIFACT_FILE_NOT_FOUND');
  });

  it('accepts intake when file exists and no provided SHA', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book.pdf');
    fs.writeFileSync(testFile, 'test content for hashing');
    const results = validateIntakes(
      [makeIntake({ normalizedArtifactPath: 'test-book.pdf' })],
      PRIVATE_DIR
    );
    expect(results[0].isValid).toBe(true);
    expect(results[0].computedSha256).toBeTruthy();
    expect(results[0].byteLength).toBeGreaterThan(0);
  });

  it('passes when provided SHA-256 matches computed hash', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book2.pdf');
    const content = 'deterministic content';
    fs.writeFileSync(testFile, content);
    const crypto = require('crypto');
    const expectedHash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const results = validateIntakes(
      [makeIntake({ normalizedArtifactPath: 'test-book2.pdf', providedSha256: expectedHash })],
      PRIVATE_DIR
    );
    expect(results[0].isValid).toBe(true);
    expect(results[0].hashMatch).toBe(true);
  });

  it('rejects when provided SHA-256 mismatches computed hash', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book3.pdf');
    fs.writeFileSync(testFile, 'some content');
    const results = validateIntakes(
      [makeIntake({ normalizedArtifactPath: 'test-book3.pdf', providedSha256: 'deadbeef' })],
      PRIVATE_DIR
    );
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('SHA256_MISMATCH');
  });

  it('rejects intake without rights notes', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book4.pdf');
    fs.writeFileSync(testFile, 'content');
    const results = validateIntakes(
      [makeIntake({ normalizedArtifactPath: 'test-book4.pdf', rightsNotes: [] })],
      PRIVATE_DIR
    );
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('MISSING_RIGHTS_NOTES');
  });

  it('rejects duplicate intake for same discoverySourceId', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book5.pdf');
    fs.writeFileSync(testFile, 'content');
    const duplicateIntakes = [
      makeIntake({ intakeId: 'INTAKE-A', discoverySourceId: 'DISC-001', normalizedArtifactPath: 'test-book5.pdf' }),
      makeIntake({ intakeId: 'INTAKE-B', discoverySourceId: 'DISC-001', normalizedArtifactPath: 'test-book5.pdf' }),
    ];
    const results = validateIntakes(duplicateIntakes, PRIVATE_DIR);
    const errors = results.flatMap(r => r.errors);
    expect(errors.some(e => e.startsWith('DUPLICATE_DISCOVERY_SOURCE'))).toBe(true);
  });

  it('redacts absolute paths from output', () => {
    const results = validateIntakes([makeIntake({ normalizedArtifactPath: 'test-abs.pdf' })], PRIVATE_DIR);
    // normalizedArtifactPath in the result must not contain absolute home path
    const absPathPattern = /(\/home\/|\/Users\/)/;
    expect(absPathPattern.test(results[0].normalizedArtifactPath)).toBe(false);
  });

  it('rejects invalid acquisition method', () => {
    const testFile = path.join(PRIVATE_DIR, 'test-book6.pdf');
    fs.writeFileSync(testFile, 'content');
    const results = validateIntakes(
      [makeIntake({ normalizedArtifactPath: 'test-book6.pdf', acquisitionMethod: 'downloaded-illegally' as any })],
      PRIVATE_DIR
    );
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors.some(e => e.startsWith('INVALID_ACQUISITION_METHOD'))).toBe(true);
  });
});
