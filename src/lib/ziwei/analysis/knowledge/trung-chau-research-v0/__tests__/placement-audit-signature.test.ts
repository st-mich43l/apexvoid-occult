import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sourceTables from "../trung-chau-source-placement-tables.v0.2.json";

interface GoldenPalace {
  branch: string;
  stars: Array<{ name: string; source?: string }>;
}

interface GoldenOutput {
  month: number;
  palaces: GoldenPalace[];
}

function starBranch(output: GoldenOutput, name: string): string | undefined {
  for (const palace of output.palaces) {
    const hit = palace.stars.find((s) => s.name === name && s.source === "natal");
    if (hit) return palace.branch;
  }
  return undefined;
}

describe("trung-chau-research-v0 signature star month tables", () => {
  const golden = JSON.parse(
    readFileSync(resolve(process.cwd(), "tests/golden/tuvi-trung-chau.json"), "utf8"),
  ) as { cases: Array<{ output: GoldenOutput }> };

  const vu = sourceTables.thiênVu as Record<string, string>;
  const nguyet = sourceTables.thiênNguyệt as Record<string, string>;
  const amSat = sourceTables.âmSát as Record<string, string>;
  const nguyetGiai = sourceTables.nguyệtGiải as Record<string, string>;

  it("golden runtime output matches committed source tables for all inspected months", () => {
    const seenMonths = new Set<number>();
    for (const c of golden.cases) {
      const month = c.output.month;
      if (seenMonths.has(month)) continue;
      seenMonths.add(month);
      const key = String(month);
      expect(starBranch(c.output, "Thiên Vu")).toBe(vu[key]);
      expect(starBranch(c.output, "Thiên Nguyệt")).toBe(nguyet[key]);
      expect(starBranch(c.output, "Âm Sát")).toBe(amSat[key]);
      expect(starBranch(c.output, "Nguyệt Giải")).toBe(nguyetGiai[key]);
    }
    expect(seenMonths.size).toBeGreaterThan(0);
  });

  for (let month = 1; month <= 12; month += 1) {
    it(`source table defines all four signature stars for lunar month ${month}`, () => {
      const key = String(month);
      expect(vu[key]).toBeTruthy();
      expect(nguyet[key]).toBeTruthy();
      expect(amSat[key]).toBeTruthy();
      expect(nguyetGiai[key]).toBeTruthy();
    });
  }
});
