/**
 * Major Fortune V0.4.3 Independent Decision Check.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sha256File, sha256Object } from "../types/hash.js";
import type {
  MajorFortuneV043Decision,
  DecisionCheckResult,
  EquivalenceReport,
  TimelineEquivalenceReport,
  TemporalIndependenceReport,
  TelemetrySemanticsReport,
  MajorFortuneDeterminismReport,
  ArtifactManifest,
  MajorFortuneV043DecisionValue,
} from "../types/reports.js";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.3-audit-semantic-completeness");
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
  console.log("[decision-check] Independent verification of Major Fortune V0.4.3 decision...");

  const checkResult: DecisionCheckResult = {
    schemaVersion: "0.4.3",
    decisionFileValid: false,
    allHashesValid: false,
    allGatesRecalculated: false,
    decisionMatches: false,
    expectedDecision: "HOLD_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT",
    actualDecision: null as any,
    hashValidationFailures: [],
    gateRecalculationFailures: [],
    passed: false,
  };

  const decisionFile = loadJson<MajorFortuneV043Decision>(join(REPORTS_DIR, "decision.json"));
  if (!decisionFile) {
    checkResult.gateRecalculationFailures.push("decision.json missing or invalid");
    writeAndExit(checkResult);
    return;
  }
  checkResult.decisionFileValid = decisionFile.schemaVersion === "0.4.3";
  checkResult.actualDecision = decisionFile.decision as any;

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
    !!baselineManifest && baselineManifest.schemaVersion === "0.4.3",
    "baselines/baseline-manifest.json");

  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  recalcGate("fallback-equivalence-passed",
    !!(fallbackEquiv?.passed),
    "reports/fallback-equivalence-report.json",
    `Fallback differences: ${fallbackEquiv?.mismatchingObservationCount}`);

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

  const determinismReport = loadJson<MajorFortuneDeterminismReport>(join(REPORTS_DIR, "determinism-report.json"));
  recalcGate("determinism-passed",
    !!(determinismReport?.passed),
    "reports/determinism-report.json");

  const requiredReports = [
    "fallback-equivalence-report.json",
    "trung-chau-control-report.json",
    "timeline-equivalence-report.json",
    "temporal-independence-report.json",
    "telemetry-semantics-report.json",
    "determinism-report.json",
    "artifact-manifest.json",
    "corpus-identity.json",
  ];
  const allPresent = requiredReports.every((f) => existsSync(join(REPORTS_DIR, f)));
  recalcGate("all-required-reports-present", allPresent, "reports/artifact-manifest.json");

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

  const failedGates = gates.filter((g) => g.status === "fail");
  let expectedDecision: MajorFortuneV043DecisionValue;
  if (failedGates.length > 0) {
    expectedDecision = "HOLD_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT";
  } else {
    expectedDecision = "PROMOTE_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT";
  }
  checkResult.expectedDecision = expectedDecision as any;

  const recalculatedInputHash = sha256Object({
    gates: gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  });

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

  if (
    decisionFile.decision === "PROMOTE_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT" &&
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
