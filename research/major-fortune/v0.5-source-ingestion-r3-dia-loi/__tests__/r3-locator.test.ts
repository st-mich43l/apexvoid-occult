import { describe, it, expect } from 'vitest';
import { verifyLocators } from '../src/verify-locator';
import type { LocatorInspectionRecord, VerifiedSourceCopy } from '../src/types';

function makeVerifiedCopy(copyIdentityId: string): VerifiedSourceCopy {
  return {
    copyIdentityId,
    canonicalWorkId: 'WORK-A',
    editionIdentityId: null,
    schoolScope: 'nam-phai',
    sha256: 'aaaa',
    byteLength: 100,
    inspectionStatus: 'verified',
    identityDecision: 'verified',
    verifiedBy: 'reviewer',
    verificationNotes: ['Verified'],
    lineageStatus: 'verified',
  };
}

function makeLocatorInspection(overrides: Partial<LocatorInspectionRecord> = {}): LocatorInspectionRecord {
  return {
    locatorId: 'LOC-001',
    copyIdentityId: 'CID-VERIFIED',
    printedPageFrom: 10,
    printedPageTo: 15,
    digitalPageFrom: null,
    digitalPageTo: null,
    chapterOrSection: 'Chapter 3',
    inspectedPageHashes: ['hash-of-page-10'],
    inspectionStatus: 'verified',
    inspectionNotes: ['Pages inspected physically'],
    ...overrides,
  };
}

describe('R3 Locator Verification', () => {
  it('rejects locator on unverified copy', () => {
    const unverifiedCopy: VerifiedSourceCopy = {
      ...makeVerifiedCopy('CID-UNVERIFIED'),
      inspectionStatus: 'inspected-unverified',
    };
    const locators = verifyLocators([makeLocatorInspection({ copyIdentityId: 'CID-UNVERIFIED' })], [unverifiedCopy]);
    expect(locators[0].verificationStatus).toBe('rejected');
    expect(locators[0].inspectionNotes.some(n => n.includes('copy not verified'))).toBe(true);
  });

  it('rejects locator with no page hashes', () => {
    const copy = makeVerifiedCopy('CID-VERIFIED');
    const locators = verifyLocators(
      [makeLocatorInspection({ inspectedPageHashes: [] })],
      [copy]
    );
    expect(locators[0].verificationStatus).toBe('rejected');
    expect(locators[0].inspectionNotes.some(n => n.includes('page hashes'))).toBe(true);
  });

  it('accepts verified locator with page hashes', () => {
    const copy = makeVerifiedCopy('CID-VERIFIED');
    const locators = verifyLocators([makeLocatorInspection()], [copy]);
    expect(locators[0].verificationStatus).toBe('verified');
    expect(locators[0].inspectedPageHashes).toHaveLength(1);
  });

  it('marks unresolved locator as unresolved', () => {
    const copy = makeVerifiedCopy('CID-VERIFIED');
    const locators = verifyLocators(
      [makeLocatorInspection({ inspectionStatus: 'unresolved' })],
      [copy]
    );
    expect(locators[0].verificationStatus).toBe('unresolved');
  });

  it('rejects locator with inspectionStatus rejected', () => {
    const copy = makeVerifiedCopy('CID-VERIFIED');
    const locators = verifyLocators(
      [makeLocatorInspection({ inspectionStatus: 'rejected', inspectedPageHashes: ['hash'] })],
      [copy]
    );
    expect(locators[0].verificationStatus).toBe('rejected');
  });
});
