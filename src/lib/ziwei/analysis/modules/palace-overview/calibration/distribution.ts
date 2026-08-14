import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import type { BirthInput, School } from "@/types/chart";

export interface DistributionStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  p01: number;
  p05: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  exact0Rate: number;
  exact100Rate: number;
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

export function summarizeScores(scores: number[]): DistributionStats {
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = n === 0 ? 0 : sorted.reduce((a, b) => a + b, 0) / n;
  const variance =
    n === 0 ? 0 : sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return {
    count: n,
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
    mean,
    median: pct(sorted, 0.5),
    stddev: Math.sqrt(variance),
    p01: pct(sorted, 0.01),
    p05: pct(sorted, 0.05),
    p10: pct(sorted, 0.1),
    p25: pct(sorted, 0.25),
    p75: pct(sorted, 0.75),
    p90: pct(sorted, 0.9),
    p95: pct(sorted, 0.95),
    p99: pct(sorted, 0.99),
    exact0Rate: n === 0 ? 0 : scores.filter((s) => s === 0).length / n,
    exact100Rate: n === 0 ? 0 : scores.filter((s) => s === 100).length / n,
  };
}

export function buildMatrixInputs(count = 24): BirthInput[] {
  const hours = ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"] as const;
  const inputs: BirthInput[] = [];
  for (let i = 0; i < count; i++) {
    const year = 1960 + i * 2;
    const month = (i % 12) + 1;
    const day = 3 + (i % 24);
    inputs.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: hours[i % hours.length]!,
      gender: i % 2 === 0 ? "female" : "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
  }
  return inputs;
}

export function collectSchoolScores(school: School, inputs: BirthInput[]): number[] {
  const calc = school === "nam-phai" ? calculateNamPhai : calculateTrungChau;
  const scores: number[] = [];
  for (const input of inputs) {
    const { results } = analyzeAllPalaces(calc(input), { school });
    for (const r of results) scores.push(r.score);
  }
  return scores;
}

export function distributionPathological(stats: DistributionStats): boolean {
  if (stats.count === 0) return true;
  if (stats.exact0Rate + stats.exact100Rate > 0.05) return true;
  if (stats.max - stats.min < 5) return true;
  return false;
}
