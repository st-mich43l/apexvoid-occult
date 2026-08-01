import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const PACK = join(process.cwd(), "research/major-fortune/v0.5-production-shadow");

function hashFile(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function main(): void {
  const summary = JSON.parse(readFileSync(join(PACK, "reports/summary-report.json"), "utf8"));

  if (summary.totalObservations !== 2332) throw new Error("Invalid total observations");
  if (summary.namPhaiObservations !== 1166) throw new Error("Invalid Nam Phai observations");
  if (summary.trungChauObservations !== 1166) throw new Error("Invalid Trung Chau observations");

  const metrics = [
    "scoreMismatches",
    "bandMismatches",
    "statusMismatches",
    "scoreStateMismatches",
    "pillarBudgetMismatches",
    "pillarStateMismatches",
    "pillarLevelMismatches",
    "pillarDeltaMismatches",
    "pillarMassMismatches",
    "contextCoverageMismatches",
    "scoringCoverageMismatches",
    "acceptedEvidenceMismatches",
    "rejectedEvidenceMismatches",
    "diagnosticMismatches",
    "candidateInvalidCount",
    "candidateErrorCount",
    "blockedFamilyAdmissions",
    "severePressureAdmissions",
    "timelineMismatches",
    "temporalContaminations",
    "telemetryViolations",
    "determinismMismatches",
    "artifactHashMismatches"
  ];

  let hasFailures = false;
  for (const metric of metrics) {
    if (summary[metric] !== 0) {
      hasFailures = true;
    }
  }

  // Recalculate expected decision
  let expectedDecision = hasFailures ? "MAJOR_FORTUNE_V05_SHADOW_REJECTED" : "PROMOTE_MAJOR_FORTUNE_V050_TO_PRODUCTION_SHADOW";

  const decision = JSON.parse(readFileSync(join(PACK, "decision.json"), "utf8"));
  if (decision.readinessDecision !== expectedDecision) {
    console.error(`Decision mismatch: expected ${expectedDecision}, got ${decision.readinessDecision}`);
    process.exit(1);
  }

  // Recalculate artifact hashes (simple dry run of hash generation for manifest)
  const manifest = JSON.parse(readFileSync(join(PACK, "reports/artifact-manifest.json"), "utf8"));
  for (const file of manifest.files) {
    hashFile(join(PACK, "reports", file));
  }

  console.log("Decision check passed independently.");
}

main();
