import { describe, expect, it } from "vitest";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { aggregateMajorFortuneEvidence } from "../aggregate";
import { emptyMajorFortuneDiagnostics, type MajorFortuneEvidence } from "../types";

function makeEvidence(overrides: Partial<MajorFortuneEvidence>): MajorFortuneEvidence {
  return {
    id: "test",
    scope: "overall",
    domainId: null,
    category: "star",
    physicalFactId: "star:0:Test",
    ruleId: "RULE-TEST",
    targetPalaceIndex: 0,
    targetNatalPalaceName: "Mệnh",
    targetMajorPalaceName: "Mệnh",
    frameRole: "focus",
    stackingGroup: "test-group",
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    factIds: ["star:0:Test"],
    sourceIds: ["SRC-TEST"],
    knowledgeStatus: "experimental",
    ...overrides,
  };
}

describe("aggregateMajorFortuneEvidence", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const profile = loaded.knowledge.scoringProfile;

  it("keeps only the highest-effective-weight candidate when the same physical fact reaches a scope via two frames", () => {
    const weaker = makeEvidence({ effectiveWeight: 0.3, frameRole: "trine" });
    const stronger = makeEvidence({ effectiveWeight: 0.7, frameRole: "opposite" });
    const diagnostics = emptyMajorFortuneDiagnostics();

    const result = aggregateMajorFortuneEvidence([weaker, stronger], profile, diagnostics);

    expect(result).toHaveLength(1);
    expect(result[0]?.frameRole).toBe("opposite");
    expect(diagnostics.duplicatePhysicalFacts.length).toBeGreaterThan(0);
  });

  it("applies inverse-square-root diminishing returns within the same scope+domain+layer+stackingGroup", () => {
    const a = makeEvidence({ physicalFactId: "star:0:A", factIds: ["star:0:A"], effectiveWeight: 1 });
    const b = makeEvidence({ physicalFactId: "star:0:B", factIds: ["star:0:B"], effectiveWeight: 1 });
    const c = makeEvidence({ physicalFactId: "star:0:C", factIds: ["star:0:C"], effectiveWeight: 1 });

    const result = aggregateMajorFortuneEvidence([a, b, c], profile);
    const byFactId = new Map(result.map((e) => [e.physicalFactId, e]));

    const baseWeight =
      1 *
      profile.frameRoleWeights.focus *
      profile.evidenceLayerWeights["major-frame-star"] *
      profile.confidenceWeights.experimental;

    expect(byFactId.get("star:0:A")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(1), 10);
    expect(byFactId.get("star:0:B")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(2), 10);
    expect(byFactId.get("star:0:C")?.effectiveWeight).toBeCloseTo(baseWeight / Math.sqrt(3), 10);
  });

  it("ranks separately per domain — overall and a domain scope never share a rank counter", () => {
    const overallEvidence = makeEvidence({
      physicalFactId: "star:0:A",
      factIds: ["star:0:A"],
      scope: "overall",
      domainId: null,
    });
    const domainEvidence = makeEvidence({
      physicalFactId: "star:0:A",
      factIds: ["star:0:A"],
      scope: "domain",
      domainId: "menh",
    });

    const result = aggregateMajorFortuneEvidence([overallEvidence, domainEvidence], profile);
    const baseWeight =
      1 *
      profile.frameRoleWeights.focus *
      profile.evidenceLayerWeights["major-frame-star"] *
      profile.confidenceWeights.experimental;

    for (const e of result) {
      expect(e.effectiveWeight).toBeCloseTo(baseWeight, 10);
    }
  });

  it("scales weightedAxes by the final effectiveWeight", () => {
    const a = makeEvidence({ rawAxes: { support: 2, pressure: 1, stability: 0.5, activation: 3 } });
    const result = aggregateMajorFortuneEvidence([a], profile);
    const e = result[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.weightedAxes.support).toBeCloseTo(2 * e.effectiveWeight, 10);
    expect(e.weightedAxes.pressure).toBeCloseTo(1 * e.effectiveWeight, 10);
    expect(e.weightedAxes.stability).toBeCloseTo(0.5 * e.effectiveWeight, 10);
    expect(e.weightedAxes.activation).toBeCloseTo(3 * e.effectiveWeight, 10);
  });
});
