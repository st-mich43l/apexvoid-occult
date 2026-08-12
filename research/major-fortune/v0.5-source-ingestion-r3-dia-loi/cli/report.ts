#!/usr/bin/env tsx
/**
 * R3 Report CLI
 * Generates all non-decision tracked reports:
 *   - acquisition-summary.json
 *   - source-independence-report.json
 *   - source-obligation-report.json
 *   - source-gap-reconciliation.json
 *   - claim-adjudication-report.json
 *   - dia-loi-admission-authorization.json (copy from authorization/)
 */
import fs from 'fs';
import path from 'path';
import { writePack } from '../src/write-pack';
import type {
  VerifiedSourceCopy,
  ObligationEvaluationResult,
  ClaimAdjudicationResult,
  LaneAuthorization,
  SourceIndependenceEntry,
  DiscoverySourceLead,
} from '../src/types';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

function loadJson<T>(relPath: string, fallback: T): T {
  const fullPath = path.join(BASE_DIR, relPath);
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : fallback;
}

const discoveryLeads = loadJson<DiscoverySourceLead[]>('discovery/discovery-source-registry.json', []);
const verifiedCopies = loadJson<VerifiedSourceCopy[]>('registries/verified-source-copy-registry.json', []);
const obligations = loadJson<ObligationEvaluationResult[]>('obligations/obligation-evaluation-registry.json', []);
const adjudications = loadJson<ClaimAdjudicationResult[]>('adjudication/claim-adjudication-registry.json', []);
const laneAuthorizations = loadJson<LaneAuthorization[]>('authorization/dia-loi-admission-authorization.json', []);
const independenceEntries = loadJson<SourceIndependenceEntry[]>('reports/source-independence-report.json', []);

// Acquisition summary
const acquiredCopies = verifiedCopies.filter(c => c.inspectionStatus !== 'acquired-uninspected');
const verifiedCount = verifiedCopies.filter(c => c.inspectionStatus === 'verified').length;
const rejectedCount = verifiedCopies.filter(c => c.inspectionStatus === 'rejected').length;

writePack(path.join(BASE_DIR, 'reports/acquisition-summary.json'), {
  discoveryLeads: discoveryLeads.length,
  intakesSupplied: acquiredCopies.length,
  artifactsAcquired: acquiredCopies.length,
  missingArtifacts: discoveryLeads.length - acquiredCopies.length,
  acquiredUninspected: verifiedCopies.filter(c => c.inspectionStatus === 'acquired-uninspected').length,
  inspectedUnverified: verifiedCopies.filter(c => c.inspectionStatus === 'inspected-unverified').length,
  verifiedCopies: verifiedCount,
  rejectedCopies: rejectedCount,
});

// Source independence report (written by generate, just copy to reports)
if (fs.existsSync(path.join(BASE_DIR, 'authorization/dia-loi-admission-authorization.json'))) {
  // Generate the independence report from authorization data
  const independenceReport = independenceEntries.length > 0
    ? independenceEntries
    : laneAuthorizations.map(la => ({
        familyId: la.familyId,
        schoolScope: la.schoolScope,
        dimension: 'crossSourceAgreement',
        claimId: null,
        candidateCanonicalWorkIds: [],
        independentCanonicalWorkIds: la.approvedIndependentCanonicalWorkIds,
        status: la.approvedIndependentCanonicalWorkIds.length >= 2 ? 'independent' : 'insufficient',
        blockerReasonCodes: la.blockingReasonCodes.filter(rc =>
          rc === 'INSUFFICIENT_INDEPENDENT_SOURCES'
        ),
        evidenceUsed: [],
      }));

  writePack(path.join(BASE_DIR, 'reports/source-independence-report.json'), independenceReport);
}

// Source obligation report
writePack(path.join(BASE_DIR, 'reports/source-obligation-report.json'), obligations);

// Source gap reconciliation — prove canonical obligations = verified + blocked + contradicted + not-applicable
const verifiedObs = obligations.filter(o => o.status === 'verified').length;
const blockedObs = obligations.filter(o => o.status === 'blocked').length;
const contradictedObs = obligations.filter(o => o.status === 'contradicted').length;
const notApplicableObs = obligations.filter(o => o.status === 'not-applicable').length;
const total = verifiedObs + blockedObs + contradictedObs + notApplicableObs;

writePack(path.join(BASE_DIR, 'reports/source-gap-reconciliation.json'), {
  canonicalObligationCount: obligations.length,
  verified: verifiedObs,
  blocked: blockedObs,
  contradicted: contradictedObs,
  notApplicable: notApplicableObs,
  reconciled: total === obligations.length,
  discrepancy: obligations.length - total,
});

// Claim adjudication report
writePack(path.join(BASE_DIR, 'reports/claim-adjudication-report.json'), adjudications);

// Admission authorization (copy)
writePack(path.join(BASE_DIR, 'reports/dia-loi-admission-authorization.json'), laneAuthorizations);

console.log('R3 reports generated.');
console.log(`  Obligations: ${obligations.length} (verified: ${verifiedObs}, blocked: ${blockedObs})`);
console.log(`  Adjudications: ${adjudications.length}`);
console.log(`  Lanes: ${laneAuthorizations.length}`);
