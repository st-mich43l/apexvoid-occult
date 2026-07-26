/**
 * Major Fortune V0.4.2 Independent Decision Check.
 *
 * Does NOT trust decision.json.
 * Independently:
 *   1. Loads the artifact manifest
 *   2. Validates all report hashes
 *   3. Loads all required reports
 *   4. Recalculates every hard gate
 *   5. Recalculates decisionInputHash
 *   6. Derives expected decision
 *   7. Compares with decision.json
 *   8. Exits non-zero on mismatch
 *
 * Produces: reports/decision-check.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sha256File, sha256Object } from "../types/hash";
import type {
  MajorFortuneV042Decision,
  DecisionCheckResult,
  EquivalenceReport,
  TimelineEquivalenceReport,
  TemporalIndependenceReport,
  TelemetrySemanticsReport,
  ArtifactManifest,
  MajorFortuneV042DecisionValue,
} from "../types/reports";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const REPORTS_DIR = join(ROOT, "reports");

function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function run(): void {
  console.log("[decision-check] Independent verification of Major Fortune V0.4.2 decision...");

  const checkResult: DecisionCheckResult = {
    schemaVersion: "0.4.2",
    decisionFileValid: false,
    allHashesValid: false,
    allGatesRecalculated: false,
    decisionMatches: false,
    expectedDecision: "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS",
    actualDecision: null,
    hashValidationFailures: [],
    gateRecalculationFailures: [],
    passed: false,
  };

  // ── Step 1: Load decision.json ────────────────────────────────────────────
  const decisionFile = loadJson<MajorFortuneV042Decision>(join(REPORTS_DIR, "decision.json"));
  if (!decisionFile) {
    checkResult.gateRecalculationFailures.push("decision.json missing or invalid");
    writeAndExit(checkResult);
    return;
  }
  checkResult.decisionFileValid = decisionFile.schemaVersion === "0.4.2";
  checkResult.actualDecision = decisionFile.decision;

  // ── Step 2: Load artifact manifest and verify hashes ─────────────────────
  const manifest = loadJson<ArtifactManifest>(join(REPORTS_DIR, "artifact-manifest.json"));
  if (!manifest) {
    checkResult.hashValidationFailures.push("artifact-manifest.json missing");
  } else {
    let allHashesValid = true;
    for (const artifact of manifest.artifacts) {
      const absPath = join(ROOT, artifact.path);
      if (!existsSync(absPath)) {
        checkResult.hashValidationFailures.push(`Missing: ${artifact.path}`);
        allHashesValid = false;
        continue;
      }
      const actual = sha256File(absPath);
      if (actual !== artifact.sha256) {
        checkResult.hashValidationFailures.push(
          `Hash mismatch: ${artifact.path} (expected ${artifact.sha256}, got ${actual})`,
        );
        allHashesValid = false;
      }
    }
    checkResult.allHashesValid = allHashesValid;
  }

  if (checkResult.hashValidationFailures.length > 0) {
    console.error(`[decision-check] Hash validation failures: ${checkResult.hashValidationFailures.join("; ")}`);
  }

  // ── Step 3: Independently recalculate all gates ───────────────────────────
  const gates: Array<{ gateId: string; status: "pass" | "fail"; sourceReportSha256: string }> = [];

  function recalcGate(
    gateId: string,
    condition: boolean,
    reportRelPath: string,
    errorMsg?: string,
  ): void {
    const absPath = join(ROOT, reportRelPath);
    const sha = existsSync(absPath) ? sha256File(absPath) : "missing";
    gates.push({ gateId, status: condition ? "pass" : "fail", sourceReportSha256: sha });
    if (!condition) {
      checkResult.gateRecalculationFailures.push(errorMsg ?? gateId);
    }
  }

  const baselineManifest = loadJson<{ schemaVersion: string }>(join(ROOT, "baselines/baseline-manifest.json"));
  recalcGate("baseline-manifest-valid",
    !!baselineManifest && baselineManifest.schemaVersion === "0.4.2",
    "baselines/baseline-manifest.json");

  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  recalcGate("fallback-equivalence-passed",
    !!(fallbackEquiv?.passed),
    "reports/fallback-equivalence-report.json",
    `Fallback differences: ${fallbackEquiv?.unexpectedDifferenceCount}`);

  const controlEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "trung-chau-control-report.json"));
  recalcGate("trung-chau-control-passed",
    !!(controlEquiv?.passed),
    "reports/trung-chau-control-report.json");

  const timelineEquiv = loadJson<TimelineEquivalenceReport>(join(REPORTS_DIR, "timeline-equivalence-report.json"));
  recalcGate("timeline-equivalence-passed",
    !!(timelineEquiv?.passed),
    "reports/timeline-equivalence-report.json");

  const temporalReport = loadJson<TemporalIndependenceReport>(join(REPORTS_DIR, "temporal-independence-report.json"));
  recalcGate("temporal-independence-passed",
    !!(temporalReport?.passed),
    "reports/temporal-independence-report.json");

  const telemetryReport = loadJson<TelemetrySemanticsReport>(join(REPORTS_DIR, "telemetry-semantics-report.json"));
  recalcGate("telemetry-semantics-passed",
    !!(telemetryReport?.passed),
    "reports/telemetry-semantics-report.json");

  const requiredReports = [
    "fallback-equivalence-report.json",
    "trung-chau-control-report.json",
    "timeline-equivalence-report.json",
    "temporal-independence-report.json",
    "telemetry-semantics-report.json",
    "artifact-manifest.json",
    "corpus-identity.json",
  ];
  const allPresent = requiredReports.every((f) => existsSync(join(REPORTS_DIR, f)));
  recalcGate("all-required-reports-present", allPresent, "reports/artifact-manifest.json");

  // Hash integrity recalculation.
  let hashIntegrity = true;
  if (manifest) {
    for (const artifact of manifest.artifacts) {
      const absPath = join(ROOT, artifact.path);
      if (!existsSync(absPath) || sha256File(absPath) !== artifact.sha256) {
        hashIntegrity = false; break;
      }
    }
  } else {
    hashIntegrity = false;
  }
  recalcGate("artifact-hash-integrity", hashIntegrity, "reports/artifact-manifest.json");

  const noMissingBaseline = (fallbackEquiv?.missingBaselineIds.length ?? 1) === 0 &&
    (controlEquiv?.missingBaselineIds.length ?? 1) === 0;
  recalcGate("no-missing-baseline-observations", noMissingBaseline, "reports/fallback-equivalence-report.json");

  const noExtraObservations = (fallbackEquiv?.missingCurrentIds.length ?? 1) === 0 &&
    (controlEquiv?.missingCurrentIds.length ?? 1) === 0;
  recalcGate("no-extra-unclassified-observations", noExtraObservations, "reports/fallback-equivalence-report.json");

  checkResult.allGatesRecalculated = true;

  // ── Step 4: Derive expected decision ─────────────────────────────────────
  const failedGates = gates.filter((g) => g.status === "fail");
  let expectedDecision: MajorFortuneV042DecisionValue;
  if (failedGates.length > 0) {
    expectedDecision = "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
  } else {
    expectedDecision = "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
  }
  checkResult.expectedDecision = expectedDecision;

  // ── Step 5: Recalculate decisionInputHash ─────────────────────────────────
  const recalculatedInputHash = sha256Object({
    gates: gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  });

  // ── Step 6: Compare ───────────────────────────────────────────────────────
  const decisionMatches = decisionFile.decision === expectedDecision;
  const hashMatches = decisionFile.decisionInputHash === recalculatedInputHash;

  checkResult.decisionMatches = decisionMatches;

  if (!decisionMatches) {
    checkResult.gateRecalculationFailures.push(
      `Decision mismatch: file says "${decisionFile.decision}", recalculated "${expectedDecision}"`,
    );
  }
  if (!hashMatches) {
    checkResult.gateRecalculationFailures.push(
      `decisionInputHash mismatch: file=${decisionFile.decisionInputHash}, recalc=${recalculatedInputHash}`,
    );
  }

  // Check for a promotion decision despite failed gates (editorial attack).
  if (
    decisionFile.decision === "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS" &&
    failedGates.length > 0
  ) {
    checkResult.gateRecalculationFailures.push(
      `CRITICAL: decision.json claims PROMOTE but ${failedGates.length} gates failed`,
    );
  }

  checkResult.passed =
    checkResult.decisionFileValid &&
    checkResult.allHashesValid &&
    checkResult.allGatesRecalculated &&
    checkResult.decisionMatches &&
    hashMatches &&
    checkResult.hashValidationFailures.length === 0 &&
    checkResult.gateRecalculationFailures.length === 0;

  console.log(`[decision-check] Expected decision: ${expectedDecision}`);
  console.log(`[decision-check] Actual decision:   ${decisionFile.decision}`);
  console.log(`[decision-check] Decision matches: ${decisionMatches}`);
  console.log(`[decision-check] decisionInputHash matches: ${hashMatches}`);
  console.log(`[decision-check] Passed: ${checkResult.passed}`);

  writeAndExit(checkResult);
}

function writeAndExit(result: DecisionCheckResult): void {
  writeFileSync(join(REPORTS_DIR, "decision-check.json"), JSON.stringify(result, null, 2), "utf8");
  if (!result.passed) {
    console.error("[decision-check] FAILED.");
    if (result.hashValidationFailures.length > 0) {
      console.error("[decision-check] Hash failures:", result.hashValidationFailures);
    }
    if (result.gateRecalculationFailures.length > 0) {
      console.error("[decision-check] Gate failures:", result.gateRecalculationFailures);
    }
    process.exit(1);
  } else {
    console.log("[decision-check] ALL CHECKS PASSED.");
  }
}

try {
  run();
} catch (err) {
  console.error("[decision-check] FAILED:", err);
  process.exit(1);
}
