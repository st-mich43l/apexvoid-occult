/**
 * Production Palace Overview must equal the f51ff20c pre–Annual Axes V2 runtime.
 * Fixtures were generated inside worktree /tmp/apexvoid-po-f51 at that commit.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { getPalaceOverviewVersions } from "@/lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import {
  PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  PALACE_OVERVIEW_NUMERIC_BASELINE_ID,
  PALACE_OVERVIEW_NUMERIC_STATUS,
} from "../numeric-baseline";
import type { BirthInput, School } from "@/types/chart";

const FIXTURE_DIR = join(
  process.cwd(),
  "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__",
);

const F51 = "f51ff20c40f9354cd7872ae259bb5e7485d1f3a2";

interface PalaceSnap {
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  score: number;
  structureNet: number | null;
  rawAxes: {
    support: number;
    pressure: number;
    stability: number;
    activation: number;
  };
  axes: {
    support: number;
    pressure: number;
    stability: number;
    activation: number;
  };
  intensity: number;
  band: string;
  topSupportDriverIds: string[];
  topPressureDriverIds: string[];
}

interface CaseFixture {
  generatedByCommit: string;
  baselineCommit: string;
  caseId: string;
  school: School;
  palaces: PalaceSnap[];
}

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

function loadFixture(caseId: string, school: School): CaseFixture {
  const path = join(
    FIXTURE_DIR,
    `palace-overview.numeric-baseline.f51.${caseId}.${school}.json`,
  );
  return JSON.parse(readFileSync(path, "utf8")) as CaseFixture;
}

function currentSnap(
  results: ReturnType<typeof analyzeAllPalaces>["results"],
): PalaceSnap[] {
  return results
    .slice()
    .sort((a, b) => a.palaceIndex - b.palaceIndex)
    .map((r) => ({
      palaceIndex: r.palaceIndex,
      palaceName: r.palaceName,
      palaceBranch: r.palaceBranch,
      score: r.score,
      structureNet: r.structureNet ?? null,
      rawAxes: r.rawAxes,
      axes: r.axes,
      intensity: r.intensity,
      band: r.band,
      topSupportDriverIds: r.topSupportDrivers.map((d) => d.id),
      topPressureDriverIds: r.topPressureDrivers.map((d) => d.id),
    }));
}

describe("F51 Palace Overview numeric equality", () => {
  it("baseline identity is pre–Annual Axes f51ff20c", () => {
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe("PO-F51-PRE-ANNUAL-AXES");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).toBe(F51);
    expect(PALACE_OVERVIEW_NUMERIC_STATUS).toBe("RESTORED");
    const v = getPalaceOverviewVersions();
    expect(v.knowledgeVersion).toBe("2.0.0-experimental");
    expect(v.scoringKnowledgeVersion).toBe("2.0.0-experimental");
  });

  for (const c of CASES) {
    for (const school of ["nam-phai", "trung-chau"] as const) {
      it(`F51_PALACE_NUMERIC_EQUALITY = PASS — ${c.caseId} / ${school}`, () => {
        const fixture = loadFixture(c.caseId, school);
        expect(fixture.baselineCommit).toBe(F51);
        expect(fixture.generatedByCommit).toBe(F51);

        const chart =
          school === "nam-phai"
            ? calculateNamPhai(c.birth)
            : calculateTrungChau(c.birth);
        const { results, knowledgeValid } = analyzeAllPalaces(chart, { school });
        expect(knowledgeValid).toBe(true);
        expect(currentSnap(results)).toEqual(fixture.palaces);
      });
    }
  }
});
