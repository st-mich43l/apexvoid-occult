import { LocatorInspectionRecord, VerifiedSourceCopy, VerifiedLocator } from './types';
import { sha256File } from './canonical-json';
import { ValidationError } from './errors';
import fs from 'fs';
import path from 'path';

export function verifyLocators(
  inspections: LocatorInspectionRecord[],
  verifiedCopies: VerifiedSourceCopy[]
): VerifiedLocator[] {
  const results: VerifiedLocator[] = [];

  for (const inspection of inspections) {
    const copy = verifiedCopies.find(c => c.copyIdentityId === inspection.copyIdentityId);

    if (!copy || copy.inspectionStatus !== 'verified') {
      results.push({
        locatorId: inspection.locatorId,
        sourceId: copy ? copy.sourceId : 'UNKNOWN-SOURCE',
        copyIdentityId: inspection.copyIdentityId,
        volume: null,
        chapter: inspection.chapter,
        section: inspection.section,
        pageStart: inspection.pageStart,
        pageEnd: inspection.pageEnd,
        scanId: null,
        pageImageHashes: [],
        verificationStatus: 'unverified',
        verifiedBy: null,
        verificationNotes: ['Unverified due to missing or unverified copy.']
      });
      continue;
    }

    if (inspection.pageStart !== null && inspection.pageEnd !== null) {
      if (inspection.pageEnd < inspection.pageStart) {
        throw new ValidationError(`Invalid page range in locator ${inspection.locatorId}: end ${inspection.pageEnd} < start ${inspection.pageStart}`);
      }
    }

    const hashes: string[] = [];
    if (inspection.inspectedPageArtifactPaths && inspection.inspectedPageArtifactPaths.length > 0) {
      for (const artifactPath of inspection.inspectedPageArtifactPaths) {
        const absPath = path.resolve(process.cwd(), artifactPath);
        if (!fs.existsSync(absPath)) {
          throw new ValidationError(`Page artifact not found: ${artifactPath} for locator ${inspection.locatorId}`);
        }
        hashes.push(sha256File(absPath));
      }
    }

    if (['verified', 'located', 'inspected'].includes(inspection.inspectionDecision) && hashes.length === 0) {
      throw new ValidationError(`Locator ${inspection.locatorId} marked as ${inspection.inspectionDecision} must have at least one page artifact.`);
    }

    results.push({
      locatorId: inspection.locatorId,
      sourceId: copy.sourceId,
      copyIdentityId: inspection.copyIdentityId,
      volume: null,
      chapter: inspection.chapter,
      section: inspection.section,
      pageStart: inspection.pageStart,
      pageEnd: inspection.pageEnd,
      scanId: null,
      pageImageHashes: hashes,
      verificationStatus: inspection.inspectionDecision,
      verifiedBy: inspection.verifiedBy,
      verificationNotes: inspection.inspectionNotes || []
    });
  }

  return results;
}
