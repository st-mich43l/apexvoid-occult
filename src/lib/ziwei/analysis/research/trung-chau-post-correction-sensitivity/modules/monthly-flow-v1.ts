/**
 * MONTHLY_FLOW_V1_SHADOW_CANDIDATE_SENSITIVITY
 * TC production Monthly Flow remains unavailable — this lane is shadow-only.
 */
import type { ChartData } from "@/types/chart";
import { getTuHoaTargets } from "@/lib/ziwei/calculation/shared-mutagens";
import type { TuHoaTable } from "@/lib/ziwei/schools/policy-types";
import { createMonthlyCalculationProvider } from "../../../modules/monthly-flow/create-monthly-calculation-provider";
import { analyzeMonthlyFlow as analyzeMonthlyFlowV1 } from "../../../modules/monthly-flow/analyze";
import type {
  MonthlyCalculationProvider,
  MonthlyFlowMonthResult,
} from "../../../modules/monthly-flow/types";
import { resolveMonthlyFlowProductionRoute } from "../../../modules/monthly-flow/release-policy";
import {
  PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
  POST_CORRECTION_TRUNG_CHAU_TU_HOA,
} from "../policy";
import {
  buildLayerExposure,
  stemIsCorrected,
  withMonthlyExposure,
} from "../exposure";
import { numericDeltaStats, round6 } from "../metrics";
import type { CorrectionExposure } from "../types";

export const MONTHLY_FLOW_V1_SHADOW_LABEL =
  "MONTHLY_FLOW_V1_SHADOW_CANDIDATE_SENSITIVITY" as const;

export interface MonthlyFlowV1Observation {
  caseId: string;
  label: typeof MONTHLY_FLOW_V1_SHADOW_LABEL;
  lunarMonth: number;
  isLeapMonth: boolean;
  monthKey: string;
  preCalendarStem: string;
  postCalendarStem: string;
  preCalendarBranch: string;
  postCalendarBranch: string;
  preFocusPalace: number;
  postFocusPalace: number;
  calendarInvariantOk: boolean;
  exposed: boolean;
  exposure: CorrectionExposure;
  khoaTargetBefore: string | null;
  khoaTargetAfter: string | null;
  preScore: number | null;
  postScore: number | null;
  signedDelta: number;
  absoluteDelta: number;
  preBand: string | null;
  postBand: string | null;
  bandChanged: boolean;
  classification: string;
}

function khoaStar(table: TuHoaTable, stem: string): string | null {
  return getTuHoaTargets(table, stem).find((t) => t.mutagen === "Khoa")?.starName ?? null;
}

function buildPostMonthlyProvider(): MonthlyCalculationProvider {
  const base = createMonthlyCalculationProvider("trung-chau");
  if (!base) throw new Error("TC monthly calculation provider unavailable");
  return {
    school: "trung-chau",
    tuHoaTargets: (stem: string) => getTuHoaTargets(POST_CORRECTION_TRUNG_CHAU_TU_HOA, stem),
    stemBranchForLunarMonth: base.stemBranchForLunarMonth,
  };
}

function buildPreMonthlyProvider(): MonthlyCalculationProvider {
  const base = createMonthlyCalculationProvider("trung-chau");
  if (!base) throw new Error("TC monthly calculation provider unavailable");
  return {
    school: "trung-chau",
    tuHoaTargets: (stem: string) => getTuHoaTargets(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, stem),
    stemBranchForLunarMonth: base.stemBranchForLunarMonth,
  };
}

export function assertTcMonthlyProductionUnavailable(): void {
  const route = resolveMonthlyFlowProductionRoute("trung-chau");
  if (route.available) {
    throw new Error("TC Monthly production unexpectedly available");
  }
  if (route.reason !== "unsupported-school") {
    throw new Error(`Unexpected TC monthly route reason: ${route.reason}`);
  }
}

/**
 * Run V1 shadow PRE vs POST on the same POST chart geometry.
 * Only provider.tuHoaTargets differs; calendar identity must stay invariant.
 */
