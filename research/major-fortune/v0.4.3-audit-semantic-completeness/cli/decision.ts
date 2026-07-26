/**
 * Major Fortune V0.4.3 Decision Engine.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { sha256File, sha256Object } from "../types/hash.js";
import type {
  MajorFortuneV043Decision,
  MajorFortuneV043DecisionGate,
  MajorFortuneV043DecisionValue,
  EquivalenceReport,
  TimelineEquivalenceReport,
  TemporalIndependenceReport,
  TelemetrySemanticsReport,
  MajorFortuneDeterminismReport,
  ArtifactManifest,
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

function getHeadSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: process.cwd() }).toString().trim();
  } catch {
    return "unknown";
  }
}

function run(): void {
  console.log("[decision] Evaluating Major Fortune V0.4.3 production decision...");

  const gates: MajorFortuneV043DecisionGate[] = [];
  let rollback = false;

  function gate(
    gateId: string,
    condition: boolean,
    sourceReport: string,
    detail: string,
    critical = false,
  ): void {
    const reportPath = join(ROOT, sourceReport);
    const sha = existsSync(reportPath) ? sha256File(reportPath) : "missing";
    gates.push({
      gateId,
      status: condition ? "pass" : "fail",
      sourceReport,
      sourceReportSha256: sha,
      detail,
    });
    if (!condition) {
      console.log(`[decision] GATE FAIL: ${gateId} — ${detail}`);
      if (critical) rollback = true;
    } else {
      console.log(`[decision] gate pass: ${gateId}`);
    }
  }

  const baselineManifest = loadJson<{ schemaVersion: string }>(join(ROOT, "baselines/baseline-manifest.json"));
  gate("baseline-manifest-valid", !!baselineManifest && baselineManifest.schemaVersion === "0.4.3", "baselines/baseline-manifest.json", "Baseline manifest present and schema 0.4.3");

  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  gate("fallback-equivalence-passed", !!(fallbackEquiv?.passed), "reports/fallback-equivalence-report.json",
    `Fallback differences: ${fallbackEquiv?.mismatchingObservationCount ?? "N/A"}`);

  const controlEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "trung-chau-control-report.json"));
  gate("trung-chau-control-passed", !!(controlEquiv?.passed), "reports/trung-chau-control-report.json",
    `Trung Châu differences: ${controlEquiv?.mismatchingObservationCount ?? "N/A"}`);

  const timelineEquiv = loadJson<TimelineEquivalenceReport>(join(REPORTS_DIR, "timeline-equivalence-report.json"));
  gate("timeline-equivalence-passed", !!(timelineEquiv?.passed), "reports/timeline-equivalence-report.json",
    `Timeline mismatches: ${timelineEquiv?.timelineMismatchCount ?? "N/A"}`);

  const temporalReport = loadJson<TemporalIndependenceReport>(join(REPORTS_DIR, "temporal-independence-report.json"));
  gate("temporal-independence-passed", !!(temporalReport?.passed), "reports/temporal-independence-report.json",
    `Temporal contaminations: ${temporalReport?.contaminatedPairs ?? "N/A"}`);

  const telemetryReport = loadJson<TelemetrySemanticsReport>(join(REPORTS_DIR, "telemetry-semantics-report.json"));
  gate("telemetry-semantics-passed", !!(telemetryReport?.passed), "reports/telemetry-semantics-report.json",
    `Telemetry failures: ${telemetryReport?.failures?.length ?? "N/A"}`);

  const determinismReport = loadJson<MajorFortuneDeterminismReport>(join(REPORTS_DIR, "determinism-report.json"));
  gate("determinism-passed", !!(determinismReport?.passed), "reports/determinism-report.json",
    `Determinism differences: ${determinismReport?.deterministicDifferences ?? "N/A"}`);

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
  gate("all-required-reports-present", allPresent, "reports/artifact-manifest.json",
    `Required reports: ${requiredReports.filter((f) => !existsSync(join(REPORTS_DIR, f))).join(", ") || "all present"}`);

  const manifest = loadJson<ArtifactManifest>(join(REPORTS_DIR, "artifact-manifest.json"));
  let hashIntegrity = true;
  if (manifest) {
    for (const artifact of manifest.artifacts) {
      const absPath = join(ROOT, artifact.path);
      if (!existsSync(absPath)) { hashIntegrity = false; break; }
      const actual = sha256File(absPath);
      if (actual !== artifact.sha256) { hashIntegrity = false; break; }
    }
  } else {
    hashIntegrity = false;
  }
  gate("artifact-hash-integrity", hashIntegrity, "reports/artifact-manifest.json",
    "All artifact SHA256 hashes verified");

  const noMissingBaseline = (fallbackEquiv?.missingBaselineIds.length ?? 1) === 0 &&
    (controlEquiv?.missingBaselineIds.length ?? 1) === 0;
  gate("no-missing-baseline-observations", noMissingBaseline, "reports/fallback-equivalence-report.json",
    "No baseline observations missing from current run");

  const noExtraObservations = (fallbackEquiv?.missingCurrentIds.length ?? 1) === 0 &&
    (controlEquiv?.missingCurrentIds.length ?? 1) === 0;
  gate("no-extra-unclassified-observations", noExtraObservations, "reports/fallback-equivalence-report.json",
    "No extra unclassified observations");

  const failedGates = gates.filter((g) => g.status === "fail");
  let decision: MajorFortuneV043DecisionValue;

  if (rollback) {
    decision = "ROLL_BACK_MAJOR_FORTUNE_V04";
  } else if (failedGates.length > 0) {
    decision = "HOLD_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT";
  } else {
    decision = "PROMOTE_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT";
  }

  const decisionInput = {
    gates: gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  };
  const decisionInputHash = sha256Object(decisionInput);
  const headSha = getHeadSha();

  const decisionDoc: MajorFortuneV043Decision = {
    schemaVersion: "0.4.3",
    decision,
    baseSha: "d0baedec8bc44953bb9c36095642c438ca37ded2",
    headSha,
    corpusId: "major-fortune-v0.2-audit-corpus",
    integrationVersion: "0.4.3",
    modelVersion: "v0.3-ordinal",
    formulaVersion: "v0.3-ordinal-four-pillar",
    contractVersion: "0.3.0",
    gates,
    failedGateIds: failedGates.map((g) => g.gateId),
    decisionInputHash,
  };

  writeFileSync(join(REPORTS_DIR, "decision.json"), JSON.stringify(decisionDoc, null, 2), "utf8");

  console.log(`[decision] Decision: ${decision}`);
  console.log(`[decision] Failed gates: ${failedGates.length > 0 ? failedGates.map((g) => g.gateId).join(", ") : "none"}`);
  console.log(`[decision] decisionInputHash: ${decisionInputHash}`);

  if (decision !== "PROMOTE_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT") {
    process.exit(1);
  }
}

try {
  run();
} catch (err) {
  console.error("[decision] FAILED:", err);
  process.exit(1);
}
