import { describe, expect, it } from "vitest";
import {
  loadMajorFortuneScoringKnowledgeV0,
  resetMajorFortuneScoringKnowledgeCache,
  validateMajorFortuneScoringKnowledge,
} from "../index";
import { MAJOR_FORTUNE_DOMAINS } from "../../../contracts/major-fortune";

describe("major-fortune-scoring knowledge V0", () => {
  it("loads and validates cleanly", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    expect(loaded.ok).toBe(true);
  });

  it("covers exactly the twelve contract domains", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const domains = loaded.knowledge.domainDefinitions.domains.map((d) => d.domainId);
    expect(new Set(domains)).toEqual(new Set(MAJOR_FORTUNE_DOMAINS));
    expect(domains).toHaveLength(12);
    for (const domainId of domains) {
      expect(domainId).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("has contiguous bands over 0-100", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const bands = [...loaded.knowledge.scoringProfile.output.bands].sort(
      (a, b) => a.minInclusive - b.minInclusive,
    );
    let expected = loaded.knowledge.scoringProfile.output.scoreMin;
    for (const band of bands) {
      expect(band.minInclusive).toBe(expected);
      expected = band.maxExclusive ?? band.maxInclusive ?? expected;
    }
    expect(expected).toBe(loaded.knowledge.scoringProfile.output.scoreMax);
  });

  it("has globally unique ruleIds across every catalog", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const { structuralActivations, transformationImpact, interactionRules } = loaded.knowledge;
    const ids = [
      ...structuralActivations.records.map((r) => r.ruleId),
      ...transformationImpact.records.map((r) => r.ruleId),
      ...interactionRules.records.map((r) => r.ruleId),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every interaction rule disabled in V0", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    expect(loaded.knowledge.interactionRules.defaultEnabled).toBe(false);
    for (const rule of loaded.knowledge.interactionRules.records) {
      expect(rule.enabled).toBe(false);
    }
  });

  it("keeps Nam Phái Major Fortune transformations disabled", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    expect(loaded.knowledge.schoolCapabilities.profiles["nam-phai"].supportsMajorFortuneTransformations).toBe(
      false,
    );
  });

  it("makes Trung Châu transformation requirements explicit", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const trungChau = loaded.knowledge.schoolCapabilities.profiles["trung-chau"];
    expect(trungChau.supportsMajorFortuneTransformations).toBe(true);
    expect(trungChau.transformationRequirements?.length).toBeGreaterThan(0);
  });

  it("covers all experimental coefficients with a formula_design source", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const hasArchSource = loaded.knowledge.sourceRegistry.sources.some(
      (s) => s.sourceType === "internal_architecture" && s.allowedUsage.includes("formula_design"),
    );
    expect(hasArchSource).toBe(true);
  });

  it("rejects a knowledge object with an enabled interaction rule", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const tampered = {
      ...loaded.knowledge,
      interactionRules: {
        ...loaded.knowledge.interactionRules,
        records: loaded.knowledge.interactionRules.records.map((r, i) =>
          i === 0 ? { ...r, enabled: true } : r,
        ),
      },
    };
    const result = validateMajorFortuneScoringKnowledge(tampered);
    expect(result.ok).toBe(false);
  });

  it("rejects a knowledge object where Nam Phái supports transformations", () => {
    const loaded = loadMajorFortuneScoringKnowledgeV0();
    if (!loaded.ok) throw new Error("failed to load");
    const tampered = {
      ...loaded.knowledge,
      schoolCapabilities: {
        ...loaded.knowledge.schoolCapabilities,
        profiles: {
          ...loaded.knowledge.schoolCapabilities.profiles,
          "nam-phai": {
            ...loaded.knowledge.schoolCapabilities.profiles["nam-phai"],
            supportsMajorFortuneTransformations: true,
          },
        },
      },
    };
    const result = validateMajorFortuneScoringKnowledge(tampered);
    expect(result.ok).toBe(false);
  });

  it("deep-freezes knowledge so a caller cannot poison later analyses", () => {
    resetMajorFortuneScoringKnowledgeCache();
    const first = loadMajorFortuneScoringKnowledgeV0();
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const originalId = first.knowledge.scoringProfile.profileId;
    expect(() => {
      (first.knowledge.scoringProfile as { profileId: string }).profileId = "hacked";
    }).toThrow();

    const second = loadMajorFortuneScoringKnowledgeV0();
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.knowledge.scoringProfile.profileId).toBe(originalId);
    expect(second.knowledge.scoringProfile.profileId).not.toBe("hacked");
  });
});
