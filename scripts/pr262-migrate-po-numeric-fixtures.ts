/**
 * PR #262 — migrate Palace Overview numeric fixtures for Trung Châu only.
 * Formulas/weights unchanged (PHYSICAL_FACT_CORRECTION_PROPAGATION).
 * Nam Phái fixtures left byte-stable.
 *
 * Run: npx tsx --tsconfig tsconfig.app.json scripts/pr262-migrate-po-numeric-fixtures.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateTrungChau } from "../src/lib/ziwei/engine-trung-chau";
import { analyzeAllPalaces } from "../src/lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces";
import type { BirthInput } from "../src/types/chart";

const FIXTURE_DIR = join(
  process.cwd(),
  "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__",
);

const HISTORICAL_COMMIT = "0ac04ad0875dd3de5b03036d8a673fa6b00b8a08";
const MIGRATION = {
  physicalFactMigrationPr: 262,
  classification: "PHYSICAL_FACT_CORRECTION_PROPAGATION",
  notes:
    "Trung Châu Mậu/Nhâm Khoa correction (APPROVE_MAU_AND_NHAM). Palace Overview formulas/weights unchanged.",
};

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

function project(input: BirthInput) {
  const { results } = analyzeAllPalaces(calculateTrungChau(input), {
    school: "trung-chau",
  });
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

for (const c of CASES) {
  const path = join(
    FIXTURE_DIR,
    `palace-overview.numeric-baseline.0ac04ad.${c.caseId}.trung-chau.json`,
  );
  const prev = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const next = {
    ...prev,
    generatedByCommit: HISTORICAL_COMMIT,
    baselineCommit: HISTORICAL_COMMIT,
    ...MIGRATION,
    palaces: project(c.input),
  };
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
  console.log("updated", path);
}

const corpusPath = join(
  FIXTURE_DIR,
  "palace-overview.numeric-baseline.0ac04ad.corpus-12.json",
);
const corpus = JSON.parse(readFileSync(corpusPath, "utf8")) as {
  generatedByCommit: string;
  baselineCommit: string;
  chartCount: number;
  rows: Array<{
    solarDate: string;
    birthHour: string;
    gender: string;
    school: string;
    projection: unknown;
  }>;
};

let tcRows = 0;
for (const row of corpus.rows) {
  if (row.school !== "trung-chau") continue;
  tcRows++;
  const input: BirthInput = {
    solarDate: row.solarDate,
    birthHour: row.birthHour as BirthInput["birthHour"],
    gender: row.gender as BirthInput["gender"],
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  };
  const { results } = analyzeAllPalaces(calculateTrungChau(input), {
    school: "trung-chau",
  });
  row.projection = results
    .slice()
    .sort((a, b) => a.palaceIndex - b.palaceIndex)
    .map((r) => [
      r.palaceName,
      r.palaceBranch,
      r.score,
      r.rawAxes.support,
      r.rawAxes.pressure,
      r.rawAxes.stability,
      r.rawAxes.activation,
      r.intensity,
      r.band,
    ]);
}

const corpusOut = {
  ...corpus,
  ...MIGRATION,
};
writeFileSync(corpusPath, JSON.stringify(corpusOut, null, 2) + "\n");
console.log("updated", corpusPath, "tcRows", tcRows);
