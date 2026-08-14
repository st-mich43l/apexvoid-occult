import { describe, expect, it } from "vitest";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import {
  deriveMonthlyFlowConfidence,
  deriveMonthlyFlowCoverage,
} from "../metrics";
import type { MonthlyFlowEvidence } from "../types";

function evidence(
  id: string,
  knowledgeStatus: "approved" | "experimental",
  sourceIds: string[],
): MonthlyFlowEvidence {
  return {
    id,
    domain: "overall",
    monthKey: "2026-M01",
    category: "structural-activation",
    physicalFactId: id,
    ruleId: `rule:${id}`,
    targetPalaceIndex: 0,
    targetNatalPalaceName: "Mệnh",
    targetAnnualPalaceName: null,
    monthlyFrameRole: "focus",
    annualDomainRole: "focus",
    stackingGroup: id,
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    factIds: [id],
    sourceIds,
    knowledgeStatus,
  };
}

describe("Monthly Flow V1 metadata", () => {
  it("derives coverage from explicit availability components", () => {
    expect(
      deriveMonthlyFlowCoverage({
        hasMonthlyFrame: true,
        starKnowledgeComplete: true,
        transformationsComplete: true,
        requiresDomainFrame: false,
        hasDomainFrame: false,
      }),
    ).toEqual({ coveragePercent: 100, missingComponents: [] });

    expect(
      deriveMonthlyFlowCoverage({
        hasMonthlyFrame: true,
        starKnowledgeComplete: true,
        transformationsComplete: true,
        requiresDomainFrame: true,
        hasDomainFrame: false,
      }),
    ).toEqual({ coveragePercent: 75, missingComponents: ["annual-domain-frame"] });
  });

  it("reports confidence separately from numeric evidence weights", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const result = deriveMonthlyFlowConfidence(
      [
        evidence("verified", "approved", ["SRC-VERIFIED"]),
        evidence("engineering", "experimental", ["SRC-MONTHLY-ENG-001"]),
      ],
      loaded.knowledge.scoringProfile,
    );

    expect(result.confidencePercent).toBe(87.5);
    expect(result.verifiedContributionPercent).toBe(50);
    expect(result.experimentalContributionPercent).toBe(50);
    expect(result.engineeringContributionPercent).toBe(50);
  });

  it("reports zero confidence when no numeric evidence contributes", () => {
    const loaded = loadMonthlyFlowScoringKnowledgeV0();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    expect(deriveMonthlyFlowConfidence([], loaded.knowledge.scoringProfile)).toEqual({
      confidencePercent: 0,
      verifiedContributionPercent: 0,
      engineeringContributionPercent: 0,
      experimentalContributionPercent: 0,
    });
  });
});
