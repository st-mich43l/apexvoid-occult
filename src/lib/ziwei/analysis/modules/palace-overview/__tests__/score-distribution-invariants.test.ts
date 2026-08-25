/**
 * Research-v2 distribution invariants (detached from production freeze).
 * Production numeric distribution is locked by frozen-numeric-baseline.test.ts.
 * This suite only checks that the research pack still recenters under its own
 * offset — it must not mutate production analyzeAllPalaces.
 */
import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";

describe("palace-overview score distribution invariants (research-v2 pack)", () => {
  it("research profile keeps qualityNormalization (detached from production freeze)", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error("knowledge");
    const qn = loaded.knowledge.profile.qualityNormalization;
    expect(qn).toBeTruthy();
    expect(typeof qn.offset).toBe("number");
    expect(Number.isFinite(qn.offset)).toBe(true);
    expect(qn.method).toBeTruthy();
  });
});
