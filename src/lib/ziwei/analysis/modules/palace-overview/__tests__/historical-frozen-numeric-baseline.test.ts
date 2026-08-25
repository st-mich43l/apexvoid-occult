/**
 * Hard freeze: production Palace Overview numeric output must equal the
 * historical 0ac04ad runtime output (fixtures generated inside that worktree).
 */
import { readFileSync, readdirSync } from "node:fs";
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

const HISTORICAL_COMMIT = "0ac04ad0875dd3de5b03036d8a673fa6b00b8a08";

interface PalaceSnap {
  palaceName: string;
  palaceIndex: number;
  palaceBranch: string;
  score: number;
  band: string;
  intensity: number;
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
}

interface CaseFixture {
  generatedByCommit: string;
  baselineCommit: string;
  caseId: string;
  school: School;
  palaces: PalaceSnap[];
}

interface CorpusFixture {
  generatedByCommit: string;
  baselineCommit: string;
  chartCount: number;
  rows: Array<{
    solarDate: string;
    birthHour: string;
    gender: string;
    school: School;
    projection: Array<
      [string, string, number, number, number, number, number, number, string]
    >;
  }>;
}

const CASES: Array<{ caseId: string; input: BirthInput }> = [
  {
    caseId: "CASE-PO-1998-DAN-MALE",
    input: {
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
    input: {
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    },
  },
];

function calcFor(school: School) {
  return school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
}

function projectCurrent(school: School, input: BirthInput): PalaceSnap[] {
  const { results } = analyzeAllPalaces(calcFor(school)(input), { school });
  return results
    .map((r) => ({
      palaceName: r.palaceName,
      palaceIndex: r.palaceIndex,
      palaceBranch: r.palaceBranch,
      score: r.score,
      band: r.band,
      intensity: r.intensity,
      rawAxes: { ...r.rawAxes },
      axes: { ...r.axes },
    }))
    .sort((a, b) => a.palaceIndex - b.palaceIndex || a.palaceName.localeCompare(b.palaceName));
}

describe("historical frozen numeric baseline (0ac04ad runtime)", () => {
  it("production version identity is V1.2 frozen", () => {
    expect(PALACE_OVERVIEW_NUMERIC_STATUS).toBe("FROZEN");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_ID).toBe("PO-FROZEN-0ac04ad");
    expect(PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT).toBe(HISTORICAL_COMMIT);
    const v = getPalaceOverviewVersions();
    expect(v.knowledgeVersion).toBe("1.2.0-experimental");
    expect(v.scoringKnowledgeVersion).toBe("1.2.0-experimental");
    expect(v.semanticKnowledgeVersion).toBe("1.2.0-experimental");
    expect(v.scoringInfrastructureVersion).toBe("1.0.0");
  });

  it("production analyzeAllPalaces reports V1.2 knowledgeVersion", () => {
    const { results } = analyzeAllPalaces(calculateNamPhai(CASES[0]!.input), {
      school: "nam-phai",
    });
    expect(results[0]!.versions.knowledgeVersion).toBe("1.2.0-experimental");
    expect(results[0]!.versions.scoringKnowledgeVersion).toBe(
      "1.2.0-experimental",
    );
  });

  for (const c of CASES) {
    for (const school of ["nam-phai", "trung-chau"] as const) {
      it(`HISTORICAL_NUMERIC_EQUALITY ${c.caseId} ${school}`, () => {
        const path = join(
          FIXTURE_DIR,
          `palace-overview.numeric-baseline.0ac04ad.${c.caseId}.${school}.json`,
        );
        const expected = JSON.parse(readFileSync(path, "utf8")) as CaseFixture;
        expect(expected.generatedByCommit).toBe(HISTORICAL_COMMIT);
        expect(expected.baselineCommit).toBe(HISTORICAL_COMMIT);
        expect(expected).not.toHaveProperty("chartGeneration");
        const actual = projectCurrent(school, c.input);
        expect(actual).toEqual(expected.palaces);
      });
    }
  }

  it("HISTORICAL_CORPUS_EQUALITY (12 charts × 2 schools)", () => {
    const path = join(
      FIXTURE_DIR,
      "palace-overview.numeric-baseline.0ac04ad.corpus-12.json",
    );
    const expected = JSON.parse(readFileSync(path, "utf8")) as CorpusFixture;
    expect(expected.generatedByCommit).toBe(HISTORICAL_COMMIT);
    expect(expected.rows.length).toBe(24);

    for (const row of expected.rows) {
      const input: BirthInput = {
        solarDate: row.solarDate,
        birthHour: row.birthHour as BirthInput["birthHour"],
        gender: row.gender as BirthInput["gender"],
        timezone: "7",
        annualYear: "2026",
        flowBase: "luu-nien",
      };
      const { results } = analyzeAllPalaces(calcFor(row.school)(input), {
        school: row.school,
      });
      const projection = results
        .slice()
        .sort((a, b) => a.palaceIndex - b.palaceIndex)
        .map(
          (r) =>
            [
              r.palaceName,
              r.palaceBranch,
              r.score,
              r.rawAxes.support,
              r.rawAxes.pressure,
              r.rawAxes.stability,
              r.rawAxes.activation,
              r.intensity,
              r.band,
            ] as [string, string, number, number, number, number, number, number, string],
        );
      expect(projection).toEqual(row.projection);
    }
  });

  it("fixture directory only contains 0ac04ad baseline artifacts", () => {
    const names = readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".json"));
    expect(names.length).toBeGreaterThanOrEqual(5);
    for (const n of names) {
      expect(n).toContain("0ac04ad");
    }
  });
});

describe("semantic isolation from Palace Overview numeric", () => {
  it("SEMANTIC_SCORE_IMPACT = NONE (romance-semantic must not import PO scoring)", () => {
    const romanceDir = join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/annual-axes/v0.10-layered/romance-semantic",
    );
    const files = readdirSync(romanceDir).filter((n) => n.endsWith(".ts"));
    for (const f of files) {
      const text = readFileSync(join(romanceDir, f), "utf8");
      expect(text).not.toMatch(/palace-overview\/(analyze|collect-evidence|normalize-result)/);
      expect(text).not.toMatch(/scoreImpactAllowed:\s*true/);
    }
  });
});
