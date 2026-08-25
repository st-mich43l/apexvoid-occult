import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../../analyze-all-palaces";
import { decomposePalaceEvidence } from "./decompose";
import { scoreStaticV13Candidates } from "./score-candidates";
import type { StaticV13CandidateId } from "./types";

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

const TRINE_GROUPS = [
  ["Dần", "Ngọ", "Tuất"],
  ["Thân", "Tý", "Thìn"],
  ["Tỵ", "Dậu", "Sửu"],
  ["Hợi", "Mão", "Mùi"],
] as const;

function buildStaticCorpus(count = 100): BirthInput[] {
  const out: BirthInput[] = [];
  for (let i = 0; i < count; i++) {
    const year = 1950 + (i % 70);
    const month = (i % 12) + 1;
    const day = 1 + (i % 27);
    out.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: HOURS[i % 12]!,
      gender: i % 2 === 0 ? "male" : "female",
      timezone: "7",
      annualYear: String(2020 + (i % 8)),
      flowBase: "luu-nien",
    });
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

export interface SaturationStats {
  n: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  ge80: number;
  ge85: number;
  ge90: number;
  ge95: number;
  le20: number;
  meanRemoteShare: number;
  dominanceRate: number;
  mutualTrineAmpRate: number;
}

function statsFromScores(
  scores: number[],
  remoteShares: number[],
  dominanceFlags: number,
  mutualFlags: number,
  chartCount: number,
): SaturationStats {
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / Math.max(sorted.length, 1);
  return {
    n: sorted.length,
    mean,
    median: percentile(sorted, 0.5),
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    ge80: sorted.filter((s) => s >= 80).length,
    ge85: sorted.filter((s) => s >= 85).length,
    ge90: sorted.filter((s) => s >= 90).length,
    ge95: sorted.filter((s) => s >= 95).length,
    le20: sorted.filter((s) => s <= 20).length,
    meanRemoteShare: remoteShares.length
      ? remoteShares.reduce((a, b) => a + b, 0) / remoteShares.length
      : 0,
    dominanceRate: scores.length ? dominanceFlags / scores.length : 0,
    mutualTrineAmpRate: chartCount ? mutualFlags / chartCount : 0,
  };
}

export function runStaticV13CorpusAudit(input?: {
  corpusSize?: number;
}): {
  control: SaturationStats;
  candidates: Record<Exclude<StaticV13CandidateId, "control">, SaturationStats>;
} {
  const corpus = buildStaticCorpus(input?.corpusSize ?? 100);
  const controlScores: number[] = [];
  const controlRemote: number[] = [];
  let controlDominance = 0;
  let controlMutual = 0;

  const candScores: Record<string, number[]> = {
    "context-normalized": [],
    "context-diminishing": [],
    "local-context": [],
  };
  const candRemote: Record<string, number[]> = {
    "context-normalized": [],
    "context-diminishing": [],
    "local-context": [],
  };
  const candDominance: Record<string, number> = {
    "context-normalized": 0,
    "context-diminishing": 0,
    "local-context": 0,
  };
  const candMutual: Record<string, number> = {
    "context-normalized": 0,
    "context-diminishing": 0,
    "local-context": 0,
  };

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });

    for (const group of TRINE_GROUPS) {
      const members = results.filter((r) => group.includes(r.palaceBranch as never));
      const high = members.filter((r) => r.score >= 85);
      if (high.length >= 2) {
        const remoteHeavy = high.filter((r) => {
          const d = decomposePalaceEvidence(r);
          return (d.remoteShare ?? 0) > 0.45;
        });
        if (remoteHeavy.length >= 2) controlMutual += 1;
      }
    }

    for (const r of results) {
      const d = decomposePalaceEvidence(r);
      controlScores.push(r.score);
      if (d.remoteShare != null) controlRemote.push(d.remoteShare);
      if (d.flags.includes("TP4C_CONTEXT_DOMINANCE")) controlDominance += 1;

      const cands = scoreStaticV13Candidates(r.allEvidence);
      for (const id of Object.keys(candScores) as Array<
        Exclude<StaticV13CandidateId, "control">
      >) {
        const c = cands[id];
        candScores[id]!.push(c.score);
        if (c.remoteShare != null) candRemote[id]!.push(c.remoteShare);
        if ((c.remoteShare ?? 0) > 0.55 && c.score >= 80) {
          candDominance[id] = (candDominance[id] ?? 0) + 1;
        }
      }
    }

    for (const id of Object.keys(candScores) as Array<
      Exclude<StaticV13CandidateId, "control">
    >) {
      for (const group of TRINE_GROUPS) {
        const members = results.filter((r) => group.includes(r.palaceBranch as never));
        const scored = members.map((r) => scoreStaticV13Candidates(r.allEvidence)[id]);
        const high = scored.filter((c) => c.score >= 85 && (c.remoteShare ?? 0) > 0.45);
        if (high.length >= 2) candMutual[id] = (candMutual[id] ?? 0) + 1;
      }
    }
  }

  return {
    control: statsFromScores(
      controlScores,
      controlRemote,
      controlDominance,
      controlMutual,
      corpus.length,
    ),
    candidates: {
      "context-normalized": statsFromScores(
        candScores["context-normalized"]!,
        candRemote["context-normalized"]!,
        candDominance["context-normalized"]!,
        candMutual["context-normalized"]!,
        corpus.length,
      ),
      "context-diminishing": statsFromScores(
        candScores["context-diminishing"]!,
        candRemote["context-diminishing"]!,
        candDominance["context-diminishing"]!,
        candMutual["context-diminishing"]!,
        corpus.length,
      ),
      "local-context": statsFromScores(
        candScores["local-context"]!,
        candRemote["local-context"]!,
        candDominance["local-context"]!,
        candMutual["local-context"]!,
        corpus.length,
      ),
    },
  };
}
