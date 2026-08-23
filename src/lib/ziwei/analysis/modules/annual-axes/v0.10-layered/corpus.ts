import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { analyzeAnnualAxesNamPhaiV10 } from "./analyze";
import type { V10ProfileId } from "../../../knowledge/annual-axes/v0.10";

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

function buildFastAuditCorpus(count = 24): BirthInput[] {
  const inputs: BirthInput[] = [];
  const years = [2024, 2025, 2026, 2027];
  for (let i = 0; i < count; i++) {
    const year = 1955 + (i % 50);
    const month = (i % 12) + 1;
    const day = 1 + (i % 27);
    inputs.push({
      solarDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: HOURS[i % 12]!,
      gender: i % 2 === 0 ? "female" : "male",
      timezone: "7",
      annualYear: String(years[i % years.length]),
      flowBase: "luu-nien",
    });
  }
  return inputs;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1)));
  return sorted[idx]!;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(v);
}

interface DomainAuditStats {
  domain: AnnualAxisDomain;
  n: number;
  availabilityRate: number;
  partialRate: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  stdev: number;
  share45to55: number;
  shareBelow30: number;
  shareAbove70: number;
  meanAbsDeltaVsControl: number;
  maxAbsDeltaVsControl: number;
}

export interface V10AuditReport {
  profileId: V10ProfileId;
  chartCount: number;
  observationCount: number;
  domains: DomainAuditStats[];
  warnings: string[];
  materiality: {
    meanAbsDelta: number;
    medianAbsDelta: number;
    maxAbsDelta: number;
    flag: "OK" | "TOO_WEAK" | "POSSIBLY_UNSTABLE";
  };
  layerMass: {
    natal: number;
    decade: number;
    annual: number;
    resonance: number;
  };
}

export function runFastAudit(input: {
  profileId?: V10ProfileId;
  corpusSize?: number;
}): V10AuditReport {
  const profileId = input.profileId ?? "layered-balanced";
  const corpus = buildFastAuditCorpus(input.corpusSize ?? 24);
  const byDomain = Object.fromEntries(
    ANNUAL_AXIS_DOMAINS.map((d) => [
      d,
      { scores: [] as number[], deltas: [] as number[], available: 0, partial: 0, total: 0 },
    ]),
  ) as Record<
    AnnualAxisDomain,
    {
      scores: number[];
      deltas: number[];
      available: number;
      partial: number;
      total: number;
    }
  >;

  let natalMass = 0;
  let decadeMass = 0;
  let annualMass = 0;
  let resonanceMass = 0;
  let massN = 0;

  for (const birth of corpus) {
    const chart = calculateNamPhai(birth);
    const result = analyzeAnnualAxesNamPhaiV10(chart, { profileId });
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = result.axes[domain];
      const bucket = byDomain[domain];
      bucket.total += 1;
      if (axis.status === "available") bucket.available += 1;
      if (axis.status === "partial") bucket.partial += 1;
      if (axis.finalScore != null) {
        bucket.scores.push(axis.finalScore);
        const c = result.controlScores[domain];
        if (c != null) bucket.deltas.push(Math.abs(axis.finalScore - c));
      }
      natalMass += Math.abs(axis.natal.signedNet);
      decadeMass += Math.abs(axis.decade.signedNet);
      annualMass += Math.abs(axis.annual.signedNet);
      resonanceMass += Math.abs(axis.resonance.signedNet);
      massN += 1;
    }
  }

  const domains: DomainAuditStats[] = ANNUAL_AXIS_DOMAINS.map((domain) => {
    const b = byDomain[domain];
    const sorted = [...b.scores].sort((a, c) => a - c);
    const mean = sorted.length
      ? sorted.reduce((a, c) => a + c, 0) / sorted.length
      : NaN;
    return {
      domain,
      n: b.total,
      availabilityRate: b.total ? b.available / b.total : 0,
      partialRate: b.total ? b.partial / b.total : 0,
      mean,
      median: percentile(sorted, 0.5),
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
      min: sorted[0] ?? NaN,
      max: sorted[sorted.length - 1] ?? NaN,
      stdev: stdev(sorted),
      share45to55: sorted.length
        ? sorted.filter((s) => s >= 45 && s <= 55).length / sorted.length
        : 0,
      shareBelow30: sorted.length
        ? sorted.filter((s) => s < 30).length / sorted.length
        : 0,
      shareAbove70: sorted.length
        ? sorted.filter((s) => s > 70).length / sorted.length
        : 0,
      meanAbsDeltaVsControl: b.deltas.length
        ? b.deltas.reduce((a, c) => a + c, 0) / b.deltas.length
        : 0,
      maxAbsDeltaVsControl: b.deltas.length ? Math.max(...b.deltas) : 0,
    };
  });

  const allDeltas = domains.flatMap((d) => {
    // reconstruct approx from mean/max already aggregated; use domain means of deltas
    return [d.meanAbsDeltaVsControl];
  });
  const meanAbsDelta =
    domains.reduce((a, d) => a + d.meanAbsDeltaVsControl, 0) / domains.length;
  const maxAbsDelta = Math.max(...domains.map((d) => d.maxAbsDeltaVsControl));
  const medianAbsDelta = percentile(
    [...domains.map((d) => d.meanAbsDeltaVsControl)].sort((a, b) => a - b),
    0.5,
  );

  const warnings: string[] = [];
  for (const d of domains) {
    if (d.share45to55 > 0.7) warnings.push(`CENTER_COLLAPSE:${d.domain}`);
    if (d.shareBelow30 > 0.5) warnings.push(`DOMAIN_BIAS_LOW:${d.domain}`);
    if (d.shareAbove70 > 0.5) warnings.push(`DOMAIN_BIAS_HIGH:${d.domain}`);
  }
  const layerShare = {
    natal: massN ? natalMass / massN : 0,
    decade: massN ? decadeMass / massN : 0,
    annual: massN ? annualMass / massN : 0,
    resonance: massN ? resonanceMass / massN : 0,
  };
  if (layerShare.annual < 0.05) warnings.push("ANNUAL_SIGNAL_ERASED");
  if (layerShare.natal > 0.7) warnings.push("NATAL_DOMINANCE");
  if (layerShare.annual > 0.7) warnings.push("ANNUAL_DOMINANCE");
  if (layerShare.resonance > 0.5) warnings.push("RESONANCE_OVERACTIVE");
  if (layerShare.resonance < 0.02) warnings.push("RESONANCE_INACTIVE");

  let flag: V10AuditReport["materiality"]["flag"] = "OK";
  if (meanAbsDelta < 0.5) flag = "TOO_WEAK";
  if (maxAbsDelta > 35) flag = "POSSIBLY_UNSTABLE";

  void allDeltas;

  return {
    profileId,
    chartCount: corpus.length,
    observationCount: corpus.length * ANNUAL_AXIS_DOMAINS.length,
    domains,
    warnings,
    materiality: {
      meanAbsDelta,
      medianAbsDelta,
      maxAbsDelta,
      flag,
    },
    layerMass: layerShare,
  };
}
