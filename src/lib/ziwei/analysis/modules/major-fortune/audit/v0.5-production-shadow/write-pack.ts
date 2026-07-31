import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runMajorFortuneV05ShadowAudit } from "./run-audit";

const PACK_REL = "research/major-fortune/v0.5-production-shadow";

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeMajorFortuneV05ShadowPack() {
  const metrics = runMajorFortuneV05ShadowAudit();
  const packDir = join(process.cwd(), PACK_REL);
  const reports = join(packDir, "reports");
  
  mkdirSync(packDir, { recursive: true });
  mkdirSync(reports, { recursive: true });

  const decision = {
    readinessDecision: metrics.equivalent ? "PROMOTE_MAJOR_FORTUNE_V050_TO_PRODUCTION_SHADOW" : "BLOCK_SHADOW_MISMATCH",
    hardGateFailures: metrics.equivalent ? [] : ["baseline-candidate-score-mismatch"],
  };

  writeJson(join(reports, "summary-report.json"), {
    ...metrics,
    decision,
  });

  // Phase 7 & 8: Generate coverage-display-policy-report.json
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

  writeJson(join(packDir, "decision.json"), decision);

  return { packDir, metrics, decision };
}
