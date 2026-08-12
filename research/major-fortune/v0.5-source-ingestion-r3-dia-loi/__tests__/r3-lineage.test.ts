import { describe, expect, it } from 'vitest';
import { evaluateEvidenceScopedIndependence } from '../src/verify-lineage';
import type { EvidenceBearingWork, SourceLineageRecord, EvidenceScopeKey } from '../src/types';

describe('R3 Evidence Scoped Lineage Independence', () => {
  function makeLineage(canonicalWorkId: string, overrides: Partial<SourceLineageRecord> = {}): SourceLineageRecord {
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

  function makeWork(canonicalWorkId: string, overrides: Partial<EvidenceBearingWork> = {}): EvidenceBearingWork {
    return {
      canonicalWorkId,
      copyIdentityIds: ['COPY-1'],
      locatorIds: ['LOC-1'],
      extractionIds: ['EXT-1'],
      familyId: 'principal-star-dignity',
      schoolScope: 'nam-phai',
      claimId: 'CLAIM-1',
      propositionKey: 'PROP-A',
      supportPolarity: 'supports',
      lineageId: canonicalWorkId,
      ...overrides,
    };
  }

  const scope: EvidenceScopeKey = {
    familyId: 'principal-star-dignity',
    schoolScope: 'nam-phai',
    claimId: 'CLAIM-1',
    dimension: 'crossSourceAgreement'
  };

  it('fails closed for 0 works', () => {
    const result = evaluateEvidenceScopedIndependence(scope, [], []);
    expect(result.status).toBe('insufficient');
  });

  it('fails closed for 1 work', () => {
    const result = evaluateEvidenceScopedIndependence(scope, [makeWork('WORK-A')], [makeLineage('WORK-A')]);
    expect(result.status).toBe('insufficient');
  });

  it('fails closed for unknown lineage status', () => {
    const lineage = [
      makeLineage('WORK-A'),
      makeLineage('WORK-B', { lineageStatus: 'unknown' }),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('unknown');
    expect(result.blockerReasonCodes.some(rc => rc.includes('UNKNOWN_LINEAGE'))).toBe(true);
  });

  it('marks same-edition-family as dependent', () => {
    const lineage = [
      makeLineage('WORK-A', { editionFamilyId: 'FAMILY-X' }),
      makeLineage('WORK-B', { editionFamilyId: 'FAMILY-X' }),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('SAME_EDITION_FAMILY'))).toBe(true);
  });

  it('marks translation of original as dependent', () => {
    const lineage = [
      makeLineage('WORK-A', { translationOfCanonicalWorkId: 'WORK-B' }),
      makeLineage('WORK-B'),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
    expect(result.blockerReasonCodes.some(rc => rc.includes('A_TRANSITIVELY_DEPENDENT_ON_B'))).toBe(true);
  });

  it('marks derived work as dependent', () => {
    const lineage = [
      makeLineage('WORK-A', { derivedFromCanonicalWorkIds: ['WORK-B'] }),
      makeLineage('WORK-B'),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
  });

  it('marks commentary as dependent', () => {
    const lineage = [
      makeLineage('WORK-A', { commentaryOnCanonicalWorkIds: ['WORK-B'] }),
      makeLineage('WORK-B'),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
  });

  it('marks same authorship lineage as dependent', () => {
    const lineage = [
      makeLineage('WORK-A', { authorshipLineageId: 'AUTHOR-X' }),
      makeLineage('WORK-B', { authorshipLineageId: 'AUTHOR-X' }),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
  });

  it('two independently verified works with different lineage are independent', () => {
    const lineage = [
      makeLineage('WORK-A', { authorshipLineageId: 'AUTHOR-X', editionFamilyId: 'FAM-A' }),
      makeLineage('WORK-B', { authorshipLineageId: 'AUTHOR-Y', editionFamilyId: 'FAM-B' }),
    ];
    const works = [makeWork('WORK-A'), makeWork('WORK-B')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('independent-agreement');
    expect(result.independentCanonicalWorkIds).toContain('WORK-A');
  });

  it('two copies of the same canonical work are NOT independent', () => {
    const works = [
      makeWork('WORK-A', { copyIdentityIds: ['COPY-1'] }),
      makeWork('WORK-A', { copyIdentityIds: ['COPY-2'] }),
    ];
    const lineage = [makeLineage('WORK-A')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('insufficient');
  });

  it('detects contradiction when polarities are opposed', () => {
    const lineage = [makeLineage('WORK-A'), makeLineage('WORK-B')];
    const works = [
      makeWork('WORK-A', { supportPolarity: 'supports' }),
      makeWork('WORK-B', { supportPolarity: 'contradicts' }),
    ];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('independent-conflict');
    expect(result.blockerReasonCodes).toContain('CONFLICTED_DOCTRINE:PROP-A');
  });

  it('requires same proposition for agreement', () => {
    const lineage = [makeLineage('WORK-A'), makeLineage('WORK-B')];
    const works = [
      makeWork('WORK-A', { propositionKey: 'PROP-A' }),
      makeWork('WORK-B', { propositionKey: 'PROP-B' }),
    ];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    // Neither PROP-A nor PROP-B has enough works
    expect(result.status).toBe('insufficient');
  });

  it('detects transitive dependencies across multiple hops', () => {
    const lineage = [
      makeLineage('WORK-A', { derivedFromCanonicalWorkIds: ['WORK-B'] }),
      makeLineage('WORK-B', { translationOfCanonicalWorkId: 'WORK-C' }),
      makeLineage('WORK-C'),
    ];
    // We only have copies of A and C
    const works = [makeWork('WORK-A'), makeWork('WORK-C')];
    const result = evaluateEvidenceScopedIndependence(scope, works, lineage);
    expect(result.status).toBe('dependent');
  });
});
