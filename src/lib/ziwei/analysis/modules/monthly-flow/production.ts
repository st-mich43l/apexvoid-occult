import type { ChartData, School as ZiweiSchool } from "@/types/chart";
import type { AnnualAxesResult } from "../annual-axes/types";

import { analyzeMonthlyFlowProductionV03 } from "./v0.3-production/analyze-production";
import type { MonthlyFlowV03ProductionAnalysis } from "./v0.3-production/types";
import {
  resolveMonthlyFlowProductionRoute,
  type MonthlyFlowProductionUnavailableReason,
} from "./release-policy";

export { resolveActualCurrentMonthKey, resolveDefaultSelectedMonthKey } from "./month-selection";
export {
  resolveMonthlyFlowProductionRoute,
  type MonthlyFlowProductionRoute,
  type MonthlyFlowProductionUnavailableReason,
} from "./release-policy";

/**
 * Stable production contract. V1 RC1 remains shadow-only via explicit tooling.
 * Release routing is owned by release-policy.ts (Nam Phái V0.3 only).
 */
export interface MonthlyFlowUnavailableProductionAnalysis {
  module: "monthly-flow";
  school: ZiweiSchool;
  status: "unavailable";
  version: null;
  annualYear: number | null;
  monthSummaries: [];
  annualBaseline: null;
  releaseReason: MonthlyFlowProductionUnavailableReason;
}

export type MonthlyFlowAnalysis =
  | MonthlyFlowV03ProductionAnalysis
  | MonthlyFlowUnavailableProductionAnalysis;

export interface AnalyzeMonthlyFlowOptions {
  school: ZiweiSchool;
  annualAxesResult?: AnnualAxesResult;
}

function unavailableProductionAnalysis(
  chart: ChartData,
  school: ZiweiSchool,
  reason: MonthlyFlowProductionUnavailableReason,
): MonthlyFlowUnavailableProductionAnalysis {
  return {
    module: "monthly-flow",
    school,
    status: "unavailable",
    version: null,
    annualYear: chart.annualYear ?? null,
    monthSummaries: [],
    annualBaseline: null,
    releaseReason: reason,
  };
}

export function analyzeMonthlyFlow(
  chart: ChartData,
  options: AnalyzeMonthlyFlowOptions,
): MonthlyFlowAnalysis {
  const route = resolveMonthlyFlowProductionRoute(options.school);
  if (!route.available) {
    return unavailableProductionAnalysis(chart, route.school, route.reason);
  }

  return analyzeMonthlyFlowProductionV03(chart, {
    school: "nam-phai",
    annualAxesResult: options.annualAxesResult,
  });
}
