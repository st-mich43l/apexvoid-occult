import { describe, it, expect, beforeEach } from 'vitest';
import { validateFoundation } from '../cli/validate-foundation';

describe('V0.5 Evidence Gap Foundation Validation', () => {
  let validMocks: any;

  beforeEach(() => {
    validMocks = {
      inventory: [
        {
          signalFamilyId: 'element-relation',
          pillarId: 'thien-thoi',
          runtimeStatus: 'production-enabled',
          doctrineStatus: 'unverified',
          frame: 'active-major-fortune-palace-only',
          sourceIds: ['SRC-MF-V03-ADAPTER-ELEMENT'],
          claimIds: ['CLM-MF-V03-ADAPTER-ELEMENT'],
          schoolScope: ['nam-phai', 'trung-chau'],
          engineeringMappings: [
            { scenario: 'same_element', direction: 'support', strength: 'strong' }
          ]
        },
        {
          signalFamilyId: 'major-fortune-transformations',
          pillarId: 'tu-hoa-sat-tinh',
          runtimeStatus: 'production-enabled',
          doctrineStatus: 'unverified',
          frame: 'direct-active-major-fortune-palace-only',
          sourceIds: ['SRC-MF-V03-ADAPTER-XF'],
          claimIds: ['CLM-MF-V03-ADAPTER-XF'],
          schoolScope: ['nam-phai', 'trung-chau'],
          engineeringMappings: []
        },
        {
          signalFamilyId: 'vcd-opposite-palace-borrowing',
          pillarId: 'dia-loi',
          runtimeStatus: 'production-blocked-on-evidence',
          doctrineStatus: 'unverified',
          frame: 'active-palace',
          sourceIds: [],
          claimIds: [],
          schoolScope: [],
          engineeringMappings: []
        },
        {
          signalFamilyId: 'hinh-ho-set',
          pillarId: 'nhan-hoa',
          runtimeStatus: 'production-blocked-on-evidence',
          doctrineStatus: 'unverified',
          frame: 'active-palace',
          sourceIds: [],
          claimIds: [],
          schoolScope: [],
          engineeringMappings: []
        }
      ],
      reconciliation: [
        {
          identifier: 'SRC-MF-V03-ADAPTER-ELEMENT',
          identifierKind: 'source',
          origin: 'runtime',
          definingPath: 'src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/emit-thien-thoi.ts',
          definingSymbol: 'EL_SOURCE',
          runtimeExists: true,
          authorityClass: 'engineering-policy',
          schoolScope: ['nam-phai', 'trung-chau']
        }
      ],
      matrices: [
        {
          signalFamilyId: 'element-relation',
          existence: { status: 'verified' },
          schoolScope: { status: 'verified' },
          majorFortuneTemporalScope: { status: 'verified' },
          palaceFrame: { status: 'verified' },
          targetFrame: { status: 'not-applicable' },
          polarity: { status: 'engineering-only' },
          strength: { status: 'engineering-only' },
          pillarOwnership: { status: 'verified' },
          stacking: { status: 'not-applicable' },
          deduplication: { status: 'verified' },
          exceptionPolicy: { status: 'not-applicable' },
          calculationCoreReadiness: { status: 'verified' },
          sourceLocatorQuality: { status: 'verified' },
          crossSourceAgreement: { status: 'not-applicable' },
          corpusMeasurability: { status: 'verified' },
          candidateEligibility: { status: 'eligible-for-shape-design' }
        }
      ],
      schoolPolicy: [
        {
          signalFamilyId: 'element-relation',
          runtimeAdmittedByNamPhai: true,
          runtimeAdmittedByTrungChau: true,
          sharedImplementation: true,
          crossSchoolFallbackForbidden: true
        }
      ],
      readiness: [
        {
          signalFamilyId: 'element-relation',
          readiness: 'eligible-for-shape-design',
          blockingDimensions: []
        }
      ],
      corpus: {
        thienThoi: {
          elementRelationDistribution: { 'same_element': 1200 },
          sameElementPolicyCount: 1200,
          noElementEvidenceObservations: 10
        },
        diaLoi: {
          voChinhDieuObservations: 50,
          onePrincipalCases: 100,
          twoPrincipalCases: 20
        }
      },
      contradictions: {
        contradictions: [
          { contradictionId: 'CTR-MFV02-LOC-001' }
        ]
      }
    };
  });

  it('passes on valid baseline data', () => {
    expect(() => validateFoundation(validMocks)).not.toThrow();
  });

  it('1. Exact SRC constant not extracted (simulated via missing runtime identifier)', () => {
    validMocks.reconciliation[0].identifier = 'SRC-TYPO';
    expect(() => validateFoundation(validMocks)).toThrow(/Runtime source ID does not exist in inventory/);
  });
  
  it('3. Runtime identifier omitted (simulated via missing production family source)', () => {
    validMocks.inventory[0].sourceIds = [];
    expect(() => validateFoundation(validMocks)).toThrow(/Missing production family source for element-relation/);
  });
  
  it('4. Invented runtime identifier', () => {
    validMocks.reconciliation[0].definingPath = null;
    expect(() => validateFoundation(validMocks)).toThrow(/Invented runtime identifier or missing path\/symbol/);
  });
  
  it('7. Wrong active-palace frame for hinh-ho-set', () => {
    validMocks.inventory[3].frame = 'tam-phuong-tu-chinh';
    expect(() => validateFoundation(validMocks)).toThrow(/Wrong active-palace frame for hinh-ho-set/);
  });
  
  it('8. Wrong school gate for major-fortune-transformations', () => {
    validMocks.inventory[1].schoolScope = ['trung-chau']; // missing nam-phai
    expect(() => validateFoundation(validMocks)).toThrow(/Wrong school gate for major-fortune-transformations/);
  });
  
  it('9. same_element marked neutral', () => {
    validMocks.inventory[0].engineeringMappings[0].direction = 'neutral';
    expect(() => validateFoundation(validMocks)).toThrow(/same_element marked neutral/);
  });
  
  it('10. Backlog family omitted', () => {
    validMocks.inventory = validMocks.inventory.filter((f: any) => f.signalFamilyId !== 'vcd-opposite-palace-borrowing');
    expect(() => validateFoundation(validMocks)).toThrow(/Backlog family omitted/);
  });

  it('12. All observations reported Vô Chính Diệu', () => {
    validMocks.corpus.diaLoi.onePrincipalCases = 0;
    validMocks.corpus.diaLoi.twoPrincipalCases = 0;
    expect(() => validateFoundation(validMocks)).toThrow(/All observations reported Vô Chính Diệu/);
  });

  it('13. All relation distributions empty', () => {
    validMocks.corpus.thienThoi.elementRelationDistribution = {};
    expect(() => validateFoundation(validMocks)).toThrow(/All relation distributions empty/);
  });

  it('14. same_element count equals every observation without evidence', () => {
    validMocks.corpus.thienThoi.noElementEvidenceObservations = 1200;
    expect(() => validateFoundation(validMocks)).toThrow(/same_element count equals every observation without evidence/);
  });

  it('17. Evidence matrix missing a mandatory dimension', () => {
    delete validMocks.matrices[0].existence;
    expect(() => validateFoundation(validMocks)).toThrow(/Evidence matrix missing a mandatory dimension/);
  });

  it('18. Candidate eligible without source locator', () => {
    validMocks.matrices[0].sourceLocatorQuality.status = 'missing';
    expect(() => validateFoundation(validMocks)).toThrow(/Candidate eligible without source locator/);
  });

  it('22. School matrix assumes shared implementation', () => {
    validMocks.schoolPolicy[0].runtimeAdmittedByNamPhai = false;
    expect(() => validateFoundation(validMocks)).toThrow(/School matrix assumes shared implementation/);
  });

  it('28. Historical contradiction removed', () => {
    validMocks.contradictions.contradictions = [];
    expect(() => validateFoundation(validMocks)).toThrow(/Historical contradiction removed/);
  });

  it('29. Numeric candidate field introduced', () => {
    validMocks.inventory[0].score = 10;
    expect(() => validateFoundation(validMocks)).toThrow(/Numeric candidate field introduced/);
  });

  it('fails if internal source labelled classical but unscoped', () => {
    validMocks.reconciliation[0].authorityClass = 'school-manual-supported';
    expect(() => validateFoundation(validMocks)).toThrow(/Internal source labelled classical but unscoped/);
  });

  it('fails if cross-school doctrine fallback', () => {
    validMocks.schoolPolicy[0].crossSchoolFallbackForbidden = false;
    expect(() => validateFoundation(validMocks)).toThrow(/Cross-school doctrine fallback detected/);
  });
  
  it('fails if source ID used as claim ID', () => {
    validMocks.reconciliation[0].identifierKind = 'claim';
    validMocks.inventory[0].claimIds.push('SRC-MF-V03-ADAPTER-ELEMENT');
    expect(() => validateFoundation(validMocks)).toThrow(/Claim ID used as a source ID/);
  });
});
