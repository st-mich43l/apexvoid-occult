import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2-dia-loi');

function readJson(filePath: string) {
  const fullPath = path.join(BASE_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writeJson(filePath: string, data: any) {
  const fullPath = path.join(BASE_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

export function report() {
  const copies = readJson('sources/copy-registry.json') || [];
  const locators = readJson('sources/locator-registry.json') || [];
  const extractions = readJson('extractions/extraction-registry.json') || [];
  const bindings = readJson('bindings/foundation-claim-bindings.json') || [];

  // Generate Adjudication Registry
  const adjudications = [
    {
      adjudicationId: 'ADJ-NP-001',
      claimId: 'CLM-NP-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'nam-phai',
      decision: 'insufficient-evidence',
      supportingExtractionIds: [],
      contradictingExtractionIds: [],
      requiredObligationIds: [],
      unresolvedReasons: ['verified sources = 0']
    },
    {
      adjudicationId: 'ADJ-NP-002',
      claimId: 'CLM-NP-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'nam-phai',
      decision: 'insufficient-evidence',
      supportingExtractionIds: [],
      contradictingExtractionIds: [],
      requiredObligationIds: [],
      unresolvedReasons: ['verified sources = 0']
    },
    {
      adjudicationId: 'ADJ-TC-001',
      claimId: 'CLM-TC-001',
      familyId: 'principal-star-dignity',
      schoolScope: 'trung-chau',
      decision: 'insufficient-evidence',
      supportingExtractionIds: [],
      contradictingExtractionIds: [],
      requiredObligationIds: [],
      unresolvedReasons: ['verified sources = 0']
    },
    {
      adjudicationId: 'ADJ-TC-002',
      claimId: 'CLM-TC-002',
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'trung-chau',
      decision: 'insufficient-evidence',
      supportingExtractionIds: [],
      contradictingExtractionIds: [],
      requiredObligationIds: [],
      unresolvedReasons: ['verified sources = 0']
    }
  ];
  writeJson('adjudication/claim-adjudication-registry.json', adjudications);
  writeJson('adjudication/contradiction-log.json', []);
  writeJson('adjudication/adjudication-handoffs.json', []);

  // Generate Matrices
  writeJson('matrices/source-coverage-matrix.json', {
    sourcesTotal: copies.length,
    cataloguedSources: copies.length,
    inspectedSources: 0,
    verifiedSources: 0,
    metadataOnlySources: copies.length
  });
  writeJson('matrices/school-evidence-matrix.json', {
    "nam-phai": { sources: 0, extractions: 0 },
    "trung-chau": { sources: 0, extractions: 0 }
  });
  writeJson('matrices/obligation-closure-matrix.json', {
    claimsTotal: bindings.length,
    claimsReadyForAdjudication: 0,
    blockedClaims: bindings.length,
    claimsBlockedByProvenance: bindings.length,
    evidenceRecords: 0,
    verifiedEvidenceRecords: 0,
    openEvidenceRecords: bindings.length,
    uniqueSourceGaps: 19,
    sourceGapsOpen: 19,
    sourceGapsClosed: 0,
    adjudicationHandoffs: 0,
    claimGapsClosed: 0,
    calculationCoreGapsClosed: 0
  });

  // Generate Reports
  writeJson('reports/acquisition-summary.json', {
    status: 'blocked',
    verifiedSources: 0,
    openSourceGaps: 19
  });
  writeJson('reports/copy-verification-report.json', copies);
  writeJson('reports/locator-verification-report.json', locators);
  writeJson('reports/claim-binding-report.json', bindings);
  writeJson('reports/source-obligation-report.json', []);
  writeJson('reports/source-gap-reconciliation.json', []);
  writeJson('reports/cross-source-agreement-report.json', []);
  writeJson('reports/claim-adjudication-report.json', adjudications);

  const authSnapshots = [
    {
      familyId: 'principal-star-dignity',
      schoolScope: 'nam-phai',
      authorizedStatus: 'blocked',
      approvedSourceObligationIds: [],
      approvedClaimAdjudicationIds: [],
      openContradictionIds: [],
      blockingReasonCodes: ['missing-provenance', 'verified-sources-0']
    },
    {
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'nam-phai',
      authorizedStatus: 'blocked',
      approvedSourceObligationIds: [],
      approvedClaimAdjudicationIds: [],
      openContradictionIds: [],
      blockingReasonCodes: ['missing-provenance', 'verified-sources-0']
    },
    {
      familyId: 'principal-star-dignity',
      schoolScope: 'trung-chau',
      authorizedStatus: 'blocked',
      approvedSourceObligationIds: [],
      approvedClaimAdjudicationIds: [],
      openContradictionIds: [],
      blockingReasonCodes: ['missing-provenance', 'verified-sources-0']
    },
    {
      familyId: 'vcd-opposite-palace-borrowing',
      schoolScope: 'trung-chau',
      authorizedStatus: 'blocked',
      approvedSourceObligationIds: [],
      approvedClaimAdjudicationIds: [],
      openContradictionIds: [],
      blockingReasonCodes: ['missing-provenance', 'verified-sources-0']
    }
  ];
  writeJson('reports/dia-loi-admission-authorization.json', authSnapshots);
  writeJson('reports/family-readiness-report.json', authSnapshots);

  console.log('Successfully generated R2 Dia Loi reports and matrices.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  report();
}
