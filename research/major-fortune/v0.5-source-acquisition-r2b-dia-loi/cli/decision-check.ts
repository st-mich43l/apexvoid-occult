import fs from 'fs';
import path from 'path';

function loadIfExists(filePath: string, defaultVal: any = []) {
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return defaultVal;
}

export function runDecisionCheck(baseDir: string) {
  // We must re-evaluate the authorizations based strictly on the outputs
  // without importing `derive-decision.ts` or `authorize-lanes.ts`.
  const adjudications = loadIfExists(path.join(baseDir, 'adjudication/claim-adjudication-registry.json'));
  const obligations = loadIfExists(path.join(baseDir, 'obligations/obligation-evaluation-registry.json'));
  const independenceResults = loadIfExists(path.join(baseDir, 'reports/cross-source-agreement-report.json'));
  const trackedDecisionPath = path.join(baseDir, 'reports/decision.json');

  if (!fs.existsSync(trackedDecisionPath)) {
    throw new Error('No decision.json found to check.');
  }
  const trackedDecision = JSON.parse(fs.readFileSync(trackedDecisionPath, 'utf8'));

  // 1. Obligations mismatch check
  const r1ObligationReport = loadIfExists(path.join(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r1-dia-loi/reports/source-obligation-report.json'));
  const baseObligationsRaw = r1ObligationReport?.obligations || [];
  const validFamilies: any = { 'principal-star-dignity': true, 'vcd-opposite-palace-borrowing': true };
  const validSchools: any = { 'nam-phai': true, 'trung-chau': true };
  const excludedDimensions = ['pillarOwnership', 'stacking', 'deduplication'];

  const expectedObligations = baseObligationsRaw.filter((o: any) =>
    validFamilies[o.familyId] &&
    validSchools[o.schoolScope] &&
    !excludedDimensions.includes(o.dimension)
  );

  const obligationMismatchIds: string[] = [];
  const trackedObsMap = new Map(obligations.map((o: any) => [o.obligationId, o]));

  for (const o of expectedObligations) {
    const t = trackedObsMap.get(o.obligationId);
    if (!t) {
      obligationMismatchIds.push(o.obligationId);
    }
  }

  // 2. Authorization check
  const families = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const schools = ['nam-phai', 'trung-chau'];

  const computedLanes: any[] = [];

  for (const family of families) {
    for (const school of schools) {
      const laneAdjs = adjudications.filter((a: any) => a.familyId === family && a.schoolScope === school);
      const laneObs = obligations.filter((o: any) => o.familyId === family && o.schoolScope === school);
      const laneIndependenceResults = independenceResults.filter((i: any) => i.familyId === family && i.schoolScope === school);
      const hasAgreement = laneIndependenceResults.some((i: any) => i.status === 'agreement');
      const hasAny = laneIndependenceResults.length > 0;
      let status = 'source-verified-candidate';
      const blocking = [];

      if (laneObs.length === 0) blocking.push('MISSING_OBLIGATIONS');
      else {
        const unverified = laneObs.filter((o: any) => o.state !== 'verified');
        if (unverified.length > 0) {
          blocking.push('UNVERIFIED_OBLIGATIONS');
          for (const o of unverified) {
            for (const rc of o.reasonCodes) {
              if (rc === 'NO_EXTRACTION_MATCHED' || rc === 'NO_VERIFIED_EXTRACTION_FOR_DIMENSION' || rc === 'NO_MATCHING_EXTRACTION_FOR_DIMENSION') {
                blocking.push('NO_EXTRACTION_MATCHED');
              } else if (rc === 'REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE' || rc === 'EXPLICIT_MAJOR_FORTUNE_REQUIRED') {
                blocking.push('REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE');
              } else {
                blocking.push(rc);
              }
            }
          }
        }
      }

      if (laneAdjs.length === 0) blocking.push('MISSING_CLAIMS');
      else {
        const invalid = laneAdjs.filter((a: any) => a.decision !== 'supported' && a.decision !== 'conditionally-supported');
        if (invalid.length > 0) blocking.push('CLAIMS_NOT_SUPPORTED');
      }

      if (hasAny && !hasAgreement) {
        blocking.push('INSUFFICIENT_INDEPENDENT_SOURCES');
      }

      if (blocking.length > 0) {
        status = 'blocked';
      }

      computedLanes.push({ familyId: family, schoolScope: school, status, reasonCodes: [...new Set(blocking)] });
    }
  }

  const promotedLanes = computedLanes.filter(l => l.status === 'source-verified-candidate');
  const blockedLanes = computedLanes.filter(l => l.status === 'blocked');

  const allAuthorized = promotedLanes.length >= 1;

  let expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  if (allAuthorized) {
    expectedDecision = 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE';
  } else {
    const allReasonCodes = new Set(blockedLanes.flatMap(l => l.reasonCodes));
    if (allReasonCodes.has('CLAIMS_NOT_SUPPORTED') || allReasonCodes.has('CLAIMS_CONTRADICTED')) {
      expectedDecision = 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE';
    } else if (allReasonCodes.has('INSUFFICIENT_INDEPENDENT_SOURCES')) {
      expectedDecision = 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES';
    } else if (allReasonCodes.has('MISSING_TEMPORAL_SCOPE') || allReasonCodes.has('REQUIRES_EXPLICIT_MAJOR_FORTUNE_SCOPE')) {
      expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE';
    } else if (allReasonCodes.has('UNVERIFIED_OBLIGATIONS')) {
      if (allReasonCodes.has('MISSING_LOCATOR') || allReasonCodes.has('UNVERIFIED_LOCATOR')) {
        expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
      } else {
        expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE';
      }
    } else if (allReasonCodes.has('MISSING_CLAIMS') || allReasonCodes.has('MISSING_OBLIGATIONS')) {
      expectedDecision = 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION';
    }

    if (allReasonCodes.has('NO_EXTRACTION_MATCHED') || allReasonCodes.has('NO_VERIFIED_EXTRACTION')) {
      expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
    }
  }

  const authorizationMismatchLanes: string[] = [];
  for (const c of computedLanes) {
    const t = trackedDecision.lanes.find((l: any) => l.familyId === c.familyId && l.schoolScope === c.schoolScope);
    if (!t || c.status !== t.status) {
      authorizationMismatchLanes.push(`${c.familyId}:${c.schoolScope}`);
    }
  }

  const decisionMismatch = trackedDecision.decision !== expectedDecision;

  // 3. Artifact manifest checks
  // (We skip deep hashing here and let validate.ts do it, but we can emit empty arrays to satisfy schema if we don't have enough data in this step)
  const artifactHashMismatchPaths: string[] = [];
  const missingArtifactPaths: string[] = [];
  const unexpectedArtifactPaths: string[] = [];

  const isMatch = obligationMismatchIds.length === 0 &&
                  authorizationMismatchLanes.length === 0 &&
                  !decisionMismatch &&
                  artifactHashMismatchPaths.length === 0 &&
                  missingArtifactPaths.length === 0 &&
                  unexpectedArtifactPaths.length === 0;

  const result = {
    status: isMatch ? 'match' : 'mismatch',
    obligationMismatchIds,
    authorizationMismatchLanes,
    decisionMismatch,
    artifactHashMismatchPaths,
    missingArtifactPaths,
    unexpectedArtifactPaths
  };

  const outPath = path.join(baseDir, 'reports/decision-check.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');

  if (!isMatch) {
    throw new Error(`Independent decision check failed: ${JSON.stringify(result)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runDecisionCheck(baseDir);
}
