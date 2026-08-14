import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../../analyze-all-palaces";
import { buildMatrixInputs } from "../../calibration/distribution";
import { computeFourAxisCandidateScore } from "./score";
import type { ZiweiSchool } from "../../../../facts";

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function compareFourAxisCandidate(chartCount = 80) {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("invalid knowledge");
  const knowledge = loaded.knowledge;
  const inputs = buildMatrixInputs(chartCount);
  const schools: ZiweiSchool[] = ["nam-phai", "trung-chau"];
  const calc = { "nam-phai": calculateNamPhai, "trung-chau": calculateTrungChau };
  const buckets = {
    void: { prod: [] as number[], cand: [] as number[], abs: [] as number[] },
    natal: { prod: [] as number[], cand: [] as number[], abs: [] as number[] },
  };
  for (const school of schools) {
    for (const input of inputs) {
      const { results } = analyzeAllPalaces(calc[school](input), { school, knowledge });
      for (const r of results) {
        const cand = computeFourAxisCandidateScore(r.rawAxes, knowledge);
        const key = r.isVoidMajor ? "void" : "natal";
        buckets[key].prod.push(r.score);
        buckets[key].cand.push(cand);
        buckets[key].abs.push(Math.abs(cand - r.score));
      }
    }
  }
  const summarize = (label: string, b: (typeof buckets)["void"]) => ({
    label,
    n: b.prod.length,
    meanProduction: mean(b.prod),
    meanCandidate: mean(b.cand),
    meanAbsDelta: mean(b.abs),
    maxAbsDelta: b.abs.length ? Math.max(...b.abs) : 0,
  });
  return {
    decision: "RESEARCH_ONLY",
    calibration: "NO_GO",
    productionUnchanged: true,
    voidMajor: summarize("isVoidMajor=true", buckets.void),
    notVoidMajor: summarize("isVoidMajor=false", buckets.natal),
  };
}

export function writeFourAxisComparisonArtifact(): string {
  const dir = join(process.cwd(), ".research-artifacts/palace-overview-four-axis");
  mkdirSync(dir, { recursive: true });
  const data = compareFourAxisCandidate();
  writeFileSync(join(dir, "comparison.json"), `${JSON.stringify(data, null, 2)}\n`);
  const md = [
    "# Four-axis score candidate (research only)",
    "",
    `Void palaces: n=${data.voidMajor.n} mean|Δ|=${data.voidMajor.meanAbsDelta.toFixed(3)} (prod ${data.voidMajor.meanProduction.toFixed(1)} → cand ${data.voidMajor.meanCandidate.toFixed(1)})`,
    `Non-void palaces: n=${data.notVoidMajor.n} mean|Δ|=${data.notVoidMajor.meanAbsDelta.toFixed(3)} (prod ${data.notVoidMajor.meanProduction.toFixed(1)} → cand ${data.notVoidMajor.meanCandidate.toFixed(1)})`,
    "",
    "UNCALIBRATED. Production score unchanged. NO_GO.",
    "",
  ].join("\n");
  writeFileSync(join(dir, "comparison.md"), md);
  return dir;
}