export function runMonthlyFlowV1ShadowSensitivity(
  caseId: string,
  postChart: ChartData,
): MonthlyFlowV1Observation[] {
  assertTcMonthlyProductionUnavailable();
  const preProvider = buildPreMonthlyProvider();
  const postProvider = buildPostMonthlyProvider();
  const preAnalysis = analyzeMonthlyFlowV1(postChart, {
    school: "trung-chau",
    provider: preProvider,
  });
  const postAnalysis = analyzeMonthlyFlowV1(postChart, {
    school: "trung-chau",
    provider: postProvider,
  });

  const baseExposure = buildLayerExposure({
    natalStem: postChart.yearStem ?? null,
    annualStem: postChart.annualStem ?? null,
    majorStem: postChart.majorFortunePalace?.stem ?? null,
  });

  const postByKey = new Map<string, MonthlyFlowMonthResult>(
    postAnalysis.months.map((m) => [m.identity.monthKey, m]),
  );
  const out: MonthlyFlowV1Observation[] = [];

  for (const preMonth of preAnalysis.months) {
    const postMonth = postByKey.get(preMonth.identity.monthKey);
    if (!postMonth) continue;
    const preId = preMonth.identity;
    const postId = postMonth.identity;
    const calendarInvariantOk =
      preId.calendarStem === postId.calendarStem &&
      preId.calendarBranch === postId.calendarBranch &&
      preId.lunarMonth === postId.lunarMonth &&
      preId.focusPalaceIndex === postId.focusPalaceIndex;

    const exposure = withMonthlyExposure(
      baseExposure,
      preId.lunarMonth,
      preId.calendarStem,
    );
    const exposed = stemIsCorrected(preId.calendarStem);
    const preScore =
      preMonth.overall.status === "available" ? preMonth.overall.score : null;
    const postScore =
      postMonth.overall.status === "available" ? postMonth.overall.score : null;
    const signedDelta =
      preScore == null || postScore == null ? 0 : round6(postScore - preScore);
    const absoluteDelta = Math.abs(signedDelta);
    const preBand =
      preMonth.overall.status === "available" ? preMonth.overall.band : null;
    const postBand =
      postMonth.overall.status === "available" ? postMonth.overall.band : null;

    let classification = "EXPECTED_ANALYSIS_RESPONSE";
    if (!calendarInvariantOk) classification = "UNEXPECTED_DELTA";
    else if (!exposed && absoluteDelta !== 0) classification = "UNEXPECTED_DELTA";
    else if (exposed && absoluteDelta !== 0) classification = "EXPECTED_ANALYSIS_RESPONSE";
    else if (exposed) classification = "PHYSICAL_CORRECTION_PROPAGATION";

    out.push({
      caseId,
      label: MONTHLY_FLOW_V1_SHADOW_LABEL,
      lunarMonth: preId.lunarMonth,
      isLeapMonth: preId.isLeapMonth,
      monthKey: preId.monthKey,
      preCalendarStem: preId.calendarStem,
      postCalendarStem: postId.calendarStem,
      preCalendarBranch: preId.calendarBranch,
      postCalendarBranch: postId.calendarBranch,
      preFocusPalace: preId.focusPalaceIndex,
      postFocusPalace: postId.focusPalaceIndex,
      calendarInvariantOk,
      exposed,
      exposure,
      khoaTargetBefore: khoaStar(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, preId.calendarStem),
      khoaTargetAfter: khoaStar(POST_CORRECTION_TRUNG_CHAU_TU_HOA, postId.calendarStem),
      preScore,
      postScore,
      signedDelta,
      absoluteDelta,
      preBand,
      postBand,
      bandChanged: preBand !== postBand,
      classification,
    });
  }

  return out;
}

export function summarizeMonthlyFlowV1(observations: MonthlyFlowV1Observation[]) {
  const control = observations.filter((o) => !o.exposed);
  const exposed = observations.filter((o) => o.exposed);
  return {
    label: MONTHLY_FLOW_V1_SHADOW_LABEL,
    observations: observations.length,
    exposed: exposed.length,
    changed: observations.filter((o) => o.absoluteDelta !== 0).length,
    controlMaxAbsDelta: Math.max(0, ...control.map((o) => o.absoluteDelta)),
    controlStats: numericDeltaStats(control.map((o) => o.signedDelta)),
    exposedStats: numericDeltaStats(exposed.map((o) => o.signedDelta)),
    allStats: numericDeltaStats(observations.map((o) => o.signedDelta)),
    bandFlips: observations.filter((o) => o.bandChanged).length,
    unexpectedControlDeltas: control.filter((o) => o.absoluteDelta !== 0).length,
    calendarInvariantFailures: observations.filter((o) => !o.calendarInvariantOk).length,
  };
}
