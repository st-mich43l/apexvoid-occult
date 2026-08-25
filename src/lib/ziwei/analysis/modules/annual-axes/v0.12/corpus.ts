import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import {
  ANNUAL_AXIS_DOMAINS,
  type AnnualAxisDomain,
} from "../../../contracts/annual-axes";
import { analyzeAnnualAxesNamPhaiV10 } from "../v0.10-layered/analyze";
import { analyzeAnnualAxesNamPhaiV12 } from "./analyze";
import type { V12ProfileId, V12ReferenceMass } from "../../../knowledge/annual-axes/v0.12";
import { isSparseLayerSaturation } from "./static-signal";

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

/** Deterministic research corpus: ≥120 natal charts × ≥5 annual years. */
export function buildResearchCorpus(input?: {
  natalCount?: number;
  years?: number[];
}): BirthInput[] {
  const natalCount = input?.natalCount ?? 120;
  const years = input?.years ?? [2024, 2025, 2026, 2027, 2028];
  const out: BirthInput[] = [];
  for (let i = 0; i < natalCount; i++) {
    const year = 1950 + (i % 55);
    const month = (i % 12) + 1;
    const day = 1 + (i % 27);
    for (const annualYear of years) {
      out.push({
        solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        birthHour: HOURS[i % 12]!,
        gender: i % 2 === 0 ? "female" : "male",
        timezone: "7",
        annualYear: String(annualYear),
        flowBase: "luu-nien",
      });
    }
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean =
    sorted.length === 0
      ? NaN
      : sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const variance =
    sorted.length < 2
      ? 0
      : sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (sorted.length - 1);
  return {
    n: sorted.length,
    mean,
    median: percentile(sorted, 0.5),
    stdev: Math.sqrt(variance),
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    min: sorted[0] ?? NaN,
    max: sorted[sorted.length - 1] ?? NaN,
    count45to55: sorted.filter((v) => v >= 45 && v <= 55).length,
    count40to60: sorted.filter((v) => v >= 40 && v <= 60).length,
    countLe20: sorted.filter((v) => v <= 20).length,
    countGe80: sorted.filter((v) => v >= 80).length,
    countLe15: sorted.filter((v) => v <= 15).length,
    countGe85: sorted.filter((v) => v >= 85).length,
  };
}

export function runV12CorpusAudit(input?: {
  natalCount?: number;
  years?: number[];
  profileId?: V12ProfileId;
  referenceMass?: V12ReferenceMass;
}): {
  chartYearCount: number;
  domainEvalCount: number;
  controlV011: Record<string, ReturnType<typeof summarize>>;
  candidateV012: Record<string, ReturnType<typeof summarize>>;
  layerNets: {
    control: Record<string, Record<string, ReturnType<typeof summarize>>>;
    candidate: Record<string, Record<string, ReturnType<typeof summarize>>>;
  };
  sparseSaturation: {
    controlNatalRate: number;
    candidateNatalRate: number;
  };
} {
  const corpus = buildResearchCorpus(input);
  const profileId = input?.profileId ?? "CONTROL-LAYERED-BALANCED";
  const referenceMass = input?.referenceMass ?? 4;

  const controlScores: Record<AnnualAxisDomain, number[]> = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };
  const candidateScores: typeof controlScores = {
    health: [],
    family: [],
    wealth: [],
    career: [],
    social: [],
    romance: [],
  };
  const layerKeys = ["natal", "decade", "annual", "resonance", "composite"] as const;
  const controlLayers: Record<
    (typeof layerKeys)[number],
    Record<AnnualAxisDomain, number[]>
  > = {
    natal: { health: [], family: [], wealth: [], career: [], social: [], romance: [] },
    decade: { health: [], family: [], wealth: [], career: [], social: [], romance: [] },
    annual: { health: [], family: [], wealth: [], career: [], social: [], romance: [] },
    resonance: { health: [], family: [], wealth: [], career: [], social: [], romance: [] },
    composite: { health: [], family: [], wealth: [], career: [], social: [], romance: [] },
  };
  const candidateLayers: typeof controlLayers = structuredClone(controlLayers);

  let sparseControl = 0;
  let sparseCandidate = 0;
  let natalObs = 0;

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const c11 = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
    });
    const c12 = analyzeAnnualAxesNamPhaiV12(chart, {
      profileId,
      referenceMass,
    });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const a11 = c11.axes[domain];
      const a12 = c12.axes[domain];
      if (a11.finalScore != null) controlScores[domain].push(a11.finalScore);
      if (a12.finalScore != null) candidateScores[domain].push(a12.finalScore);

      controlLayers.natal[domain].push(a11.natal.signedNet);
      controlLayers.decade[domain].push(a11.decade.signedNet);
      controlLayers.annual[domain].push(a11.annual.signedNet);
      controlLayers.resonance[domain].push(a11.resonance.signedNet);
      controlLayers.composite[domain].push(a11.compositeNet);

      candidateLayers.natal[domain].push(a12.natal.signedNet);
      candidateLayers.decade[domain].push(a12.decade.signedNet);
      candidateLayers.annual[domain].push(a12.annual.signedNet);
      candidateLayers.resonance[domain].push(a12.resonance.signedNet);
      candidateLayers.composite[domain].push(a12.compositeNet);

      natalObs += 1;
      const mass11 = a11.natal.supportMass + a11.natal.pressureMass;
      if (
        isSparseLayerSaturation({
          signedNet: a11.natal.signedNet,
          evidenceMass: mass11,
        })
      ) {
        sparseControl += 1;
      }
      const mass12 = a12.natal.supportMass + a12.natal.pressureMass;
      // For V0.12, saturation flag uses evidence mass proxy from layer masses.
      if (
        isSparseLayerSaturation({
          signedNet: a12.natal.signedNet,
          evidenceMass: mass12,
        })
      ) {
        sparseCandidate += 1;
      }
    }
  }

  const pack = (
    layers: typeof controlLayers,
  ): Record<string, Record<string, ReturnType<typeof summarize>>> =>
    Object.fromEntries(
      layerKeys.map((k) => [
        k,
        Object.fromEntries(
          ANNUAL_AXIS_DOMAINS.map((d) => [d, summarize(layers[k][d])]),
        ),
      ]),
    );

  return {
    chartYearCount: corpus.length,
    domainEvalCount: corpus.length * 6,
    controlV011: Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [d, summarize(controlScores[d])]),
    ),
    candidateV012: Object.fromEntries(
      ANNUAL_AXIS_DOMAINS.map((d) => [d, summarize(candidateScores[d])]),
    ),
    layerNets: {
      control: pack(controlLayers),
      candidate: pack(candidateLayers),
    },
    sparseSaturation: {
      controlNatalRate: natalObs === 0 ? 0 : sparseControl / natalObs,
      candidateNatalRate: natalObs === 0 ? 0 : sparseCandidate / natalObs,
    },
  };
}
