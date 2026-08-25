/**
 * Extract Palace Overview numeric freeze fixtures using:
 * - scoring modules restored from 0ac04ad
 * - current Calculation Core chart generation (kept per restore scope)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces";
import { PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT } from "@/lib/ziwei/analysis/modules/palace-overview/numeric-baseline";
import type { BirthInput } from "@/types/chart";

const OUT = join(
  process.cwd(),
  "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__",
);

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

const HOURS = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"] as const;

function project(r: {
  palaceName: string;
  palaceIndex: number;
  score: number;
  band: string;
  intensity: number;
  rawAxes: { support: number; pressure: number; stability: number; activation: number };
  axes: { support: number; pressure: number; stability: number; activation: number };
}) {
  return {
    palaceName: r.palaceName,
    palaceIndex: r.palaceIndex,
    score: r.score,
    band: r.band,
    intensity: r.intensity,
    rawAxes: { ...r.rawAxes },
    axes: { ...r.axes },
  };
}

mkdirSync(OUT, { recursive: true });
for (const c of CASES) {
  for (const school of ["nam-phai", "trung-chau"] as const) {
    const calc = school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
    const { results } = analyzeAllPalaces(calc(c.input), { school });
    const snap = {
      baselineCommit: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
      scoringModulesBaseline: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
      chartGeneration: "current-calculation-core",
      caseId: c.caseId,
      school,
      palaces: results
        .map(project)
        .sort((a, b) => a.palaceIndex - b.palaceIndex || a.palaceName.localeCompare(b.palaceName)),
    };
    const file = join(
      OUT,
      `palace-overview.numeric-baseline.0ac04ad.${c.caseId}.${school}.json`,
    );
    writeFileSync(file, JSON.stringify(snap, null, 2) + "\n");
    console.log("wrote", file);
  }
}

const rows = [];
for (let i = 0; i < 12; i++) {
  const year = 1960 + (i % 40);
  const month = (i % 12) + 1;
  const day = 1 + (i % 27);
  const input: BirthInput = {
    solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    birthHour: HOURS[i % 12]!,
    gender: i % 2 === 0 ? "female" : "male",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  };
  for (const school of ["nam-phai", "trung-chau"] as const) {
    const calc = school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
    const { results } = analyzeAllPalaces(calc(input), { school });
    rows.push({
      solarDate: input.solarDate,
      birthHour: input.birthHour,
      gender: input.gender,
      school,
      projection: results
        .slice()
        .sort((a, b) => a.palaceIndex - b.palaceIndex)
        .map(
          (r) =>
            [
              r.palaceName,
              r.score,
              r.rawAxes.support,
              r.rawAxes.pressure,
              r.rawAxes.stability,
              r.rawAxes.activation,
              r.intensity,
              r.band,
            ] as [string, number, number, number, number, number, number, string],
        ),
    });
  }
}
writeFileSync(
  join(OUT, "palace-overview.numeric-baseline.0ac04ad.corpus-12.json"),
  JSON.stringify(
    {
      baselineCommit: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
      scoringModulesBaseline: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
      chartGeneration: "current-calculation-core",
      chartCount: 12,
      schools: ["nam-phai", "trung-chau"],
      rows,
    },
    null,
    2,
  ) + "\n",
);
console.log("corpus rows", rows.length);
