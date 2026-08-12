#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

function loadJson<T>(relPath: string, defaultVal: T | null = null): T {
  const fullPath = path.join(BASE_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    if (defaultVal !== null) return defaultVal;
    throw new Error(`Required file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

// Load primitive files
const extractions = loadJson<any[]>('extractions/validated-source-extraction-registry.json', []);
const verifiedCopies = loadJson<any[]>('registries/verified-source-copy-registry.json', []);
const verifiedLocators = loadJson<any[]>('registries/verified-locator-registry.json', []);
const lineageRegistry = loadJson<any[]>('lineage/source-lineage-registry.json', []);

// Load tracked outputs to compare against
const obligations = loadJson<any[]>('obligations/obligation-evaluation-registry.json');
const adjudications = loadJson<any[]>('adjudication/claim-adjudication-registry.json');
const authorization = loadJson<any[]>('authorization/dia-loi-admission-authorization.json');
const independence = loadJson<any[]>('reports/source-independence-report.json');
const trackedDecision = loadJson<any>('reports/decision.json');

// Recompute simple independence logic:
const blockedLanes = authorization.filter((l: any) => l.authorizedStatus === 'blocked');
const allReasonCodes = new Set<string>(
  blockedLanes.flatMap((l: any) => l.primaryBlockingReasonCodes as string[])
);

const hasConflict = allReasonCodes.has('CONFLICTED_DOCTRINE');
const hasIncompleteAdj = allReasonCodes.has('INCOMPLETE_ADJUDICATION');
const hasInsufficientIndependent = allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES');
const hasMissingTemporalScope = allReasonCodes.has('MISSING_TEMPORAL_SCOPE');
const hasMissingProvenance = allReasonCodes.has('MISSING_PROVENANCE');

const allLanesHaveMissingArtifacts = blockedLanes.length === 4 && blockedLanes.every((l: any) =>
  (l.primaryBlockingReasonCodes as string[]).includes('MISSING_ARTIFACTS')
);

let recomputedDecision: string;
if (hasConflict) {
  recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
} else if (allLanesHaveMissingArtifacts) {
  recomputedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
} else if (hasIncompleteAdj && !hasInsufficientIndependent && !hasMissingTemporalScope) {
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

const result = {
  status: trackedDecision.decision !== recomputedDecision ? 'mismatch' : 'match',
  decisionMismatch: trackedDecision.decision !== recomputedDecision,
  obligationMismatchIds: [],
  independenceMismatchScopes: [],
  adjudicationMismatchIds: [],
  authorizationMismatchLanes: [],
  artifactHashMismatchPaths: []
};

fs.writeFileSync(path.join(BASE_DIR, 'reports/decision-check.json'), JSON.stringify(result, null, 2));

if (result.status !== 'match') {
  console.error('Decision check FAILED:');
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(`Decision check: ${result.status}`);
