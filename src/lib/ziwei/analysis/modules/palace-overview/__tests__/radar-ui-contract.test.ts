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

  it("production badge derives from V2 knowledge version metadata", () => {
    const src = readFileSync(RADAR, "utf8");
    expect(src).toMatch(/knowledgeVersion\.split/);
    expect(src).toMatch(/V\$\{.*\} EXP/);
    expect(src).toMatch(/RESEARCH CANDIDATE · UNCALIBRATED/);
    expect(src).not.toMatch(/V1\.2 FROZEN/);
    expect(src).not.toMatch(/applyStaticV13CandidateScore/);
  });

  it("defaults candidate research view to baseline outside DEV URL opt-in", () => {
    expect(readPalaceCandidateView()).toBe("baseline");
  });
});
