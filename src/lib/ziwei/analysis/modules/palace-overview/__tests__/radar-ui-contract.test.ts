/**
 * Radar UI contract: production plot must be score/100 with no React rescoring.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readPalaceCandidateView } from "../candidate/v2/research-view";

const RADAR = join(
  process.cwd(),
  "src/components/ziwei/analysis/PalaceOverviewRadar.tsx",
);

describe("Palace Overview radar UI contract", () => {
  it("maps radius from production score / 100 (no min-max rescale)", () => {
    const src = readFileSync(RADAR, "utf8");
    expect(src).toMatch(/result\.score\s*\/\s*100/);
    expect(src).toMatch(/Math\.max\(0,\s*Math\.min\(100,\s*score\)\)\s*\/\s*100/);
    expect(src).not.toMatch(/Math\.min\(\.\.\.scores\)/);
    expect(src).not.toMatch(/Math\.max\(\.\.\.scores\)/);
  });

  it("hides all engine/version badges on the radar header", () => {
    const src = readFileSync(RADAR, "utf8");
    expect(src).not.toMatch(/V1\.2 FROZEN/);
    expect(src).not.toMatch(/RESEARCH CANDIDATE/);
    expect(src).not.toMatch(/badgeLabel/);
    expect(src).not.toMatch(/palace-overview-radar__badge/);
  });

  it("defaults candidate research view to baseline outside DEV URL opt-in", () => {
    expect(readPalaceCandidateView()).toBe("baseline");
  });
});
