/**
 * Incident before/after for CASE 1998-10-01 Dần male (nam-phai).
 * Corrected branch must equal frozen baseline fixtures.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces";
import { PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT } from "@/lib/ziwei/analysis/modules/palace-overview/numeric-baseline";

const input = {
  solarDate: "1998-10-01",
  birthHour: "Dần" as const,
  gender: "male" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

const fixture = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__/palace-overview.numeric-baseline.0ac04ad.CASE-PO-1998-DAN-MALE.nam-phai.json",
    ),
    "utf8",
  ),
);

const { results } = analyzeAllPalaces(calculateNamPhai(input), { school: "nam-phai" });
const rows = fixture.palaces.map((exp: any) => {
  const got = results.find((r) => r.palaceIndex === exp.palaceIndex)!;
  return {
    palaceName: exp.palaceName,
    frozenScore: exp.score,
    correctedScore: got.score,
    equalScore: got.score === exp.score,
    frozenRawAxes: exp.rawAxes,
    correctedRawAxes: got.rawAxes,
    equalRawAxes: JSON.stringify(got.rawAxes) === JSON.stringify(exp.rawAxes),
  };
});

const outDir = join(process.cwd(), "docs/research/palace-overview-freeze");
mkdirSync(outDir, { recursive: true });
const report = {
  baselineCommit: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  caseId: "CASE-PO-1998-DAN-MALE",
  school: "nam-phai",
  note: "current-master-before-fix scores are historical incident context; corrected must equal frozen fixtures derived under current Calculation Core + restored scoring modules.",
  FROZEN_NUMERIC_EQUALITY: rows.every((r: any) => r.equalScore && r.equalRawAxes) ? "PASS" : "FAIL",
  palaces: rows,
};
writeFileSync(
  join(outDir, "CASE-PO-1998-DAN-MALE.nam-phai.equality.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report.FROZEN_NUMERIC_EQUALITY, rows.filter((r: any) => !r.equalScore).length);
