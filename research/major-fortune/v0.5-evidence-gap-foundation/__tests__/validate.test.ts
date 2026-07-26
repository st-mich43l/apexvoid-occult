import { describe, it, expect, beforeEach } from 'vitest';
import { validateFoundation } from '../cli/validate-foundation.js';

describe('V0.5 Evidence Gap Foundation Validation', () => {
  let validMocks: any;

  beforeEach(() => {
    validMocks = {
      inventory: [
        {
          signalFamilyId: 'element-relation',
          pillarId: 'thien-thoi',
          runtimeStatus: 'production-enabled',
          schoolScope: ['nam-phai', 'trung-chau'],
          frame: 'active-major-fortune-palace-only',
          engineeringMappings: [{ scenario: 'same_element', direction: 'support', strength: 'normal' }],
          numericAuthority: 'engineering-defined',
          sourceIds: ['SRC-MF-V03-ADAPTER-ELEMENT'],
          claimIds: ['CLM-MF-V03-ADAPTER-ELEMENT']
        },
        {
          signalFamilyId: 'principal-star-dignity',
          pillarId: 'dia-loi',
          runtimeStatus: 'production-enabled',
          schoolScope: ['nam-phai', 'trung-chau'],
          frame: 'active-major-fortune-palace-only',
          engineeringMappings: [],
          numericAuthority: 'not-applicable',
          sourceIds: [],
          claimIds: []
        },
        {
          signalFamilyId: 'support-pressure-auxiliary-sets',
          pillarId: 'nhan-hoa',
          runtimeStatus: 'production-enabled',
          schoolScope: ['nam-phai', 'trung-chau'],
          frame: 'active-palace',
          engineeringMappings: [],
          numericAuthority: 'not-applicable',
          sourceIds: [],
          claimIds: []
        },
        {
          signalFamilyId: 'major-fortune-transformations',
          pillarId: 'tu-hoa-sat-tinh',
          runtimeStatus: 'production-enabled',
          schoolScope: ['nam-phai', 'trung-chau'],
          frame: 'direct-active-major-fortune-palace-only',
          engineeringMappings: [],
          numericAuthority: 'not-applicable',
          sourceIds: [],
          claimIds: []
        },
        {
          signalFamilyId: 'severe-pressure-evidence',
          pillarId: 'tu-hoa-sat-tinh',
          runtimeStatus: 'production-blocked-on-evidence',
          schoolScope: [],
          frame: 'active-palace',
          engineeringMappings: [],
          numericAuthority: 'not-applicable',
          sourceIds: [],
          claimIds: []
        }
      ],
      reconciliation: [
        {
          identifier: 'SRC-MF-V03-ADAPTER-ELEMENT',
          identifierKind: 'source',
          origin: 'runtime',
          authorityClass: 'engineering-policy',
          schoolScope: ['nam-phai', 'trung-chau']
        },
        {
          identifier: 'CLM-MF-V03-ADAPTER-ELEMENT',
          identifierKind: 'claim',
          origin: 'runtime',
          authorityClass: 'engineering-policy',
          schoolScope: ['nam-phai', 'trung-chau']
        }
      ],
      schoolPolicy: [
        {
          signalFamilyId: 'element-relation',
          admittedByNamPhai: true,
          admittedByTrungChau: true,
          crossSchoolFallbackForbidden: true,
          unresolvedSchoolContradiction: false,
          sharedDoctrine: false
        }
      ],
      ctr: {
        contradictions: [{ contradictionId: 'CTR-MFV02-LOC-001' }]
      }
    };
  });

  it('passes on valid baseline data', () => {
    expect(() => validateFoundation(validMocks)).not.toThrow();
  });

  it('fails if runtime source ID does not exist', () => {
    validMocks.reconciliation.push({
      identifier: 'SRC-MF-V03-ADAPTER-FAKE',
      identifierKind: 'source',
      origin: 'runtime',
      authorityClass: 'engineering-policy',
      schoolScope: []
    });
    expect(() => validateFoundation(validMocks)).toThrow(/does not exist in inventory/);
  });

  it('fails if runtime claim ID does not exist', () => {
    validMocks.reconciliation.push({
      identifier: 'CLM-MF-V03-ADAPTER-FAKE',
      identifierKind: 'claim',
      origin: 'runtime',
      authorityClass: 'engineering-policy',
      schoolScope: []
    });
    expect(() => validateFoundation(validMocks)).toThrow(/does not exist in inventory/);
  });

  it('fails if invented identifier marked runtime', () => {
    validMocks.inventory[0].sourceIds.push('INV-SOURCE-001');
    validMocks.reconciliation.push({
      identifier: 'INV-SOURCE-001',
      identifierKind: 'source',
      origin: 'runtime',
      authorityClass: 'engineering-policy',
      schoolScope: []
    });
    expect(() => validateFoundation(validMocks)).toThrow(/Invented identifier marked runtime/);
  });

  it('fails if wrong canonical pillar ID', () => {
    validMocks.inventory[0].pillarId = 'tu-hoa';
    expect(() => validateFoundation(validMocks)).toThrow(/Wrong canonical pillar ID/);
  });

  it('fails if Nhan Hoa frame declared TP4C while runtime is active palace', () => {
    validMocks.inventory[2].frame = 'tam-phuong-tu-chinh';
    expect(() => validateFoundation(validMocks)).toThrow(/Nhân Hòa frame declared TP4C/);
  });

  it('fails if same_element declared neutral while policy says support', () => {
    validMocks.inventory[0].engineeringMappings[0].direction = 'neutral';
    expect(() => validateFoundation(validMocks)).toThrow(/same_element declared neutral while policy says support/);
  });

  it('fails if missing production family', () => {
    validMocks.inventory = validMocks.inventory.filter((i: any) => i.signalFamilyId !== 'element-relation');
    expect(() => validateFoundation(validMocks)).toThrow(/Production signal missing/);
  });

  it('fails if disabled/backlog family omitted', () => {
    validMocks.inventory = validMocks.inventory.filter((i: any) => i.signalFamilyId !== 'severe-pressure-evidence');
    expect(() => validateFoundation(validMocks)).toThrow(/Backlog family missing/);
  });

  it('fails if internal source labelled classical', () => {
    validMocks.reconciliation[0].authorityClass = 'school-manual-supported';
    validMocks.reconciliation[0].schoolScope = ['nam-phai']; // avoid the unscoped rule
    expect(() => validateFoundation(validMocks)).toThrow(/Internal source labelled classical/);
  });

  it('fails if missing school scope', () => {
    validMocks.inventory[0].schoolScope = [];
    expect(() => validateFoundation(validMocks)).toThrow(/Missing school scope/);
  });

  it('fails if cross-school doctrine fallback', () => {
    validMocks.schoolPolicy[0].crossSchoolFallbackForbidden = false;
    expect(() => validateFoundation(validMocks)).toThrow(/Cross-school doctrine fallback detected/);
  });
  
  it('fails if source ID used as claim ID', () => {
    validMocks.reconciliation[0].identifierKind = 'claim';
    validMocks.inventory[0].claimIds.push('SRC-MF-V03-ADAPTER-ELEMENT'); // satisfy the 'exists in inventory' rule so it hits the type check
    expect(() => validateFoundation(validMocks)).toThrow(/Source ID used as a claim ID/);
  });
  
  it('fails if historical contradiction dropped', () => {
    validMocks.ctr.contradictions = [];
    expect(() => validateFoundation(validMocks)).toThrow(/Historical contradiction dropped/);
  });

  // More mutation tests would go here, these 13 cover the core rules specified in validate-foundation
});
