/**
 * Major Fortune V0.4.2 Decision Engine.
 *
 * Derives the production decision from validated reports.
 * All hard gates are evaluated from report files — not from telemetry.
 * Does NOT trust any pre-existing decision file.
 *
 * Allowed decisions:
 *   PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS
 *   HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS
 *   ROLL_BACK_MAJOR_FORTUNE_V04
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { sha256File, sha256Object } from "../types/hash";
import type {
  MajorFortuneV042Decision,
  MajorFortuneV042DecisionGate,
  MajorFortuneV042DecisionValue,
  EquivalenceReport,
  TimelineEquivalenceReport,
  TemporalIndependenceReport,
  TelemetrySemanticsReport,
  ArtifactManifest,
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

function getHeadSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: process.cwd() }).toString().trim();
  } catch {
    return "unknown";
  }
}

function run(): void {
  console.log("[decision] Evaluating Major Fortune V0.4.2 production decision...");

  const gates: MajorFortuneV042DecisionGate[] = [];
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

  // ── Gate 1: Baseline manifest present ────────────────────────────────────
  const baselineManifest = loadJson<{ schemaVersion: string }>(join(ROOT, "baselines/baseline-manifest.json"));
  gate("baseline-manifest-valid", !!baselineManifest && baselineManifest.schemaVersion === "0.4.2", "baselines/baseline-manifest.json", "Baseline manifest present and schema 0.4.2");

  // ── Gate 2: Fallback equivalence ─────────────────────────────────────────
  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  gate("fallback-equivalence-passed", !!(fallbackEquiv?.passed), "reports/fallback-equivalence-report.json",
    `Fallback differences: ${fallbackEquiv?.unexpectedDifferenceCount ?? "N/A"}`);

  // ── Gate 3: Trung Châu control ────────────────────────────────────────────
  const controlEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "trung-chau-control-report.json"));
  gate("trung-chau-control-passed", !!(controlEquiv?.passed), "reports/trung-chau-control-report.json",
    `Trung Châu differences: ${controlEquiv?.unexpectedDifferenceCount ?? "N/A"}`);

  // ── Gate 4: Timeline equivalence ──────────────────────────────────────────
  const timelineEquiv = loadJson<TimelineEquivalenceReport>(join(REPORTS_DIR, "timeline-equivalence-report.json"));
  gate("timeline-equivalence-passed", !!(timelineEquiv?.passed), "reports/timeline-equivalence-report.json",
    `Timeline mismatches: ${timelineEquiv?.timelineMismatchCount ?? "N/A"}`);

  // ── Gate 5: Temporal independence ─────────────────────────────────────────
  const temporalReport = loadJson<TemporalIndependenceReport>(join(REPORTS_DIR, "temporal-independence-report.json"));
  gate("temporal-independence-passed", !!(temporalReport?.passed), "reports/temporal-independence-report.json",
    `Temporal contaminations: ${temporalReport?.temporalContaminationCount ?? "N/A"}`);

  // ── Gate 6: Telemetry semantics ───────────────────────────────────────────
  const telemetryReport = loadJson<TelemetrySemanticsReport>(join(REPORTS_DIR, "telemetry-semantics-report.json"));
  gate("telemetry-semantics-passed", !!(telemetryReport?.passed), "reports/telemetry-semantics-report.json",
    `Telemetry failures: ${telemetryReport?.failures?.join(", ") ?? "N/A"}`);

  // ── Gate 7: All required reports present ─────────────────────────────────
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
  gate("all-required-reports-present", allPresent, "reports/artifact-manifest.json",
    `Required reports: ${requiredReports.filter((f) => !existsSync(join(REPORTS_DIR, f))).join(", ") || "all present"}`);

  // ── Gate 8: Artifact hash integrity ──────────────────────────────────────
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

  // ── Gate 9: No missing/extra observations ─────────────────────────────────
  const noMissingBaseline = (fallbackEquiv?.missingBaselineIds.length ?? 1) === 0 &&
    (controlEquiv?.missingBaselineIds.length ?? 1) === 0;
  gate("no-missing-baseline-observations", noMissingBaseline, "reports/fallback-equivalence-report.json",
    "No baseline observations missing from current run");

  const noExtraObservations = (fallbackEquiv?.missingCurrentIds.length ?? 1) === 0 &&
    (controlEquiv?.missingCurrentIds.length ?? 1) === 0;
  gate("no-extra-unclassified-observations", noExtraObservations, "reports/fallback-equivalence-report.json",
    "No extra unclassified observations");

  // ── Derive decision ───────────────────────────────────────────────────────
  const failedGates = gates.filter((g) => g.status === "fail");
  let decision: MajorFortuneV042DecisionValue;

  if (rollback) {
    decision = "ROLL_BACK_MAJOR_FORTUNE_V04";
  } else if (failedGates.length > 0) {
    decision = "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
  } else {
    decision = "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS";
  }

  // ── Decision input hash ───────────────────────────────────────────────────
  const decisionInput = {
    gates: gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  };
  const decisionInputHash = sha256Object(decisionInput);

  const headSha = getHeadSha();

  const decisionDoc: MajorFortuneV042Decision = {
    schemaVersion: "0.4.2",
    decision,
    baseSha: "fb1ffffc02ae87e7f8dd6acf688b2af9c1bf9831",
    headSha,
    corpusId: "major-fortune-v0.2-audit-corpus",
    integrationVersion: "0.4.2",
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

  if (decision !== "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS") {
    process.exit(1);
  }
}

try {
  run();
} catch (err) {
  console.error("[decision] FAILED:", err);
  process.exit(1);
}
