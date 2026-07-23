import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput, ChartData } from "@/types/chart";
import { analyzeMajorFortune } from "../../analyze";
import { analyzeMajorFortuneV02 } from "../../v0.2";
import type { MajorFortuneV02Result } from "../../v0.2/types";
import {
  buildMajorFortuneV02BirthInputs,
  splitTrainHoldout,
  type MajorFortuneV02CorpusContract,
} from "./corpus";

export interface MajorFortuneV02AuditMetrics {
  corpusId: string;
  seed: number;
  chartCount: number;
  observationCount: number;
  schools: string[];
  score: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
    quantiles: Record<string, number | null>;
    saturation0: number;
    saturation50: number;
    saturation100: number;
    nanOrInfinity: number;
  };
  bandDistribution: Record<string, number>;
  scoreStateDistribution: Record<string, number>;
  pillarClipRate: Record<string, number>;
  pillarRaw: Record<string, { min: number; max: number; mean: number }>;
  ruleCoverage: { matchedStructuralRuleIds: string[]; executableContributionRuleIds: string[] };
  namPhaiPartialRate: number;
  trungChauTransformationStructuralHits: number;
  duplicatePhysicalFactRate: number;
  annualYearIndependenceFailures: number;
  deterministicRerunFailures: number;
  scoreBoundsFailures: number;
  v01ControlReproducible: boolean;
  hardGateFailures: string[];
}

function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[idx]!;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateChart(school: "nam-phai" | "trung-chau", input: BirthInput): ChartData {
  return school === "nam-phai" ? calculateNamPhai(input) : calculateTrungChau(input);
}

function stableResultJson(result: MajorFortuneV02Result): string {
  return JSON.stringify(result);
}

