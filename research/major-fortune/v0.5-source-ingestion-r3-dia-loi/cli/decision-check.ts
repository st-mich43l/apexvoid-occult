#!/usr/bin/env tsx
/**
 * R3 Independent Decision Checker
 *
 * MUST NOT import from the main pipeline logic.
 * Recomputes the decision from primitive JSON files and verifies it matches decision.json.
 * Fails if decision.json has been tampered with.
 */
import fs from 'fs';
import path from 'path';
import { writePack } from '../src/write-pack';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

function loadJson<T>(relPath: string): T {
  const fullPath = path.join(BASE_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Required file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

// Load primitive files
const obligations = loadJson<any[]>('obligations/obligation-evaluation-registry.json');
const adjudications = loadJson<any[]>('adjudication/claim-adjudication-registry.json');
const authorization = loadJson<any[]>('authorization/dia-loi-admission-authorization.json');
const independence = loadJson<any[]>('reports/source-independence-report.json');
const trackedDecision = loadJson<any>('reports/decision.json');

// ─── Independent decision recomputation ──────────────────────────────────────

// Check all 38 obligations are present
if (!Array.isArray(obligations) || obligations.length !== 38) {
  console.error(`FAIL: Expected 38 obligations, found ${obligations?.length}`);
  process.exit(1);
}

// Check all 4 lanes are present
if (!Array.isArray(authorization) || authorization.length !== 4) {
  console.error(`FAIL: Expected 4 lane authorizations, found ${authorization?.length}`);
  process.exit(1);
}

// Recompute decision independently
const promotedLanes = authorization.filter((l: any) => l.authorizedStatus === 'source-verified-candidate');
const blockedLanes = authorization.filter((l: any) => l.authorizedStatus === 'blocked');

let recomputedDecision: string;

if (promotedLanes.length > 0) {
  recomputedDecision = 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE';
} else {
  const allReasonCodes = new Set<string>(
    blockedLanes.flatMap((l: any) => l.blockingReasonCodes as string[])
  );

  const hasConflict = allReasonCodes.has('CONFLICTED_DOCTRINE');
  const hasInsufficientIndependent = allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES');
  const hasMissingTemporalScope = allReasonCodes.has('MISSING_TEMPORAL_SCOPE');
  const hasMissingProvenance = allReasonCodes.has('UNVERIFIED_OBLIGATIONS') || allReasonCodes.has('MISSING_EVIDENCE_VERIFIED_BINDING');
  const hasIncompleteAdj = (allReasonCodes.has('CLAIMS_NOT_SUPPORTED') || allReasonCodes.has('MISSING_CLAIMS'))
    && !hasInsufficientIndependent && !hasMissingTemporalScope;

  const allLanesHaveNoExtractions = blockedLanes.length === 4 && blockedLanes.every((l: any) =>
    (l.blockingReasonCodes as string[]).includes('NO_EXTRACTION_MATCHED')
  );

  if (hasConflict) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
  } else if (allLanesHaveNoExtractions) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  } else if (hasIncompleteAdj) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION';
  } else if (hasInsufficientIndependent) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES';
  } else if (hasMissingTemporalScope) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE';
  } else if (hasMissingProvenance) {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
  } else {
    recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  }
}

// Compare with tracked decision
const decisionMismatch = trackedDecision.decision !== recomputedDecision;

// Check obligation counts by status
const obligationsByStatus = {
  verified: obligations.filter((o: any) => o.status === 'verified').length,
  blocked: obligations.filter((o: any) => o.status === 'blocked').length,
  contradicted: obligations.filter((o: any) => o.status === 'contradicted').length,
  'not-applicable': obligations.filter((o: any) => o.status === 'not-applicable').length,
};
const obligationSum = Object.values(obligationsByStatus).reduce((a, b) => a + b, 0);
const obligationReconciled = obligationSum === obligations.length;

// Check authorization mismatch
const authorizationMismatchLanes: string[] = [];
for (const lane of authorization) {
  const trackedLane = trackedDecision.lanes?.find(
    (l: any) => l.familyId === lane.familyId && l.schoolScope === lane.schoolScope
  );
  if (!trackedLane || trackedLane.status !== lane.authorizedStatus) {
    authorizationMismatchLanes.push(`${lane.familyId}/${lane.schoolScope}`);
  }
}

const result = {
  status: decisionMismatch || !obligationReconciled || authorizationMismatchLanes.length > 0 ? 'mismatch' : 'match',
  decisionMismatch,
  recomputedDecision,
  trackedDecision: trackedDecision.decision,
  obligationsMismatch: !obligationReconciled,
  obligationSum,
  obligationsByStatus,
  authorizationMismatchLanes,
  obligationMismatchIds: [],
};

writePack(path.join(BASE_DIR, 'reports/decision-check.json'), result);

if (result.status !== 'match') {
  console.error('Decision check FAILED:');
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(`Decision check: ${result.status}`);
console.log(`  Recomputed decision: ${recomputedDecision}`);
console.log(`  Obligations reconciled: ${obligationReconciled}`);
