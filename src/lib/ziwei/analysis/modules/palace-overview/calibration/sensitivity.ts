import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import type { BirthInput, School } from "@/types/chart";

const SEED: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

export interface SensitivityRow {
  parameter: string;
  perturbation: string;
  medianAbsDelta: number;
  p95AbsDelta: number;
  bandFlipRate: number;
  rankFlipRate: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
  return sorted[idx]!;
}

function scoresFor(
  school: School,
  knowledge: PalaceOverviewKnowledgeV1,
): { scores: number[]; bands: string[]; order: string[] } {
  const chart = school === "nam-phai" ? calculateNamPhai(SEED) : calculateTrungChau(SEED);
  const { results } = analyzeAllPalaces(chart, { school, knowledge });
  const ranked = [...results].sort((a, b) => b.score - a.score);
  return {
    scores: results.map((r) => r.score),
    bands: results.map((r) => r.band),
    order: ranked.map((r) => r.palaceName),
  };
}

export function runGeometrySensitivity(
  baseline: PalaceOverviewKnowledgeV1,
): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  const schools: School[] = ["nam-phai", "trung-chau"];

  const variants: Array<{
    name: string;
    factor: number;
    key: "opposite" | "trine" | "scale" | "mieu" | "loc";
  }> = [
    { name: "geometry.opposite", factor: 1.1, key: "opposite" },
    { name: "geometry.opposite", factor: 0.9, key: "opposite" },
    { name: "geometry.trine", factor: 1.1, key: "trine" },
    { name: "brightness.Mieu.supportFactor", factor: 1.1, key: "mieu" },
    { name: "tuhoa.Loc.support", factor: 1.1, key: "loc" },
  ];

  for (const v of variants) {
    const deltas: number[] = [];
    let bandFlips = 0;
    let rankFlips = 0;
    let n = 0;
    for (const school of schools) {
      const base = scoresFor(school, baseline);
      const knowledge = structuredClone(baseline);
      if (v.key === "opposite") {
        knowledge.profile.geometry.opposite *= v.factor;
      } else if (v.key === "trine") {
        knowledge.profile.geometry.trine *= v.factor;
      } else if (v.key === "scale") {
        knowledge.profile.qualityNormalization.scale *= v.factor;
      } else if (v.key === "mieu") {
        knowledge.majorStars.brightnessModifiers.Miếu!.supportFactor *= v.factor;
      } else {
        const loc = knowledge.transformations.transformations.find(
          (t) => t.transformation === "Lộc",
        );
        if (loc) loc.axes.support *= v.factor;
      }
      const cand = scoresFor(school, knowledge);
      for (let i = 0; i < base.scores.length; i++) {
        deltas.push(Math.abs(cand.scores[i]! - base.scores[i]!));
        if (cand.bands[i] !== base.bands[i]) bandFlips += 1;
        n += 1;
      }
      const baseRank = base.order.join(",");
      const candRank = cand.order.join(",");
      if (baseRank !== candRank) rankFlips += 1;
    }
    deltas.sort((a, b) => a - b);
    rows.push({
      parameter: v.name,
      perturbation: `×${v.factor}`,
      medianAbsDelta: deltas[Math.floor(deltas.length / 2)] ?? 0,
      p95AbsDelta: percentile(deltas, 0.95),
      bandFlipRate: n === 0 ? 0 : bandFlips / n,
      rankFlipRate: rankFlips / schools.length,
    });
  }
  return rows;
}

export function sensitivityUnstable(rows: SensitivityRow[]): boolean {
  return rows.some((r) => r.p95AbsDelta >= 25 && r.medianAbsDelta >= 10);
}