export function runMajorFortuneV02Audit(
  contract: MajorFortuneV02CorpusContract,
): MajorFortuneV02AuditMetrics {
  const inputs = buildMajorFortuneV02BirthInputs(contract);
  const { train, holdout } = splitTrainHoldout(inputs, contract.trainCount);
  void holdout; // reserved — do not tune on holdout
  void train;

  const scores: number[] = [];
  const bandDistribution: Record<string, number> = {};
  const scoreStateDistribution: Record<string, number> = {};
  const pillarClipHits: Record<string, number> = {
    "thien-thoi": 0,
    "dia-loi": 0,
    "nhan-hoa": 0,
    "tu-hoa-sat-tinh": 0,
  };
  const pillarRawSamples: Record<string, number[]> = {
    "thien-thoi": [],
    "dia-loi": [],
    "nhan-hoa": [],
    "tu-hoa-sat-tinh": [],
  };
  const matchedStructural = new Set<string>();
  const executableRules = new Set<string>();
  let observationCount = 0;
  let namPhaiPartial = 0;
  let namPhaiTotal = 0;
  let tcTransformHits = 0;
  let duplicatePhysicalFacts = 0;
  let physicalFactChecks = 0;
  let annualYearIndependenceFailures = 0;
  let deterministicRerunFailures = 0;
  let scoreBoundsFailures = 0;
  let saturation0 = 0;
  let saturation50 = 0;
  let saturation100 = 0;
  let nanOrInfinity = 0;
  const hardGateFailures: string[] = [];

  let v01ControlReproducible = true;

  for (const school of ["nam-phai", "trung-chau"] as const) {
    for (const input of inputs) {
      const chart = calculateChart(school, input);
      const result = analyzeMajorFortuneV02(chart, { school });
      const again = analyzeMajorFortuneV02(chart, { school });
      if (stableResultJson(result) !== stableResultJson(again)) {
        deterministicRerunFailures += 1;
      }

      const altYear = {
        ...input,
        annualYear: String(Number(input.annualYear) + 1),
      };
      const chartAlt = calculateChart(school, altYear);
      // Independence: only compare when active MF decade identity is unchanged.
      const a = chart.majorFortunePalace?.majorFortune;
      const b = chartAlt.majorFortunePalace?.majorFortune;
      if (
        a &&
        b &&
        a.order === b.order &&
        a.start === b.start &&
        a.end === b.end &&
        chart.majorFortunePalace?.index === chartAlt.majorFortunePalace?.index
      ) {
        const r2 = analyzeMajorFortuneV02(chartAlt, { school });
        // Strip diagnostics.forbiddenAnnualFacts which may differ by presence
        // of annual fields — numeric score/pillars/band must match.
        if (
          result.score !== r2.score ||
          result.band !== r2.band ||
          JSON.stringify(result.trace) !== JSON.stringify(r2.trace) ||
          JSON.stringify(result.pillars) !== JSON.stringify(r2.pillars)
        ) {
          annualYearIndependenceFailures += 1;
        }
      }

      // V0.1 control reproducibility (smoke): call twice, compare JSON
      const v01a = analyzeMajorFortune(chart, { school });
      const v01b = analyzeMajorFortune(chart, { school });
      if (JSON.stringify(v01a) !== JSON.stringify(v01b)) v01ControlReproducible = false;

      observationCount += 1;
      if (school === "nam-phai") {
        namPhaiTotal += 1;
        if (result.status === "partial") namPhaiPartial += 1;
      }

      if (result.score == null || !Number.isFinite(result.score)) {
        nanOrInfinity += 1;
        scoreBoundsFailures += 1;
      } else {
        if (result.score < 0 || result.score > 100) scoreBoundsFailures += 1;
        scores.push(result.score);
        if (result.score === 0) saturation0 += 1;
        if (result.score === 50) saturation50 += 1;
        if (result.score === 100) saturation100 += 1;
      }

      const bandKey = result.band ?? "null";
      bandDistribution[bandKey] = (bandDistribution[bandKey] ?? 0) + 1;
      scoreStateDistribution[result.scoreState] =
        (scoreStateDistribution[result.scoreState] ?? 0) + 1;

      for (const [pillarId, pillar] of Object.entries(result.pillars)) {
        pillarRawSamples[pillarId]!.push(pillar.rawDelta);
        if (Math.abs(pillar.rawDelta) > pillar.cap + 1e-12) {
          hardGateFailures.push(`pillar-exceeds-cap:${pillarId}`);
        }
        if (Math.abs(pillar.rawDelta) > pillar.cap + 1e-12) {
          pillarClipHits[pillarId] = (pillarClipHits[pillarId] ?? 0) + 1;
        } else if (Math.abs(pillar.rawDelta) > pillar.cap - 1e-12 && Math.abs(pillar.rawDelta) >= pillar.cap) {
          pillarClipHits[pillarId] = (pillarClipHits[pillarId] ?? 0) + 1;
        } else if (Math.abs(pillar.rawDelta) > pillar.cap) {
          pillarClipHits[pillarId] = (pillarClipHits[pillarId] ?? 0) + 1;
        }
        // Clip rate: raw exceeded cap before clamp
        if (Math.abs(pillar.rawDelta) > pillar.cap) {
          // already counted
        }
        const preClampRaw = pillar.contributions.reduce((s, c) => s + c.rawDelta, 0);
        if (Math.abs(preClampRaw) > pillar.cap) {
          pillarClipHits[pillarId] = (pillarClipHits[pillarId] ?? 0) + 1;
        }

        for (const id of pillar.matchedStructuralRuleIds) matchedStructural.add(id);
        for (const c of pillar.contributions) {
          executableRules.add(c.ruleId);
          if (!c.sourceIds.length || !c.claimIds.length || !c.ruleId) {
            hardGateFailures.push(`contribution-missing-provenance:${c.ruleId}`);
          }
          if (school === "nam-phai" && c.ruleId.includes("XF") && c.rawDelta !== 0) {
            hardGateFailures.push("nam-phai-unsupported-transformation-contribution");
          }
        }

        const seenFacts = new Set<string>();
        for (const c of pillar.contributions) {
          physicalFactChecks += 1;
          if (seenFacts.has(c.physicalFactId)) duplicatePhysicalFacts += 1;
          seenFacts.add(c.physicalFactId);
        }
      }

      if (school === "trung-chau") {
        for (const pillar of Object.values(result.pillars)) {
          if (pillar.matchedStructuralRuleIds.some((id) => id.includes("XF-trung-chau"))) {
            tcTransformHits += 1;
          }
        }
      }

      if (result.diagnostics.mutexViolations.length > 0) {
        hardGateFailures.push(...result.diagnostics.mutexViolations.map((m) => `mutex:${m}`));
      }
    }
  }

  if (scoreBoundsFailures > 0) hardGateFailures.push("score-outside-0-100");
  if (annualYearIndependenceFailures > 0) {
    hardGateFailures.push("annual-or-monthly-fact-affects-numeric");
  }
  if (deterministicRerunFailures > 0) hardGateFailures.push("nondeterministic-artifacts");
  if (!v01ControlReproducible) hardGateFailures.push("v01-output-changed");

  const sorted = [...scores].sort((a, b) => a - b);
  const pillarRaw: MajorFortuneV02AuditMetrics["pillarRaw"] = {};
  for (const [id, samples] of Object.entries(pillarRawSamples)) {
    pillarRaw[id] = {
      min: samples.length ? Math.min(...samples) : 0,
      max: samples.length ? Math.max(...samples) : 0,
      mean: mean(samples) ?? 0,
    };
  }

  const pillarClipRate: Record<string, number> = {};
  for (const id of Object.keys(pillarClipHits)) {
    pillarClipRate[id] = observationCount === 0 ? 0 : pillarClipHits[id]! / observationCount;
  }

  return {
    corpusId: contract.corpusId,
    seed: contract.seed,
    chartCount: contract.chartCount,
    observationCount,
    schools: ["nam-phai", "trung-chau"],
    score: {
      min: sorted[0] ?? null,
      max: sorted[sorted.length - 1] ?? null,
      mean: mean(sorted),
      median: quantile(sorted, 0.5),
      quantiles: {
        p10: quantile(sorted, 0.1),
        p25: quantile(sorted, 0.25),
        p75: quantile(sorted, 0.75),
        p90: quantile(sorted, 0.9),
      },
      saturation0,
      saturation50,
      saturation100,
      nanOrInfinity,
    },
    bandDistribution,
    scoreStateDistribution,
    pillarClipRate,
    pillarRaw,
    ruleCoverage: {
      matchedStructuralRuleIds: [...matchedStructural].sort(),
      executableContributionRuleIds: [...executableRules].sort(),
    },
    namPhaiPartialRate: namPhaiTotal === 0 ? 0 : namPhaiPartial / namPhaiTotal,
    trungChauTransformationStructuralHits: tcTransformHits,
    duplicatePhysicalFactRate:
      physicalFactChecks === 0 ? 0 : duplicatePhysicalFacts / physicalFactChecks,
    annualYearIndependenceFailures,
    deterministicRerunFailures,
    scoreBoundsFailures,
    v01ControlReproducible,
    hardGateFailures: [...new Set(hardGateFailures)],
  };
}
