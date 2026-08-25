import { describe, expect, it } from "vitest";
import {
  loadPalaceOverviewResearchKnowledgeV2,
  resetPalaceOverviewResearchKnowledgeCache,
  validatePalaceOverviewResearchKnowledge,
} from "../palace-overview-research-v2";

describe("palace-overview research-v2 knowledge (detached from production freeze)", () => {
  it("loads and validates research catalogs", () => {
    resetPalaceOverviewResearchKnowledgeCache();
    const result = loadPalaceOverviewResearchKnowledgeV2();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.profile.id).toBe("palace-overview-v1");
    expect(result.knowledge.profile.version).toBe("2.0.0-experimental");
    expect(result.knowledge.majorStars.stars).toHaveLength(14);
    expect(result.knowledge.structuralRules.rules.length).toBeGreaterThanOrEqual(8);
    expect(result.knowledge.starSystems.roster.length).toBeGreaterThanOrEqual(14 + 92);
    expect(result.knowledge.starSystems.combinations.length).toBeGreaterThanOrEqual(8);
    expect(result.knowledge.formula.layers).toHaveLength(7);
    expect(result.knowledge.palaceBranchDignity.entries).toEqual([
      { palace: "Thiên Di", branch: "Sửu", label: "Đắc" },
    ]);
    expect(result.knowledge.gapMatrix.entries.length).toBeGreaterThanOrEqual(
      result.knowledge.starSystems.roster.length,
    );
    const validation = validatePalaceOverviewResearchKnowledge(result.knowledge);
    expect(validation.ok).toBe(true);
  });

  it("loads the V1.1 minor-star catalog (92 records, 18 families)", () => {
    resetPalaceOverviewResearchKnowledgeCache();
    const result = loadPalaceOverviewResearchKnowledgeV2();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.minorStars.stars).toHaveLength(92);
    expect(result.knowledge.minorFamilies.families).toHaveLength(18);

    const contextOnly = result.knowledge.minorStars.stars.filter(
      (s) => s.scoringMode === "context-only",
    );
    expect(contextOnly).toHaveLength(3);
    expect(contextOnly.map((s) => s.canonicalName).sort()).toEqual(
      ["Phàn An", "Tức Thần", "Đẩu Quân"].sort(),
    );

    const trungChauOnly = result.knowledge.minorStars.stars.filter(
      (s) =>
        s.schoolProfiles.length === 1 &&
        s.schoolProfiles[0] === "trung-chau-v1",
    );
    expect(trungChauOnly).toHaveLength(13);

    for (const family of result.knowledge.minorFamilies.families) {
      expect((family as unknown as Record<string, unknown>).starNames).toBeUndefined();
    }
  });

  it("rejects a duplicate minor-star record id", () => {
    resetPalaceOverviewResearchKnowledgeCache();
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const mutated = {
      ...loaded.knowledge,
      minorStars: {
        ...loaded.knowledge.minorStars,
        stars: loaded.knowledge.minorStars.stars.map((s, i) =>
          i === 1 ? { ...s, id: loaded.knowledge.minorStars.stars[0]!.id } : s,
        ),
      },
    };
    const validation = validatePalaceOverviewResearchKnowledge(mutated);
    expect(validation.ok).toBe(false);
    expect(
      validation.issues.some((i) => i.message.includes("duplicate minor-star record id")),
    ).toBe(true);
  });
});

describe("palace-overview production frozen knowledge", () => {
  it("loads frozen baseline profile without v2 packs", async () => {
    const {
      loadPalaceOverviewKnowledgeV1,
      resetPalaceOverviewKnowledgeCache,
    } = await import("../index");
    resetPalaceOverviewKnowledgeCache();
    const result = loadPalaceOverviewKnowledgeV1();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.profile.version).toBe("1.1.0-experimental");
    expect(result.knowledge.profile.qualityNormalization.method).toBe("logistic");
    expect(
      (result.knowledge as { starSystems?: unknown }).starSystems,
    ).toBeUndefined();
    expect(
      (result.knowledge as { transformationMatrix?: unknown }).transformationMatrix,
    ).toBeUndefined();
  });
});
