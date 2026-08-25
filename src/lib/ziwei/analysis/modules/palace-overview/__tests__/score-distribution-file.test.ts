import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";

describe("palace-overview derived band distribution", () => {
  it("score-distribution.v1.json exists and matches current profile version", () => {
    const path = join(
      process.cwd(),
      "src/lib/ziwei/analysis/knowledge/palace-overview/v1/score-distribution.v1.json",
    );
    const dist = JSON.parse(readFileSync(path, "utf8")) as {
      profileVersion: string;
      n: number;
      suggestedBandThresholds: Record<string, number>;
    };
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(dist.profileVersion).toBe(loaded.knowledge.profile.version);
    expect(dist.n).toBeGreaterThanOrEqual(1000);
    const bands = loaded.knowledge.profile.bandThresholds;
    const suggested = dist.suggestedBandThresholds as {
      lowMaxInclusive: number;
      guardedMaxExclusive: number;
      balancedMaxExclusive: number;
      supportiveMaxExclusive: number;
    };
    expect(suggested.lowMaxInclusive).toBeDefined();
    expect(Math.abs(bands.lowMaxInclusive - suggested.lowMaxInclusive)).toBeLessThanOrEqual(2);
    expect(Math.abs(bands.guardedMaxExclusive - suggested.guardedMaxExclusive)).toBeLessThanOrEqual(2);
    expect(Math.abs(bands.balancedMaxExclusive - suggested.balancedMaxExclusive)).toBeLessThanOrEqual(2);
    expect(Math.abs(bands.supportiveMaxExclusive - suggested.supportiveMaxExclusive)).toBeLessThanOrEqual(2);
  });
});
