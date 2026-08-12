import { describe, it, expect } from 'vitest';
import { deriveDecision } from '../src/derive-decision';
import type { LaneAuthorization } from '../src/types';

function makeLane(
  familyId: string,
  schoolScope: string,
  blockingReasonCodes: string[]
): LaneAuthorization {
  return {
    familyId: familyId as any,
    schoolScope: schoolScope as any,
    authorizedStatus: 'blocked',
    approvedObligationIds: [],
    approvedClaimAdjudicationIds: [],
    approvedExtractionIds: [],
    approvedVerifiedCopyIds: [],
    approvedIndependentCanonicalWorkIds: [],
    blockingReasonCodes,
  };
}

const ALL_FOUR_FAMILIES_SCHOOLS = [
  ['principal-star-dignity', 'nam-phai'],
  ['principal-star-dignity', 'trung-chau'],
  ['vcd-opposite-palace-borrowing', 'nam-phai'],
  ['vcd-opposite-palace-borrowing', 'trung-chau'],
] as const;

describe('R3 Decision Precedence', () => {
  it('all lanes NO_EXTRACTION_MATCHED → MISSING_ARTIFACTS', () => {
    const lanes = ALL_FOUR_FAMILIES_SCHOOLS.map(([f, s]) =>
      makeLane(f, s, ['NO_EXTRACTION_MATCHED'])
    );
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS');
  });

  it('one lane has INSUFFICIENT_INDEPENDENT_SOURCES → INSUFFICIENT decision (not MISSING_ARTIFACTS)', () => {
    const lanes = [
      makeLane('principal-star-dignity', 'nam-phai', ['INSUFFICIENT_INDEPENDENT_SOURCES']),
      makeLane('principal-star-dignity', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'nam-phai', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
    ];
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES');
  });

  it('conflict beats insufficiency', () => {
    const lanes = ALL_FOUR_FAMILIES_SCHOOLS.map(([f, s]) =>
      makeLane(f, s, ['CONFLICTED_DOCTRINE'])
    );
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE');
  });

  it('MISSING_TEMPORAL_SCOPE beats MISSING_ARTIFACTS', () => {
    const lanes = ALL_FOUR_FAMILIES_SCHOOLS.map(([f, s]) =>
      makeLane(f, s, ['MISSING_TEMPORAL_SCOPE'])
    );
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE');
  });

  it('at least one promoted lane → PROMOTE', () => {
    const lanes: LaneAuthorization[] = [
      {
        ...makeLane('principal-star-dignity', 'nam-phai', []),
        authorizedStatus: 'source-verified-candidate',
      },
      makeLane('principal-star-dignity', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'nam-phai', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
    ];
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE');
    expect(d.promotedLanes).toHaveLength(1);
    expect(d.promotedLanes[0].familyId).toBe('principal-star-dignity');
    expect(d.blockedLanes).toHaveLength(3);
  });

  it('mixed lanes preserve individual blockers', () => {
    const lanes: LaneAuthorization[] = [
      makeLane('principal-star-dignity', 'nam-phai', ['INSUFFICIENT_INDEPENDENT_SOURCES']),
      makeLane('principal-star-dignity', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'nam-phai', ['NO_EXTRACTION_MATCHED']),
      makeLane('vcd-opposite-palace-borrowing', 'trung-chau', ['NO_EXTRACTION_MATCHED']),
    ];
    const d = deriveDecision(lanes);
    // Lane-specific: nam-phai has INSUFFICIENT, others have NO_EXTRACTION
    const namPhaiLane = d.lanes.find(l => l.familyId === 'principal-star-dignity' && l.schoolScope === 'nam-phai');
    expect(namPhaiLane?.reasonCodes).toContain('INSUFFICIENT_INDEPENDENT_SOURCES');
    const trungChauLane = d.lanes.find(l => l.familyId === 'principal-star-dignity' && l.schoolScope === 'trung-chau');
    expect(trungChauLane?.reasonCodes).toContain('NO_EXTRACTION_MATCHED');
  });

  it('PROVENANCE beats MISSING_ARTIFACTS when evidence exists but provenance is incomplete', () => {
    const lanes = ALL_FOUR_FAMILIES_SCHOOLS.map(([f, s]) =>
      makeLane(f, s, ['UNVERIFIED_OBLIGATIONS'])
    );
    const d = deriveDecision(lanes);
    expect(d.decision).toBe('KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE');
  });
});
