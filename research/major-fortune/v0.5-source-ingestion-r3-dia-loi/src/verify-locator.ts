import type {
  LocatorInspectionRecord,
  VerifiedLocator,
  VerifiedSourceCopy,
} from './types';

/**
 * Verify locators against the verified copy registry.
 *
 * Rules:
 * - Locator must reference a verified copy (inspectionStatus === 'verified')
 * - Locator must have at least one inspectedPageHash
 * - inspectionStatus must be 'verified' (not just 'unresolved')
 * - No locator may be marked verified without real inspected material
 */
export function verifyLocators(
  locatorInspections: LocatorInspectionRecord[],
  verifiedCopies: VerifiedSourceCopy[]
): VerifiedLocator[] {
  const locators: VerifiedLocator[] = [];

  const verifiedCopyIds = new Set(
    verifiedCopies
      .filter(c => c.inspectionStatus === 'verified')
      .map(c => c.copyIdentityId)
  );

  for (const inspection of locatorInspections) {
    let verificationStatus: VerifiedLocator['verificationStatus'] = 'unresolved';

    if (!verifiedCopyIds.has(inspection.copyIdentityId)) {
      // Locator on unverified copy → reject
      verificationStatus = 'rejected';
      locators.push({
        locatorId: inspection.locatorId,
        copyIdentityId: inspection.copyIdentityId,
        printedPageFrom: inspection.printedPageFrom,
        printedPageTo: inspection.printedPageTo,
        digitalPageFrom: inspection.digitalPageFrom,
        digitalPageTo: inspection.digitalPageTo,
        chapterOrSection: inspection.chapterOrSection,
        inspectedPageHashes: [],
        verificationStatus,
        inspectionNotes: ['REJECTED: copy not verified'],
      });
      continue;
    }

    if (inspection.inspectedPageHashes.length === 0) {
      // No page artifacts → reject
      verificationStatus = 'rejected';
      locators.push({
        locatorId: inspection.locatorId,
        copyIdentityId: inspection.copyIdentityId,
        printedPageFrom: inspection.printedPageFrom,
        printedPageTo: inspection.printedPageTo,
        digitalPageFrom: inspection.digitalPageFrom,
        digitalPageTo: inspection.digitalPageTo,
        chapterOrSection: inspection.chapterOrSection,
        inspectedPageHashes: [],
        verificationStatus,
        inspectionNotes: ['REJECTED: no inspected page hashes provided'],
      });
      continue;
    }

    if (inspection.inspectionStatus !== 'verified') {
      verificationStatus = inspection.inspectionStatus === 'rejected' ? 'rejected' : 'unresolved';
    } else {
      verificationStatus = 'verified';
    }

    locators.push({
      locatorId: inspection.locatorId,
      copyIdentityId: inspection.copyIdentityId,
      printedPageFrom: inspection.printedPageFrom,
      printedPageTo: inspection.printedPageTo,
      digitalPageFrom: inspection.digitalPageFrom,
      digitalPageTo: inspection.digitalPageTo,
      chapterOrSection: inspection.chapterOrSection,
      inspectedPageHashes: inspection.inspectedPageHashes,
      verificationStatus,
      inspectionNotes: inspection.inspectionNotes,
    });
  }

  return locators;
}
