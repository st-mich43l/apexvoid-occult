import { describe, expect, it } from "vitest";
import {
  loadPalaceOverviewKnowledgeV1,
  resetPalaceOverviewKnowledgeCache,
  validatePalaceOverviewKnowledge,
} from "../index";

describe("palace-overview knowledge v1", () => {
  it("loads and validates experimental catalogs", () => {
    resetPalaceOverviewKnowledgeCache();
    const result = loadPalaceOverviewKnowledgeV1();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.profile.id).toBe("palace-overview-v1");
    expect(result.knowledge.majorStars.stars).toHaveLength(14);
    expect(result.knowledge.structuralRules.rules).toHaveLength(3);
    const validation = validatePalaceOverviewKnowledge(result.knowledge);
    expect(validation.ok).toBe(true);
  });
});
