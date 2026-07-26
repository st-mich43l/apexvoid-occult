/**
 * Major Fortune V0.4.2 Validation.
 *
 * Schema-validates all reports, checks artifact hashes match manifest,
 * detects duplicate observation IDs, validates invariants.
 * Exits non-zero on any failure.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sha256File } from "../types/hash";
import type { ArtifactManifest, EquivalenceReport, TemporalIndependenceReport, TimelineEquivalenceReport, TelemetrySemanticsReport } from "../types/reports";
import type { MajorFortuneAuditObservation } from "../types/audit-observation";

const ROOT = resolve(process.cwd(), "research/major-fortune/v0.4.2-audit-truthfulness");
const REPORTS_DIR = join(ROOT, "reports");
const RAW_DIR = join(REPORTS_DIR, "raw");

let failures = 0;
function fail(msg: string): void {
  console.error(`[validate] FAIL: ${msg}`);
  failures++;
}
function pass(msg: string): void {
  console.log(`[validate] PASS: ${msg}`);
}

function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    fail(`Missing required file: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    fail(`Malformed JSON: ${path}`);
    return null;
  }
}

function validateObservations(label: string, observations: MajorFortuneAuditObservation[]): void {
  const seenIds = new Set<string>();
  let dupCount = 0;
  let invalidScore = 0;
  let invalidCoverage = 0;
  let invariantViolations = 0;

  for (const o of observations) {
    // Duplicate IDs.
    if (seenIds.has(o.observationId)) dupCount++;
    seenIds.add(o.observationId);

    // Score bounds.
    if (o.score !== null && (o.score < 0 || o.score > 100)) invalidScore++;

    // Coverage bounds.
    if (o.contextCoverage < 0 || o.contextCoverage > 1) invalidCoverage++;
    if (o.scoringCoverage < 0 || o.scoringCoverage > 1) invalidCoverage++;

    // Transformation count invariant.
    const ts = o.transformationSummary;
    if (ts.directTransformationActivationCount > ts.acceptedTransformationEvidenceCount) {
      invariantViolations++;
    }
    if (ts.acceptedTransformationEvidenceCount > o.diagnostics.acceptedEvidenceCount) {
      invariantViolations++;
    }

    // Pillar level bounds.
    for (const [, pillar] of Object.entries(o.pillars)) {
      if (pillar.level !== null && ![-2, -1, 0, 1, 2].includes(pillar.level)) {
        invariantViolations++;
      }
    }
  }

  if (dupCount > 0) fail(`${label}: ${dupCount} duplicate observation IDs`);
  else pass(`${label}: no duplicate observation IDs (${seenIds.size} unique)`);

  if (invalidScore > 0) fail(`${label}: ${invalidScore} observations with score outside [0,100]`);
  else pass(`${label}: all scores in bounds`);

  if (invalidCoverage > 0) fail(`${label}: ${invalidCoverage} coverage values outside [0,1]`);
  else pass(`${label}: all coverage values in bounds`);

  if (invariantViolations > 0) fail(`${label}: ${invariantViolations} transformation count invariant violations`);
  else pass(`${label}: transformation count invariants satisfied`);
}

function run(): void {
  console.log("[validate] Major Fortune V0.4.2 Validation...");

  // ── 1. Required files ────────────────────────────────────────────────────
  const requiredFiles = [
    "artifact-manifest.json",
    "fallback-equivalence-report.json",
    "trung-chau-control-report.json",
    "timeline-equivalence-report.json",
    "temporal-independence-report.json",
    "telemetry-semantics-report.json",
    "score-distribution-report.json",
    "enabled-coverage-report.json",
    "corpus-identity.json",
  ];
  for (const f of requiredFiles) {
    if (!existsSync(join(REPORTS_DIR, f))) {
      fail(`Missing required report: ${f}`);
    } else {
      pass(`Present: ${f}`);
    }
  }

  // ── 2. Artifact manifest hash verification ───────────────────────────────
  const manifest = loadJson<ArtifactManifest>(join(REPORTS_DIR, "artifact-manifest.json"));
  if (manifest) {
    let hashFailures = 0;
    for (const artifact of manifest.artifacts) {
      const absPath = join(ROOT, artifact.path);
      if (!existsSync(absPath)) {
        fail(`Artifact file missing: ${artifact.path}`);
        hashFailures++;
        continue;
      }
      const actualHash = sha256File(absPath);
      if (actualHash !== artifact.sha256) {
        fail(`Hash mismatch: ${artifact.path} (expected ${artifact.sha256}, got ${actualHash})`);
        hashFailures++;
      }
    }
    if (hashFailures === 0) pass(`All ${manifest.artifacts.length} artifact hashes verified`);
  }

  // ── 3. Validate raw observations ─────────────────────────────────────────
  const fallback = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "nam-phai-fallback.json"));
  const enabled = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "nam-phai-enabled.json"));
  const control = loadJson<MajorFortuneAuditObservation[]>(join(RAW_DIR, "trung-chau-control.json"));

  if (fallback) validateObservations("Nam Phái fallback", fallback);
  if (enabled) validateObservations("Nam Phái enabled", enabled);
  if (control) validateObservations("Trung Châu control", control);

  // ── 4. Check equivalence reports ─────────────────────────────────────────
  const fallbackEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "fallback-equivalence-report.json"));
  if (fallbackEquiv) {
    if (!fallbackEquiv.passed) fail(`Fallback equivalence FAILED: ${fallbackEquiv.unexpectedDifferenceCount} unexpected differences`);
    else pass(`Fallback equivalence: passed (${fallbackEquiv.comparedObservationCount} observations compared)`);
    if (fallbackEquiv.missingBaselineIds.length > 0) fail(`Fallback: ${fallbackEquiv.missingBaselineIds.length} missing baseline IDs`);
    if (fallbackEquiv.missingCurrentIds.length > 0) fail(`Fallback: ${fallbackEquiv.missingCurrentIds.length} missing current IDs`);
  }

  const controlEquiv = loadJson<EquivalenceReport>(join(REPORTS_DIR, "trung-chau-control-report.json"));
  if (controlEquiv) {
    if (!controlEquiv.passed) fail(`Trung Châu control FAILED: ${controlEquiv.unexpectedDifferenceCount} unexpected differences`);
    else pass(`Trung Châu control: passed (${controlEquiv.comparedObservationCount} observations compared)`);
  }

  // ── 5. Timeline equivalence ───────────────────────────────────────────────
  const timelineReport = loadJson<TimelineEquivalenceReport>(join(REPORTS_DIR, "timeline-equivalence-report.json"));
  if (timelineReport) {
    if (!timelineReport.passed) fail(`Timeline equivalence FAILED: ${timelineReport.timelineMismatchCount} mismatches`);
    else pass(`Timeline equivalence: passed`);
  }

  // ── 6. Temporal independence ──────────────────────────────────────────────
  const temporalReport = loadJson<TemporalIndependenceReport>(join(REPORTS_DIR, "temporal-independence-report.json"));
  if (temporalReport) {
    if (!temporalReport.passed) fail(`Temporal independence FAILED: ${temporalReport.temporalContaminationCount} contaminations`);
    else pass(`Temporal independence: passed`);
  }

  // ── 7. Telemetry semantics ────────────────────────────────────────────────
  const telemetryReport = loadJson<TelemetrySemanticsReport>(join(REPORTS_DIR, "telemetry-semantics-report.json"));
  if (telemetryReport) {
    if (!telemetryReport.passed) fail(`Telemetry semantics FAILED: ${telemetryReport.failures.join(", ")}`);
    else pass(`Telemetry semantics: passed`);
  }

  // ── 8. School counts ─────────────────────────────────────────────────────
  if (fallback && control) {
    if (fallback.length === 0) fail("Nam Phái: zero observations");
    else pass(`Nam Phái: ${fallback.length} observations`);
    if (control.length === 0) fail("Trung Châu: zero observations");
    else pass(`Trung Châu: ${control.length} observations`);
  }

  // ── Final result ──────────────────────────────────────────────────────────
  if (failures > 0) {
    console.error(`[validate] FAILED with ${failures} validation failures.`);
    process.exit(1);
  } else {
    console.log(`[validate] ALL VALIDATIONS PASSED.`);
  }
}

try {
  run();
} catch (err) {
  console.error("[validate] FAILED:", err);
  process.exit(1);
}
