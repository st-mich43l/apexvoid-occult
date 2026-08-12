import { describe, it, expect } from 'vitest';
import { buildEvidenceBearingWorks } from '../src/build-evidence';
import { evaluateEvidenceScopedIndependence } from '../src/verify-lineage';
import type { ValidatedExtraction, VerifiedLocator, VerifiedSourceCopy, SourceLineageRecord } from '../src/types';

describe('R3 Proposition Semantics & Contamination', () => {
  const makeCopy = (id: string, workId: string): VerifiedSourceCopy => ({
    copyIdentityId: id,
    canonicalWorkId: workId,
    editionIdentityId: null,
    schoolScope: 'nam-phai',
    sha256: 'hash',
    byteLength: 100,
    inspectionStatus: 'verified',
    identityDecision: 'verified',
    verifiedBy: 'system',
    verificationNotes: [],
    lineageStatus: 'verified'
  });

  const makeLoc = (id: string, copyId: string): VerifiedLocator => ({
    locatorId: id,
    copyIdentityId: copyId,
    printedPageFrom: 1,
    printedPageTo: 1,
    digitalPageFrom: 1,
    digitalPageTo: 1,
    chapterOrSection: null,
    inspectedPageHashes: [],
    verificationStatus: 'verified',
    inspectionNotes: []
  });

  const makeExt = (
    id: string,
    locId: string,
    overrides: Partial<ValidatedExtraction> = {}
  ): ValidatedExtraction => ({
    extractionId: id,
    locatorId: locId,
    familyId: 'principal-star-dignity',
    schoolScope: 'nam-phai',
    claimId: 'R3-CLM-TEST',
    subjectKey: 'SUBJ',
    predicateKey: 'PRED',
    objectKey: 'OBJ',
    palaceFrameKey: 'PAL',
    targetFrameKey: 'TGT',
    strengthKey: 'STR',
    exceptionPolicyKey: 'EXC',
    explicitStatementDimensions: [],
    polarity: 'supports',
    majorFortuneTemporalScope: 'explicit',
    reviewerNotes: [],
    extractionStatus: 'verified',
    isValid: true,
    validationErrors: [],
    ...overrides
  });

  const makeLineage = (workId: string): SourceLineageRecord => ({
    canonicalWorkId: workId,
    authorshipLineageId: workId + '-auth',
    sourceTraditionId: workId + '-trad',
    translationOfCanonicalWorkId: null,
    derivedFromCanonicalWorkIds: [],
    commentaryOnCanonicalWorkIds: [],
    editionFamilyId: null,
    independenceNotes: [],
    lineageStatus: 'verified'
  });

  it('same claim + dimensions + different subject -> different propositions', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { subjectKey: 'A' }),
      makeExt('E2', 'L2', { subjectKey: 'B' })
    ];
    const works = buildEvidenceBearingWorks(copies, locs, exts, [makeLineage('W1'), makeLineage('W2')]);
    expect(works[0].propositionKey).not.toBe(works[1].propositionKey);
  });

  it('same claim + dimensions + different palace frame -> different propositions', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { palaceFrameKey: 'A' }),
      makeExt('E2', 'L2', { palaceFrameKey: 'B' })
    ];
    const works = buildEvidenceBearingWorks(copies, locs, exts, [makeLineage('W1'), makeLineage('W2')]);
    expect(works[0].propositionKey).not.toBe(works[1].propositionKey);
  });

  it('same claim + dimensions + different strength semantics -> different propositions', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { strengthKey: 'A' }),
      makeExt('E2', 'L2', { strengthKey: 'B' })
    ];
    const works = buildEvidenceBearingWorks(copies, locs, exts, [makeLineage('W1'), makeLineage('W2')]);
    expect(works[0].propositionKey).not.toBe(works[1].propositionKey);
  });

  it('same proposition + support/support -> agreement candidate', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { polarity: 'supports' }),
      makeExt('E2', 'L2', { polarity: 'supports' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);
    expect(works[0].propositionKey).toBe(works[1].propositionKey);

    const indep = evaluateEvidenceScopedIndependence({ familyId: 'principal-star-dignity', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(indep.status).toBe('independent-agreement');
  });

  it('same proposition + support/qualify -> agreement candidate (no automatic conflict)', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { polarity: 'supports' }),
      makeExt('E2', 'L2', { polarity: 'qualifies' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);

    const indep = evaluateEvidenceScopedIndependence({ familyId: 'principal-star-dignity', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(indep.status).toBe('independent-agreement');
  });

  it('same proposition + support/contradict -> conflict', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { polarity: 'supports' }),
      makeExt('E2', 'L2', { polarity: 'contradicts' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);

    const indep = evaluateEvidenceScopedIndependence({ familyId: 'principal-star-dignity', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(indep.status).toBe('independent-conflict');
  });

  it('same proposition + contradict/contradict -> agreement on contradiction', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { polarity: 'contradicts' }),
      makeExt('E2', 'L2', { polarity: 'contradicts' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);

    const indep = evaluateEvidenceScopedIndependence({ familyId: 'principal-star-dignity', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(indep.status).toBe('independent-agreement');
  });

  it('different propositions from two independent books -> cannot satisfy agreement', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    const exts = [
      makeExt('E1', 'L1', { subjectKey: 'A' }),
      makeExt('E2', 'L2', { subjectKey: 'B' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);

    const indep = evaluateEvidenceScopedIndependence({ familyId: 'principal-star-dignity', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(indep.status).toBe('insufficient');
  });

  it('family contamination: vcd independence remains insufficient if no vcd evidence', () => {
    const copies = [makeCopy('C1', 'W1'), makeCopy('C2', 'W2')];
    const locs = [makeLoc('L1', 'C1'), makeLoc('L2', 'C2')];
    // both are principal-star-dignity
    const exts = [
      makeExt('E1', 'L1', { familyId: 'principal-star-dignity' }),
      makeExt('E2', 'L2', { familyId: 'principal-star-dignity' })
    ];
    const lins = [makeLineage('W1'), makeLineage('W2')];
    const works = buildEvidenceBearingWorks(copies, locs, exts, lins);

    const vcdIndep = evaluateEvidenceScopedIndependence({ familyId: 'vcd-opposite-palace-borrowing', schoolScope: 'nam-phai', claimId: 'R3-CLM-TEST', dimension: 'crossSourceAgreement' }, works, lins);
    expect(vcdIndep.status).toBe('insufficient');
  });
});
