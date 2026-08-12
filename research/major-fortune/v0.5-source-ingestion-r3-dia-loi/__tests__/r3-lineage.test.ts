import { describe, it, expect } from 'vitest';
import { evaluateLineageIndependence } from '../src/verify-lineage';
import type { VerifiedSourceCopy, SourceLineageRecord } from '../src/types';

function makeVerifiedCopy(
  canonicalWorkId: string,
  schoolScope: 'nam-phai' | 'trung-chau' = 'nam-phai'
): VerifiedSourceCopy {
  return {
    copyIdentityId: `CID-${canonicalWorkId}`,
    canonicalWorkId,
    editionIdentityId: null,
    schoolScope,
    sha256: 'aaaa',
    byteLength: 100,
    inspectionStatus: 'verified',
    identityDecision: 'verified',
    verifiedBy: 'test-reviewer',
    verificationNotes: ['Verified by test'],
    lineageStatus: 'verified',
  };
}

function makeLineage(
  canonicalWorkId: string,
  overrides: Partial<SourceLineageRecord> = {}
): SourceLineageRecord {
  return {
    canonicalWorkId,
    authorshipLineageId: null,
    sourceTraditionId: null,
    translationOfCanonicalWorkId: null,
    derivedFromCanonicalWorkIds: [],
    commentaryOnCanonicalWorkIds: [],
    editionFamilyId: null,
    independenceNotes: [],
    lineageStatus: 'verified',
    ...overrides,
  };
}

describe('R3 Source Lineage Independence', () => {
  it('returns insufficient when no verified copies exist', () => {
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', [], []);
    expect(result.status).toBe('insufficient');
    expect(result.blockerReasonCodes).toContain('NO_VERIFIED_COPIES');
  });

  it('returns insufficient with only one verified copy', () => {
    const copies = [makeVerifiedCopy('WORK-A')];
    const lineage = [makeLineage('WORK-A')];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('insufficient');
    expect(result.blockerReasonCodes).toContain('INSUFFICIENT_CANONICAL_WORKS');
  });

  it('fails closed for unknown lineage status', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { lineageStatus: 'unknown' }),
      makeLineage('WORK-B'),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('unknown');
    expect(result.blockerReasonCodes.some(rc => rc.includes('UNKNOWN_LINEAGE'))).toBe(true);
  });

  it('marks same-edition-family as dependent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { editionFamilyId: 'FAMILY-X' }),
      makeLineage('WORK-B', { editionFamilyId: 'FAMILY-X' }),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('SAME_EDITION_FAMILY'))).toBe(true);
  });

  it('marks translation of original as dependent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { translationOfCanonicalWorkId: 'WORK-B' }),
      makeLineage('WORK-B'),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('TRANSLATION'))).toBe(true);
  });

  it('marks derived work as dependent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { derivedFromCanonicalWorkIds: ['WORK-B'] }),
      makeLineage('WORK-B'),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('DERIVED_FROM'))).toBe(true);
  });

  it('marks commentary as dependent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { commentaryOnCanonicalWorkIds: ['WORK-B'] }),
      makeLineage('WORK-B'),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('COMMENTARY'))).toBe(true);
  });

  it('marks same authorship lineage as dependent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { authorshipLineageId: 'AUTHOR-X' }),
      makeLineage('WORK-B', { authorshipLineageId: 'AUTHOR-X' }),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('SAME_AUTHORSHIP_LINEAGE'))).toBe(true);
  });

  it('two independently verified works with different lineage are independent', () => {
    const copies = [makeVerifiedCopy('WORK-A'), makeVerifiedCopy('WORK-B')];
    const lineage = [
      makeLineage('WORK-A', { authorshipLineageId: 'AUTHOR-X', editionFamilyId: 'FAM-A', sourceTraditionId: 'TRAD-A' }),
      makeLineage('WORK-B', { authorshipLineageId: 'AUTHOR-Y', editionFamilyId: 'FAM-B', sourceTraditionId: 'TRAD-B' }),
    ];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('independent');
    expect(result.independentCanonicalWorkIds).toContain('WORK-A');
    expect(result.independentCanonicalWorkIds).toContain('WORK-B');
  });

  it('two copies of the same canonical work are NOT independent', () => {
    // Both copies have the same canonicalWorkId — only 1 unique work
    const copies = [
      makeVerifiedCopy('WORK-A'),
      { ...makeVerifiedCopy('WORK-A'), copyIdentityId: 'CID-WORK-A-2' },
    ];
    const lineage = [makeLineage('WORK-A')];
    const result = evaluateLineageIndependence('principal-star-dignity', 'nam-phai', copies, lineage);
    expect(result.status).toBe('insufficient');
    expect(result.blockerReasonCodes).toContain('INSUFFICIENT_CANONICAL_WORKS');
  });
});
