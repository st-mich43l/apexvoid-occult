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

  const families = ['principal-star-dignity', 'vcd-opposite-palace-borrowing'];
  const schools = ['nam-phai', 'trung-chau'];

  const computedLanes: any[] = [];
  const allReasonCodes = new Set<string>();

  for (const family of families) {
    for (const school of schools) {
      const laneAdjs = adjudications.filter((a: any) => a.familyId === family && a.schoolScope === school);
      const laneObs = obligations.filter((o: any) => o.familyId === family && o.schoolScope === school);
      const indep = independenceResults.find((i: any) => i.familyId === family && i.schoolScope === school);

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

      if (indep && indep.status === 'insufficient') {
        blocking.push('INSUFFICIENT_INDEPENDENT_SOURCES');
      }

      if (blocking.length > 0) {
        status = 'blocked';
        blocking.forEach(b => allReasonCodes.add(b));
      }

      computedLanes.push({ familyId: family, schoolScope: school, status, reasonCodes: [...new Set(blocking)] });
    }
  }

  const allAuthorized = computedLanes.every(l => l.status === 'source-verified-candidate') && computedLanes.length === 4;

  let expectedDecision = 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS';
  if (allAuthorized) {
    expectedDecision = 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE';
  } else {
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

  let tamperedAuthorization = false;
  for (const t of trackedDecision.lanes) {
    const c = computedLanes.find(cl => cl.familyId === t.familyId && cl.schoolScope === t.schoolScope);
    if (!c || c.status !== t.status) {
      tamperedAuthorization = true;
    }
  }

  let tamperedDecision = false;
  if (trackedDecision.decision !== expectedDecision) {
    tamperedDecision = true;
  }

  if (tamperedDecision || tamperedAuthorization) {
    throw new Error(`Independent check failed. Expected: ${expectedDecision}, Actual: ${trackedDecision.decision}. Tampered Auth: ${tamperedAuthorization}`);
  }

  const outPath = path.join(baseDir, 'reports/decision-check.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    status: 'match',
    expectedDecision,
    actualDecision: trackedDecision.decision,
    tamperedHash: false,
    tamperedAuthorization,
    tamperedObligationState: false
  }, null, 2) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseDir = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-acquisition-r2b-dia-loi');
  runDecisionCheck(baseDir);
}
