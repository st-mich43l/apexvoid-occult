/**
 * Production Nam Phái Palace Overview = Scoring Formula V2 (closed PR #211 tip 8161476).
 * Fixtures lock Formula V2 against the current Calculation Core (brightness SSOT may
 * differ from tip 8161476 on non-diagnostic palaces; Dần–Ngọ–Tuất cluster stays 78.9/74.3/71.2).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzePalaceOverviewDisplay } from "../analyze-display";
import { analyzeAllPalacesV2 } from "../v2/analyze";
import {
  PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
  PALACE_OVERVIEW_NUMERIC_STATUS,
} from "../numeric-baseline";
import type { BirthInput } from "@/types/chart";

const FIXTURE_DIR = join(
  process.cwd(),
  "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__",
);

const PR211 = "8161476a279e8a5877e72ecaed65cdcae3c4b879";

const CASES: Array<{ caseId: string; birth: BirthInput }> = [
  {
    caseId: "CASE-PO-1998-DAN-MALE",
    birth: {
      solarDate: "1998-10-01",
      birthHour: "Dần",
      gender: "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  },
  {
    caseId: "CASE-PO-1991-DAU-FEMALE",
    birth: {
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  },
];

interface CaseFixture {
  baselineCommit: string;
  generatedByCommit: string;
  palaces: Array<{
    palaceIndex: number;
    palaceName: string;
    palaceBranch: string;
    score: number;
    band: string;
    scoringV2: unknown;
  }>;
}

function loadFixture(caseId: string): CaseFixture {
  return JSON.parse(
    readFileSync(
      join(
        FIXTURE_DIR,
        `palace-overview.numeric-baseline.pr211.${caseId}.nam-phai.json`,
      ),
      "utf8",
    ),
  ) as CaseFixture;
}

describe("PR #211 Scoring Formula V2 numeric equality", () => {
  it("baseline identity is closed PR #211 tip", () => {
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe(
      "PO-SCORING-FORMULA-V2-PR211",
    );
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).toBe(PR211);
    expect(PALACE_OVERVIEW_NUMERIC_STATUS).toBe("RESTORED");
  });

  for (const c of CASES) {
    it(`PR211_PALACE_NUMERIC_EQUALITY = PASS — ${c.caseId}`, () => {
      const fixture = loadFixture(c.caseId);
      expect(fixture.baselineCommit).toBe(PR211);
      const chart = calculateNamPhai(c.birth);
      const { results, knowledgeValid } = analyzeAllPalacesV2(chart, {
        school: "nam-phai",
      });
      expect(knowledgeValid).toBe(true);
      const snap = results
        .slice()
        .sort((a, b) => a.palaceIndex - b.palaceIndex)
        .map((r) => ({
          palaceIndex: r.palaceIndex,
          palaceName: r.palaceName,
          palaceBranch: r.palaceBranch,
          score: r.score,
          band: r.band,
          scoringV2: r.scoringV2 ?? null,
        }));
      expect(snap).toEqual(fixture.palaces);

      const display = analyzePalaceOverviewDisplay(chart, { school: "nam-phai" });
      expect(display.results.map((r) => r.score)).toEqual(
        results.map((r) => r.score),
      );
    });
  }

  it("1998 Dần–Ngọ–Tuất stays below near-ceiling cluster", () => {
    const chart = calculateNamPhai(CASES[0]!.birth);
    const { results } = analyzeAllPalacesV2(chart, { school: "nam-phai" });
    const cluster = results.filter((r) =>
      ["Dần", "Ngọ", "Tuất"].includes(r.palaceBranch),
    );
    expect(cluster.map((r) => r.score).every((s) => s < 85)).toBe(true);
    expect(cluster.find((r) => r.palaceName === "Tật Ách")!.score).toBe(78.9);
    expect(cluster.find((r) => r.palaceName === "Huynh Đệ")!.score).toBe(74.3);
    expect(cluster.find((r) => r.palaceName === "Điền Trạch")!.score).toBe(71.2);
  });
});
