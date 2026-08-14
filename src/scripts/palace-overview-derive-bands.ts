/**
 * Derive Palace Overview band thresholds from score quantiles.
 * Writes score-distribution.v1.json only. Does not edit profile.json.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculate as calculateNamPhai } from "../lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "../lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewKnowledgeV1 } from "../lib/ziwei/analysis/knowledge";
import { analyzeAllPalaces } from "../lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces";
import type { BirthInput, School } from "../types/chart";

const HOURS = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

const DERIVE_BANDS_CORPUS = {
  id: "palace-overview-derive-bands-v1",
  chartsPerSchool: 500,
  schools: ["nam-phai", "trung-chau"] as School[],
  hours: [...HOURS],
  yearBase: 1950,
  yearMod: 80,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function buildCorpus(count: number): BirthInput[] {
  const inputs: BirthInput[] = [];
  for (let i = 0; i < count; i++) {
    const year = DERIVE_BANDS_CORPUS.yearBase + (i % DERIVE_BANDS_CORPUS.yearMod);
    const month = (i % 12) + 1;
    const day = 1 + (i % 28);
    inputs.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: HOURS[i % 12]!,
      gender: i % 2 === 0 ? "female" : "male",
      timezone: DERIVE_BANDS_CORPUS.timezone,
      annualYear: DERIVE_BANDS_CORPUS.annualYear,
      flowBase: DERIVE_BANDS_CORPUS.flowBase,
    });
  }
  return inputs;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

function deriveBandDistribution() {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("invalid palace-overview knowledge");
  const inputs = buildCorpus(DERIVE_BANDS_CORPUS.chartsPerSchool);
  const scores: number[] = [];
  const calc = { "nam-phai": calculateNamPhai, "trung-chau": calculateTrungChau };
  for (const school of DERIVE_BANDS_CORPUS.schools) {
    for (const input of inputs) {
      const { results } = analyzeAllPalaces(calc[school](input), { school });
      for (const r of results) scores.push(r.score);
    }
  }
  scores.sort((a, b) => a - b);
  const quantiles = {
    p10: percentile(scores, 0.1),
    p30: percentile(scores, 0.3),
    p50: percentile(scores, 0.5),
    p75: percentile(scores, 0.75),
    p90: percentile(scores, 0.9),
  };
  return {
    corpus: DERIVE_BANDS_CORPUS,
    n: scores.length,
    quantiles,
    suggestedBandThresholds: {
      lowMaxInclusive: quantiles.p10,
      guardedMaxExclusive: quantiles.p30,
      balancedMaxExclusive: quantiles.p50,
      supportiveMaxExclusive: quantiles.p75,
    },
    profileVersion: loaded.knowledge.profile.version,
    knowledgeVersion: loaded.knowledge.profile.version,
    timestamp: new Date().toISOString(),
  };
}

const outPath = join(
  process.cwd(),
  "src/lib/ziwei/analysis/knowledge/palace-overview/v1/score-distribution.v1.json",
);
const data = deriveBandDistribution();
writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);
process.stdout.write(`wrote ${outPath}\n${JSON.stringify(data.quantiles, null, 2)}\n`);
process.stdout.write("Copy suggestedBandThresholds into profile.json after review.\n");
