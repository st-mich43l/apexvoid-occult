import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTestPack, writeTestInputs } from './test-utils';
import { runIngest } from '../cli/ingest';
import { runGeneration } from '../cli/generate';
import { makeDecision } from '../cli/decision';
import { runReport } from '../cli/report';
import { runDecisionCheck } from '../cli/decision-check';
import { runManifest } from '../cli/manifest';
import { generateDeterministicId } from '../src/canonical-json';
import { runValidate } from '../cli/validate';
import { sha256File } from '../src/canonical-json';

export function setupValidNamPhaiFixtures(baseDir: string, overrides: any = {}) {
  const privateDir = path.join(baseDir, '.private');
  const tmpDir = path.join(baseDir, '.tmp');

  fs.mkdirSync(privateDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const artifactPath = path.join(privateDir, 'book1.pdf');
  fs.writeFileSync(artifactPath, 'mock-content-1');
  const hash1 = sha256File(artifactPath);

  const artifactPath2 = path.join(privateDir, 'book2.pdf');
  fs.writeFileSync(artifactPath2, 'mock-content-2');
  const hash2 = sha256File(artifactPath2);

  const copyId1 = generateDeterministicId('COPY-VERIFIED', `CW-NAM-PHAI-001|ED-001|${hash1}`);
  const copyId2 = generateDeterministicId('COPY-VERIFIED', `CW-NAM-PHAI-002|ED-002|${hash2}`);

  const discovery = [
    {
      discoverySourceId: 'DISCOVERY-NAM-PHAI-001',
      canonicalWorkCandidateId: 'CW-NAM-PHAI-001',
      editionCandidateId: 'ED-001',
      schoolScope: 'nam-phai',
      suppliedMetadata: { title: 'Book 1' }
    },
    {
      discoverySourceId: 'DISCOVERY-NAM-PHAI-002',
      canonicalWorkCandidateId: 'CW-NAM-PHAI-002',
      editionCandidateId: 'ED-002',
      schoolScope: 'nam-phai',
      suppliedMetadata: { title: 'Book 2' }
    }
  ];

  const intakeManifest = [
    {
      intakeId: 'INTAKE-001',
      discoverySourceId: 'DISCOVERY-NAM-PHAI-001',
      localArtifactPath: artifactPath,
      acquisitionMethod: 'public-domain-archive',
      rightsNotes: ['ok'],
      providedSha256: hash1
    },
    {
      intakeId: 'INTAKE-002',
      discoverySourceId: 'DISCOVERY-NAM-PHAI-002',
      localArtifactPath: artifactPath2,
      acquisitionMethod: 'public-domain-archive',
      rightsNotes: ['ok'],
      providedSha256: hash2
    }
  ];

  fs.writeFileSync(path.join(privateDir, 'artifact-intake-manifest.json'), JSON.stringify(intakeManifest));
  fs.writeFileSync(path.join(baseDir, 'discovery/discovery-source-registry.json'), JSON.stringify(discovery));

  const copyInspections = [
    {
      discoverySourceId: 'DISCOVERY-NAM-PHAI-001',
      canonicalWorkId: 'CW-NAM-PHAI-001',
      editionIdentityId: 'ED-001',
      copyIdentityId: copyId1,
      identityDecision: overrides.copyDecision || 'verified',
      verifiedBy: overrides.copyVerifiedBy !== undefined ? overrides.copyVerifiedBy : 'system',
      verificationNotes: overrides.copyVerificationNotes || ['ok']
    },
    {
      discoverySourceId: 'DISCOVERY-NAM-PHAI-002',
      canonicalWorkId: 'CW-NAM-PHAI-002',
      editionIdentityId: 'ED-002',
      copyIdentityId: copyId2,
      identityDecision: overrides.copyDecision || 'verified',
      verifiedBy: overrides.copyVerifiedBy !== undefined ? overrides.copyVerifiedBy : 'system',
      verificationNotes: overrides.copyVerificationNotes || ['ok']
    }
  ];
  fs.writeFileSync(path.join(privateDir, 'copy-identity-inspection-manifest.json'), JSON.stringify(copyInspections));

  // Load from fixtures
  const fixDir = path.resolve(__dirname, 'fixtures/positive-dignity-nam-phai');
  const files = ['claim-registry.json', 'foundation-claim-binding-manifest.json', 'extraction-manifest.json'];
  for (const f of files) {
    const p = path.join(__dirname, 'fixtures/positive-dignity-nam-phai', f);
    if (fs.existsSync(p)) fs.cpSync(p, path.join(privateDir, f));
  }

  // Load and patch locator-inspection-manifest.json
  const locatorFixturePath = path.join(__dirname, 'fixtures/positive-dignity-nam-phai/locator-inspection-manifest.json');
  if (fs.existsSync(locatorFixturePath)) {
    const locators = JSON.parse(fs.readFileSync(locatorFixturePath, 'utf8'));
    locators[0].copyIdentityId = copyId1;
    locators[0].inspectedPageArtifactPaths = [path.relative(process.cwd(), artifactPath)];
    locators[1].copyIdentityId = copyId2;
    locators[1].inspectedPageArtifactPaths = [path.relative(process.cwd(), artifactPath2)];
    fs.writeFileSync(path.join(privateDir, 'locator-inspection-manifest.json'), JSON.stringify(locators, null, 2));
  }

  if (overrides.mutatePrivateDir) overrides.mutatePrivateDir(privateDir);

  return { privateDir, tmpDir };
}

describe('Pipeline Focused Tests', () => {
  it('detects duplicate intake', () => {
    const baseDir = createTestPack('duplicate-intake');
    const { privateDir, tmpDir } = setupValidNamPhaiFixtures(baseDir);

    const intakeManifest = JSON.parse(fs.readFileSync(path.join(privateDir, 'artifact-intake-manifest.json'), 'utf8'));
    intakeManifest.push(intakeManifest[0]); // duplicate
    fs.writeFileSync(path.join(privateDir, 'artifact-intake-manifest.json'), JSON.stringify(intakeManifest));

    expect(() => runIngest(baseDir, { privateDir, tmpDir })).toThrow(/Duplicate intake/);
  });

  it('detects missing copy verification notes', () => {
    const baseDir = createTestPack('missing-notes');
    const { privateDir, tmpDir } = setupValidNamPhaiFixtures(baseDir, { copyVerificationNotes: [] });
    runIngest(baseDir, { privateDir, tmpDir });
    expect(() => runGeneration(baseDir, { privateDir, tmpDir })).toThrow(/verificationNotes is empty/);
  });

  it('executes full positive path and results in promote for nam-phai', () => {
    const baseDir = createTestPack('positive-path');
    const { privateDir, tmpDir } = setupValidNamPhaiFixtures(baseDir);

    runIngest(baseDir, { privateDir, tmpDir });
    runGeneration(baseDir, { privateDir, tmpDir });
    makeDecision(baseDir);
    runReport(baseDir, { privateDir, tmpDir });
    runDecisionCheck(baseDir);
    runManifest(baseDir);
    runValidate(baseDir);

    const decision = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/decision.json'), 'utf8'));
    expect(decision.decision).toBe('PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE');
    expect(decision.promotedLanes.length).toBeGreaterThan(0);
    expect(decision.promotedLanes[0].familyId).toBe('principal-star-dignity');
  });

  it('rejects tampered manifest hash', () => {
    const baseDir = createTestPack('tampered-hash');
    const { privateDir, tmpDir } = setupValidNamPhaiFixtures(baseDir);

    runIngest(baseDir, { privateDir, tmpDir });
    runGeneration(baseDir, { privateDir, tmpDir });
    makeDecision(baseDir);
    runReport(baseDir, { privateDir, tmpDir });
    runDecisionCheck(baseDir);
    runManifest(baseDir);

    const summaryPath = path.join(baseDir, 'reports/acquisition-summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    summary.discoveryLeads = 999;
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    let err: any;
    try {
      runValidate(baseDir);
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
  });

  it('detects cross-source invalidation (single source)', () => {
    const baseDir = createTestPack('cross-source-invalid');
    const { privateDir, tmpDir } = setupValidNamPhaiFixtures(baseDir, {
      mutatePrivateDir: (dir: string) => {
        const extractions = JSON.parse(fs.readFileSync(path.join(dir, 'extraction-manifest.json'), 'utf8'));
        const extFilter = extractions.filter((e: any) => e.extractionId.startsWith('EXT-1'));
        fs.writeFileSync(path.join(dir, 'extraction-manifest.json'), JSON.stringify(extFilter));
      }
    });

    runIngest(baseDir, { privateDir, tmpDir });
    runGeneration(baseDir, { privateDir, tmpDir });
    makeDecision(baseDir);

    const decision = JSON.parse(fs.readFileSync(path.join(baseDir, 'reports/decision.json'), 'utf8'));
    expect(decision.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
    const namphai = decision.lanes.find((l: any) => l.familyId === 'principal-star-dignity' && l.schoolScope === 'nam-phai');
    expect(namphai.reasonCodes).toContain('INSUFFICIENT_INDEPENDENT_SOURCES');
  });
});
