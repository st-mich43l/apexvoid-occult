import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import { computeRadarScore } from "../../../research/normalize-v2";
import { computeFourAxisCandidateScore, loadFourAxisCandidatePack } from "../score";

describe("four-axis score candidate", () => {
  it("is disabled by default and stays off production linear-net", () => {
    const pack = loadFourAxisCandidatePack();
    expect(pack.enabledByDefault).toBe(false);
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const raw = { support: 10, pressure: 4, stability: 8, activation: 3 };
    expect(computeRadarScore(raw, loaded.knowledge)).not.toBe(
      computeFourAxisCandidateScore(raw, loaded.knowledge),
    );
    expect(computeRadarScore(raw, loaded.knowledge)).not.toBe(
      computeFourAxisCandidateScore(raw, loaded.knowledge, 0),
    );
  });

  it("positive stability raises candidate score versus production", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    if (!loaded.ok) throw new Error("knowledge");
    const raw = { support: 8, pressure: 8, stability: 6, activation: 0 };
    expect(computeFourAxisCandidateScore(raw, loaded.knowledge)).toBeGreaterThan(
      computeRadarScore(raw, loaded.knowledge),
    );
  });
});
