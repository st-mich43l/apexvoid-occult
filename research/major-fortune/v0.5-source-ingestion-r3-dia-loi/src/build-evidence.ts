import type {
  VerifiedSourceCopy,
  VerifiedLocator,
  ValidatedExtraction,
  SourceLineageRecord,
  EvidenceBearingWork,
  EvidenceScopeKey,
  DiaLoiFamilyId,
  SchoolScope
} from './types';
import { generateDeterministicId } from './canonical-json';

export function buildEvidenceBearingWorks(
  verifiedCopies: VerifiedSourceCopy[],
  verifiedLocators: VerifiedLocator[],
  validatedExtractions: ValidatedExtraction[],
  lineageRegistry: SourceLineageRecord[]
): EvidenceBearingWork[] {
  const works: EvidenceBearingWork[] = [];

  for (const ext of validatedExtractions) {
    if (!ext.isValid) continue;

    const loc = verifiedLocators.find(l => l.locatorId === ext.locatorId);
    if (!loc || loc.verificationStatus !== 'verified') continue;

    const copy = verifiedCopies.find(c => c.copyIdentityId === loc.copyIdentityId);
    if (!copy || copy.inspectionStatus !== 'verified') continue;

    const lineage = lineageRegistry.find(r => r.canonicalWorkId === copy.canonicalWorkId);
    // Even if lineage is unverified, we create the EvidenceBearingWork and let the independence checker fail it
    
    // Create a proposition key deterministically based on what the extraction asserts
    const propParts = [
      ext.familyId,
      ext.schoolScope,
      ext.claimId,
      [...ext.explicitStatementDimensions].sort().join(','),
      ext.majorFortuneTemporalScope
    ];
    const propositionKey = 'PROP-' + generateDeterministicId(propParts.join('|')).slice(0, 8);

    works.push({
      canonicalWorkId: copy.canonicalWorkId,
      copyIdentityIds: [copy.copyIdentityId],
      locatorIds: [loc.locatorId],
      extractionIds: [ext.extractionId],
      familyId: ext.familyId,
      schoolScope: ext.schoolScope,
      claimId: ext.claimId,
      propositionKey,
      supportPolarity: ext.polarity as any,
      lineageId: lineage ? lineage.canonicalWorkId : null
    });
  }

  // Merge identical proposition keys for the same canonical work
  const merged = new Map<string, EvidenceBearingWork>();
  for (const w of works) {
    const key = `${w.canonicalWorkId}|${w.propositionKey}`;
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.copyIdentityIds.push(...w.copyIdentityIds);
      existing.locatorIds.push(...w.locatorIds);
      existing.extractionIds.push(...w.extractionIds);
      existing.copyIdentityIds = [...new Set(existing.copyIdentityIds)];
      existing.locatorIds = [...new Set(existing.locatorIds)];
      existing.extractionIds = [...new Set(existing.extractionIds)];
    } else {
      merged.set(key, w);
    }
  }

  return Array.from(merged.values());
}
