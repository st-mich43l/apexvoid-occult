import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runR3Generation } from '../cli/generate';
import { deriveDecision } from '../src/derive-decision';
import { evaluateLineageIndependence } from '../src/verify-lineage';
import type { VerifiedSourceCopy, SourceLineageRecord, LaneAuthorization } from '../src/types';

// Helper to create an isolated test pack directory
function createTestPack(tmpDir: string, srcBase: string): string {
  const testBase = path.join(tmpDir, 'r3-test-pack');
  fs.mkdirSync(testBase, { recursive: true });
  // Copy discovery and lineage into the test pack
  for (const sub of ['discovery', 'lineage']) {
    const src = path.join(srcBase, sub);
    const dst = path.join(testBase, sub);
    if (fs.existsSync(src)) {
      fs.mkdirSync(dst, { recursive: true });
      for (const f of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, f), path.join(dst, f));
      }
    }
  }
  return testBase;
}

describe('R3 Pipeline End-to-End', () => {
  const srcBase = path.resolve(__dirname, '..');
  let tmpDir: string;
  let testBase: string;
  let testTmp: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-pipeline-test-'));
    testBase = createTestPack(tmpDir, srcBase);
    testTmp = path.join(tmpDir, 'r3-tmp');
    fs.mkdirSync(testTmp, { recursive: true });
    // Run generation with no private artifacts
    runR3Generation(testBase, { privateDir: path.join(tmpDir, 'empty-private'), tmpDir: testTmp });
  });

  it('generates exactly 38 obligation evaluations', () => {
    const obs = JSON.parse(
      fs.readFileSync(path.join(testBase, 'obligations/obligation-evaluation-registry.json'), 'utf8')
    );
    expect(obs.length).toBe(38);
  });

  it('all 4 lanes are blocked with no private artifacts', () => {
    const auth = JSON.parse(
      fs.readFileSync(path.join(testBase, 'authorization/dia-loi-admission-authorization.json'), 'utf8')
    ) as LaneAuthorization[];
    expect(auth.length).toBe(4);
    for (const lane of auth) {
      expect(lane.authorizedStatus).toBe('blocked');
    }
  });

  it('no verified copies with no private artifacts', () => {
    const copies = JSON.parse(
      fs.readFileSync(path.join(testBase, 'registries/verified-source-copy-registry.json'), 'utf8')
    );
    expect(copies.filter((c: VerifiedSourceCopy) => c.inspectionStatus === 'verified').length).toBe(0);
  });

  it('decision is MISSING_ARTIFACTS when no artifacts supplied', () => {
    const auth = JSON.parse(
      fs.readFileSync(path.join(testBase, 'authorization/dia-loi-admission-authorization.json'), 'utf8')
    ) as LaneAuthorization[];
    const decision = deriveDecision(auth);
    expect(decision.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
  });

  it('obligation evaluation reconciles to 38', () => {
    const obs = JSON.parse(
      fs.readFileSync(path.join(testBase, 'obligations/obligation-evaluation-registry.json'), 'utf8')
    );
    const counts = { verified: 0, blocked: 0, contradicted: 0, 'not-applicable': 0 };
    for (const o of obs) {
      if (o.status in counts) counts[o.status as keyof typeof counts]++;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(obs.length);
  });

  it('two copies same canonical work are not independent', () => {
    const work = 'WORK-A';
    const copies: VerifiedSourceCopy[] = [
      {
        copyIdentityId: 'CID-1',
        canonicalWorkId: work,
        editionIdentityId: 'ED-1',
        schoolScope: 'nam-phai',
        sha256: 'aaaa',
        byteLength: 100,
        inspectionStatus: 'verified',
        identityDecision: 'verified',
        verifiedBy: 'reviewer',
        verificationNotes: ['ok'],
        lineageStatus: 'verified',
      },
      {
        copyIdentityId: 'CID-2',
        canonicalWorkId: work,
        editionIdentityId: 'ED-2',
        schoolScope: 'nam-phai',
        sha256: 'bbbb',
        byteLength: 200,
        inspectionStatus: 'verified',
        identityDecision: 'verified',
        verifiedBy: 'reviewer',
        verificationNotes: ['ok'],
        lineageStatus: 'verified',
      },
    ];
    const lineage: SourceLineageRecord[] = [
      {
        canonicalWorkId: work,
        authorshipLineageId: null,
        sourceTraditionId: null,
        translationOfCanonicalWorkId: null,
        derivedFromCanonicalWorkIds: [],
        commentaryOnCanonicalWorkIds: [],
        editionFamilyId: 'EDITION-FAM-A',
        independenceNotes: [],
        lineageStatus: 'verified',
      },
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    // Two copies of same work = insufficient (only 1 unique canonical work)
    expect(result.status).toBe('insufficient');
  });

  it('no source binaries in test pack', () => {
    const binaryExtensions = ['.pdf', '.epub', '.mobi', '.djvu'];
    const allFiles = fs.readdirSync(testBase, { recursive: true }) as string[];
    const binaries = allFiles.filter(f => binaryExtensions.some(ext => f.toLowerCase().endsWith(ext)));
    expect(binaries).toHaveLength(0);
  });
});
