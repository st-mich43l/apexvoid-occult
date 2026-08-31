/**
 * Immutable PRE counterfactual chart construction.
 * Changes only mutagen record arrays via shared resolveMutagenRecords + PRE table.
 */
import type { ChartData, ChartPalace, MutagenRecord } from "@/types/chart";
import {
  resolveMutagenRecords,
  resolvePhiFlows,
} from "@/lib/ziwei/calculation/shared-mutagens";
import type { ZiweiWorkingPalace } from "@/lib/ziwei/calculation/shared-primitives";
import { PRE_CORRECTION_TRUNG_CHAU_TU_HOA } from "./policy";
import { buildLayerExposure } from "./exposure";
import type { CorrectionExposure } from "./types";

function asWorkingPalaces(palaces: ChartPalace[]): ZiweiWorkingPalace[] {
  return palaces.map((p) => ({
    ...p,
    stars: [...(p.stars ?? [])],
  }));
}

function majorStemOf(chart: ChartData): string | null {
  return chart.majorFortunePalace?.stem ?? null;
}

function khoaOf(records: MutagenRecord[] | undefined): {
  starName: string | null;
  palaceIndex: number | null;
  resolved: boolean;
} {
  const khoa = records?.find((r) => r.mutagen === "Khoa");
  if (!khoa) return { starName: null, palaceIndex: null, resolved: false };
  return {
    starName: khoa.starName,
    palaceIndex: khoa.palace?.index ?? null,
    resolved: khoa.palace != null,
  };
}

export interface CounterfactualPair {
  postChart: ChartData;
  preChart: ChartData;
  exposure: CorrectionExposure;
  khoaTargets: {
    natal: { pre: ReturnType<typeof khoaOf>; post: ReturnType<typeof khoaOf> };
    annual: { pre: ReturnType<typeof khoaOf>; post: ReturnType<typeof khoaOf> };
    major: { pre: ReturnType<typeof khoaOf>; post: ReturnType<typeof khoaOf> };
  };
}

/**
 * Clone POST chart and rebuild natal/annual/major mutagen layers from PRE table.
 * Does not mutate the source chart. Does not change palaces/stars geometry.
 */
export function buildPreCorrectionShadowChart(postChart: ChartData): CounterfactualPair {
  const snapshotNatal = postChart.natalMutagens?.length ?? 0;
  const working = asWorkingPalaces(postChart.palaces);
  const natalStem = postChart.yearStem ?? null;
  const annualStem = postChart.annualStem ?? null;
  const majorStem = majorStemOf(postChart);

  const preNatal = natalStem
    ? resolveMutagenRecords(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, natalStem, working, "natal")
    : [];
  const preAnnual = annualStem
    ? resolveMutagenRecords(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, annualStem, working, "annual")
    : [];
  const preMajor = majorStem
    ? resolveMutagenRecords(
        PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
        majorStem,
        working,
        "major-mutagen",
      )
    : [];
  const prePhi = resolvePhiFlows(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, working);

  const preChart: ChartData = structuredClone(postChart);
  preChart.natalMutagens = preNatal;
  preChart.annualMutagens = preAnnual;
  preChart.majorMutagens = preMajor;
  preChart.phiFlows = prePhi;

  // Immutability guard: source mutagen array length unchanged and not replaced.
  if ((postChart.natalMutagens?.length ?? 0) !== snapshotNatal) {
    throw new Error("SOURCE_CHART_MUTATED: natalMutagens length changed");
  }

  const exposure = buildLayerExposure({ natalStem, annualStem, majorStem });

  return {
    postChart,
    preChart,
    exposure,
    khoaTargets: {
      natal: {
        pre: khoaOf(preChart.natalMutagens),
        post: khoaOf(postChart.natalMutagens),
      },
      annual: {
        pre: khoaOf(preChart.annualMutagens),
        post: khoaOf(postChart.annualMutagens),
      },
      major: {
        pre: khoaOf(preChart.majorMutagens),
        post: khoaOf(postChart.majorMutagens),
      },
    },
  };
}

/** Deep structural equality for mutagen star/palace index only (research). */
export function mutagenKhoaFingerprint(records: MutagenRecord[] | undefined): string {
  const k = khoaOf(records);
  return `${k.starName ?? "∅"}@${k.palaceIndex ?? "null"}:${k.resolved ? "ok" : "unresolved"}`;
}
