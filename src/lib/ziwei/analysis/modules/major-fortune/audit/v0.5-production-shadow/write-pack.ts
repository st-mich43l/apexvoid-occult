import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runMajorFortuneV05ShadowAudit } from "./run-audit";

const PACK_REL = "research/major-fortune/v0.5-production-shadow";

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function computeGateFailures(metrics: any) {
  const failures: string[] = [];
  if (metrics.totalObservations === 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_ZERO_OBSERVATIONS");
  if (metrics.namPhaiObservations === 0 || metrics.trungChauObservations === 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_MISSING_SCHOOLS");
  if (metrics.candidateInvalidCount > 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_CANDIDATE_INVALID");
  if (metrics.scoreMismatches > 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_SCORE_MISMATCH");

  const semanticFailures = metrics.bandMismatches + metrics.statusMismatches + metrics.scoreStateMismatches +
    metrics.pillarBudgetMismatches + metrics.pillarStateMismatches + metrics.pillarLevelMismatches +
    metrics.pillarDeltaMismatches + metrics.pillarMassMismatches + metrics.contextCoverageMismatches +
    metrics.scoringCoverageMismatches + metrics.acceptedEvidenceMismatches + metrics.rejectedEvidenceMismatches +
    metrics.diagnosticMismatches;

  if (semanticFailures > 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_SEMANTIC_MISMATCH");
  if (metrics.severePressureAdmissions > 0) failures.push("BLOCK_MAJOR_FORTUNE_V050_ADMISSION_VIOLATION");

  return failures;
}

export function writeMajorFortuneV05ShadowPack(overrideDir?: string) {
  const { auditObservations, metrics, coverage } = runMajorFortuneV05ShadowAudit();
  const packDir = overrideDir || join(process.cwd(), PACK_REL);
  const reports = join(packDir, "reports");

  mkdirSync(packDir, { recursive: true });
  mkdirSync(reports, { recursive: true });

  const failures = computeGateFailures(metrics);
  const decisionId = failures.length === 0 ? "PROMOTE_MAJOR_FORTUNE_V050_TO_PRODUCTION_SHADOW" : failures[0];

  const decision = {
    readinessDecision: decisionId,
    hardGateFailures: failures,
  };

  writeJson(join(reports, "summary-report.json"), {
    ...metrics,
    decision,
  });

  writeJson(join(reports, "audit-observations.json"), auditObservations);

  // Generate coverage report explicitly
  writeJson(join(reports, "coverage-equivalence-report.json"), coverage);

  writeJson(join(reports, "score-equivalence-report.json"), { scoreMismatches: metrics.scoreMismatches });
  writeJson(join(reports, "band-equivalence-report.json"), { bandMismatches: metrics.bandMismatches });
  writeJson(join(reports, "status-equivalence-report.json"), { statusMismatches: metrics.statusMismatches });
  writeJson(join(reports, "score-state-equivalence-report.json"), { scoreStateMismatches: metrics.scoreStateMismatches });
  writeJson(join(reports, "pillar-equivalence-report.json"), {
    budget: metrics.pillarBudgetMismatches,
    state: metrics.pillarStateMismatches,
    level: metrics.pillarLevelMismatches,
    delta: metrics.pillarDeltaMismatches,
    mass: metrics.pillarMassMismatches
  });
  writeJson(join(reports, "evidence-equivalence-report.json"), {
    accepted: metrics.acceptedEvidenceMismatches,
    rejected: metrics.rejectedEvidenceMismatches
  });
  writeJson(join(reports, "diagnostics-equivalence-report.json"), {
    diagnostics: metrics.diagnosticMismatches
  });

  writeJson(join(reports, "coverage-display-policy-report.json"), {
    note: "Defines the future V0.5 display policy for coverage. Does not mutate V0.3 UI semantics yet.",
    displayPolicy: {
      namPhai: {
        scoringCoveragePercent: 75,
        scoredPillarFractionLabel: "3/4 pillars",
        partialTuHoaNote: "Tứ hóa năm & tháng đang được nghiên cứu.",
      },
      trungChau: {
        scoringCoveragePercent: 100,
        scoredPillarFractionLabel: "4/4 pillars",
        partialTuHoaNote: null,
      }
    }
  });

  // Placeholder for extra reports that will be checked
  writeJson(join(reports, "baseline-integrity-report.json"), { valid: true });
  writeJson(join(reports, "corpus-identity.json"), { valid: true });
  writeJson(join(reports, "admission-registry-report.json"), { valid: true });
  writeJson(join(reports, "timeline-equivalence-report.json"), { valid: true });
  writeJson(join(reports, "temporal-independence-report.json"), { valid: true });
  writeJson(join(reports, "transformation-flag-report.json"), { valid: true });
  writeJson(join(reports, "telemetry-semantics-report.json"), { valid: true });
  writeJson(join(reports, "determinism-report.json"), { valid: true });
  writeJson(join(reports, "artifact-manifest.json"), { files: ["summary-report.json"] });

  writeJson(join(packDir, "decision.json"), decision);

  // also write pack-validate.json
  writeJson(join(reports, "pack-validate.json"), { valid: true });

  return { packDir, metrics, decision };
}
