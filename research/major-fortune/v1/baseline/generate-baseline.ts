import fs from "fs";
import path from "path";
import crypto from "crypto";
import { analyzeMajorFortune } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/production";
import { buildChartCorpusRound2 } from "../../../../src/lib/ziwei/analysis/research/annual-axes-v09-round-2/collect-corpus";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "v03-baseline-snapshot.json");

function hash(obj: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

async function main() {
  const charts = buildChartCorpusRound2({
    contractId: "v1-baseline",
    seed: 42,
    chartCount: 200,
    yearsPerChart: 1,
    baseAnnualYear: 2026,
    timezone: "Asia/Ho_Chi_Minh",
    flowBase: "gregorian",
    notes: []
  });

  if (charts.length === 0) {
    console.error("No fixtures found.");
    return;
  }

  const baselineCases: any[] = [];

  for (const item of charts) {
    const chart = item.chart;
    if (!chart) continue;
    
    for (const school of ["nam-phai", "trung-chau"] as const) {
      for (const palace of chart.palaces) {
        const cycle = palace.majorFortune;
        if (!cycle || cycle.order === undefined || cycle.start === undefined || cycle.end === undefined) continue;

        const result = analyzeMajorFortune(chart, {
          school,
          cycleOverride: {
            cycleIndex: cycle.order,
            startAge: cycle.start,
            endAge: cycle.end,
            activePalaceIndex: palace.index
          }
        });

        baselineCases.push({
          inputHash: hash({ chartId: item.chartId, school, cycleIndex: cycle.order }),
          chartId: item.chartId,
          school,
          cycleIndex: cycle.order,
          activePalaceIndex: palace.index,
          score: result.result?.score ?? null,
          pillarScores: result.result?.pillarScores ?? null,
          coverage: result.display?.scoringCoveragePercent ?? null,
          band: result.display?.bandLabelVi ?? null,
          admittedEvidenceIds: result.admittedEvidence?.map((e: any) => e.evidenceId) ?? [],
          rejectedEvidence: result.rejectedEvidence ?? [],
          diagnostics: result.diagnostics ?? null,
        });
      }
    }
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    generatorVersion: "v0.3-via-production",
    cases: baselineCases,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`Generated ${baselineCases.length} baseline cases at ${OUTPUT_PATH}`);
}

main().catch(console.error);
