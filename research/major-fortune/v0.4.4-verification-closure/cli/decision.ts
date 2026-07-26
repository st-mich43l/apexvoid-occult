/**
 * Major Fortune V0.4.4 Decision Engine.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { sha256File, sha256Object } from "../types/hash.js";
import type {
  MajorFortuneV044Decision,
  MajorFortuneV044DecisionGate,
  MajorFortuneV044DecisionValue,
  EquivalenceReport,
  MajorFortuneTimelineEquivalenceReport,
  MajorFortuneTemporalIndependenceReport,
  TelemetrySemanticsReport,
  MajorFortuneDeterminismReport,
  ArtifactManifest,
  MajorFortuneAuthorityManifest,
  MajorFortuneMigrationReport,
} from "../types/reports.js";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.4-verification-closure");
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
  console.log("[decision] Evaluating Major Fortune V0.4.4 production decision...");

  const gates: MajorFortuneV044DecisionGate[] = [];
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

  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  gate("fallback-equivalence-passed", !!(fallbackEquiv?.passed), "reports/fallback-equivalence-report.json",
    `Fallback differences: ${fallbackEquiv?.mismatchingObservationCount ?? "N/A"}`);

  const controlEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "trung-chau-control-report.json"));
  gate("trung-chau-control-passed", !!(controlEquiv?.passed), "reports/trung-chau-control-report.json",
    `Trung Châu differences: ${controlEquiv?.mismatchingObservationCount ?? "N/A"}`);

  const timelineEquiv = loadJson<MajorFortuneTimelineEquivalenceReport>(join(REPORTS_DIR, "timeline-equivalence-report.json"));
  gate("timeline-equivalence-passed", !!(timelineEquiv?.passed), "reports/timeline-equivalence-report.json",
    `Timeline mismatches: ${timelineEquiv?.aggregateMismatchCount ?? "N/A"}`);

  const temporalReport = loadJson<MajorFortuneTemporalIndependenceReport>(join(REPORTS_DIR, "temporal-independence-report.json"));
  gate("temporal-independence-passed", !!(temporalReport?.passed), "reports/temporal-independence-report.json",
    `Temporal contaminations: ${temporalReport?.contaminatedPairs ?? "N/A"}`);

  const telemetryReport = loadJson<TelemetrySemanticsReport>(join(REPORTS_DIR, "telemetry-semantics-report.json"));
  gate("telemetry-semantics-passed", !!(telemetryReport?.passed), "reports/telemetry-semantics-report.json",
    `Telemetry failures: ${telemetryReport?.failures?.length ?? "N/A"}`);

  const determinismReport = loadJson<MajorFortuneDeterminismReport>(join(REPORTS_DIR, "determinism-report.json"));
  gate("determinism-passed", !!(determinismReport?.passed), "reports/determinism-report.json",
    `Determinism differences: ${determinismReport?.mismatchingArtifactCount ?? "N/A"}`);

  const migrationReport = loadJson<MajorFortuneMigrationReport>(join(REPORTS_DIR, "baseline-migration-equivalence-report.json"));
  gate("baseline-migration-passed", !!(migrationReport?.passed), "reports/baseline-migration-equivalence-report.json",
    `Baseline migration semantic changes: ${migrationReport?.semanticChangeCount ?? "N/A"}`);

  const requiredReports = [
    "fallback-equivalence-report.json",
    "trung-chau-control-report.json",
    "timeline-equivalence-report.json",
    "temporal-independence-report.json",
    "telemetry-semantics-report.json",
    "determinism-report.json",
    "baseline-migration-equivalence-report.json",
    "artifact-manifest.json",
    "authority-manifest.json",
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

  const authorityManifest = loadJson<MajorFortuneAuthorityManifest>(join(REPORTS_DIR, "authority-manifest.json"));

  const failedGates = gates.filter((g) => g.status === "fail");
  let decision: MajorFortuneV044DecisionValue;

  if (rollback) {
    decision = "ROLL_BACK_MAJOR_FORTUNE_V04";
  } else if (failedGates.length > 0) {
    decision = "HOLD_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE";
  } else {
    decision = "PROMOTE_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE";
  }

  const decisionInput = {
    gates: gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  };
  const decisionInputHash = sha256Object(decisionInput);
  const headSha = getHeadSha();

  const decisionDoc: MajorFortuneV044Decision = {
    schemaVersion: "0.4.4",
    decision,
    baseSha: "b64e3815f137a166c00d725cbe15d2de0a19ee38", // The expected base SHA
    auditedHeadSha: headSha,
    mergeCandidateSha: null,
    corpusId: "major-fortune-v0.2-audit-corpus",
    corpusHash: "pending",
    authorityManifestHash: authorityManifest ? sha256Object(authorityManifest) : "missing",
    artifactManifestHash: manifest ? sha256Object(manifest) : "missing",
    decisionInputHash,
    integrationVersion: "0.4.4",
    modelVersion: "v0.3-ordinal",
    formulaVersion: "v0.3-ordinal-four-pillar",
    contractVersion: "0.3.3",
    gates,
    failedGateIds: failedGates.map((g) => g.gateId),
  };

  writeFileSync(join(REPORTS_DIR, "decision.json"), JSON.stringify(decisionDoc, null, 2), "utf8");

  console.log(`[decision] Decision: ${decision}`);
  console.log(`[decision] Failed gates: ${failedGates.length > 0 ? failedGates.map((g) => g.gateId).join(", ") : "none"}`);
  console.log(`[decision] decisionInputHash: ${decisionInputHash}`);

  if (decision !== "PROMOTE_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE") {
    process.exit(1);
  }
}

try {
  run();
} catch (err) {
  console.error("[decision] FAILED:", err);
  process.exit(1);
}

