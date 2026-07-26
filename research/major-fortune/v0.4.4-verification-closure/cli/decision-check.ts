/**
 * Major Fortune V0.4.4 Decision Checker.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sha256File, sha256Object } from "../types/hash.js";
import type {
  MajorFortuneV044Decision,
  DecisionCheckResult,
  MajorFortuneV044DecisionValue,
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

function run(): void {
  console.log("[decision-check] Validating decision document integrity...");

  const decisionDoc = loadJson<MajorFortuneV044Decision>(join(REPORTS_DIR, "decision.json"));

  const report: DecisionCheckResult = {
    schemaVersion: "0.4.4",
    decisionFileValid: false,
    allHashesValid: true,
    allGatesRecalculated: true,
    decisionMatches: false,
    expectedDecision: "PROMOTE_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE",
    actualDecision: null,
    hashValidationFailures: [],
    gateRecalculationFailures: [],
    passed: false,
  };

  if (!decisionDoc || decisionDoc.schemaVersion !== "0.4.4") {
    console.error("[decision-check] Invalid or missing decision.json");
    report.decisionFileValid = false;
    writeFileSync(join(REPORTS_DIR, "decision-check.json"), JSON.stringify(report, null, 2), "utf8");
    process.exit(1);
  }
  report.decisionFileValid = true;
  report.actualDecision = decisionDoc.decision;

  // 1. Verify input hash matches the gates array in the document.
  const decisionInput = {
    gates: decisionDoc.gates.map((g) => ({ gateId: g.gateId, status: g.status, sourceReportSha256: g.sourceReportSha256 })),
  };
  const expectedInputHash = sha256Object(decisionInput);
  if (decisionDoc.decisionInputHash !== expectedInputHash) {
    report.allHashesValid = false;
    report.hashValidationFailures.push("decisionInputHash mismatch");
  }

  // 2. Verify each gate's source report hash actually matches the file on disk.
  for (const gate of decisionDoc.gates) {
    const reportPath = join(ROOT, gate.sourceReport);
    if (!existsSync(reportPath)) {
      report.allHashesValid = false;
      report.hashValidationFailures.push(`Missing report for gate ${gate.gateId}: ${gate.sourceReport}`);
      continue;
    }
    const actualHash = sha256File(reportPath);
    if (actualHash !== gate.sourceReportSha256) {
      report.allHashesValid = false;
      report.hashValidationFailures.push(`Hash mismatch for gate ${gate.gateId}: ${gate.sourceReport}`);
    }
  }

  // 3. Verify the decision aligns with the gates.
  const hasFailedGates = decisionDoc.gates.some((g) => g.status === "fail");
  let calculatedDecision: MajorFortuneV044DecisionValue;

  if (hasFailedGates) {
    calculatedDecision = "HOLD_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE";
  } else {
    calculatedDecision = "PROMOTE_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE";
  }

  // Handle manual rollback override if it was set
  if (decisionDoc.decision === "ROLL_BACK_MAJOR_FORTUNE_V04") {
    calculatedDecision = "ROLL_BACK_MAJOR_FORTUNE_V04";
  }

  if (decisionDoc.decision !== calculatedDecision) {
    report.decisionMatches = false;
    report.gateRecalculationFailures.push(`Expected ${calculatedDecision} based on gates, but got ${decisionDoc.decision}`);
  } else {
    report.decisionMatches = true;
  }

  report.passed = report.decisionFileValid && report.allHashesValid && report.decisionMatches;
  
  if (decisionDoc.decision !== report.expectedDecision) {
    report.passed = false;
  }

  writeFileSync(join(REPORTS_DIR, "decision-check.json"), JSON.stringify(report, null, 2), "utf8");

  console.log(`[decision-check] Passed: ${report.passed}`);
  if (report.hashValidationFailures.length > 0) {
    console.error("[decision-check] Hash failures:", report.hashValidationFailures);
  }
  if (report.gateRecalculationFailures.length > 0) {
    console.error("[decision-check] Gate failures:", report.gateRecalculationFailures);
  }

  if (!report.passed) {
    process.exit(1);
  }
}

try {
  run();
} catch (err) {
  console.error("[decision-check] FAILED:", err);
  process.exit(1);
}
