/**
 * Three-state equality report for CASE-PO-1998-DAN-MALE nam-phai.
 * historical0ac04ad / brokenMasterBefore235 / corrected235
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

const historical = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/palace-overview/__fixtures__/palace-overview.numeric-baseline.0ac04ad.CASE-PO-1998-DAN-MALE.nam-phai.json",
    ),
    "utf8",
  ),
);
const broken = JSON.parse(
  readFileSync(
    join(process.cwd(), "docs/research/palace-overview-freeze/_broken-master-1998.json"),
    "utf8",
  ),
) as Array<{
  palaceName: string;
  palaceIndex: number;
  score: number;
  band: string;
  intensity: number;
  rawAxes: Record<string, number>;
}>;

const { results } = analyzeAllPalaces(calculateNamPhai(input), { school: "nam-phai" });

const palaces = historical.palaces.map((hist: any) => {
  const br = broken.find((b) => b.palaceIndex === hist.palaceIndex)!;
  const corr = results.find((r) => r.palaceIndex === hist.palaceIndex)!;
  const restored =
    corr.score === hist.score &&
    JSON.stringify(corr.rawAxes) === JSON.stringify(hist.rawAxes);
  return {
    palaceName: hist.palaceName,
    palaceIndex: hist.palaceIndex,
    palaceBranch: hist.palaceBranch,
    historicalScore: hist.score,
    brokenScore: br.score,
    correctedScore: corr.score,
    restored: corr.score === hist.score,
    historicalRawAxes: hist.rawAxes,
    brokenRawAxes: br.rawAxes,
    correctedRawAxes: corr.rawAxes,
    rawAxesRestored: JSON.stringify(corr.rawAxes) === JSON.stringify(hist.rawAxes),
    fullyRestored: restored,
  };
});

const HISTORICAL_NUMERIC_EQUALITY = palaces.every((p: any) => p.fullyRestored)
  ? "PASS"
  : "FAIL";

const outDir = join(process.cwd(), "docs/research/palace-overview-freeze");
mkdirSync(outDir, { recursive: true });
const report = {
  baselineCommit: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  generatedByCommit: PALACE_OVERVIEW_NUMERIC_BASELINE_COMMIT,
  caseId: "CASE-PO-1998-DAN-MALE",
  school: "nam-phai",
  states: ["historical0ac04ad", "brokenMasterBefore235", "corrected235"],
  HISTORICAL_NUMERIC_EQUALITY,
  palaces,
};
writeFileSync(
  join(outDir, "CASE-PO-1998-DAN-MALE.nam-phai.equality.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(HISTORICAL_NUMERIC_EQUALITY);
