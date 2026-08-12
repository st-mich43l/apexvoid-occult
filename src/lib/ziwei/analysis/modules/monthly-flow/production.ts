import type { ChartData, School as ZiweiSchool } from "@/types/chart";
import type { AnnualAxesResult } from "../annual-axes/types";

import { analyzeMonthlyFlowProductionV03 } from "./v0.3-production/analyze-production";
import type { MonthlyFlowV03ProductionAnalysis } from "./v0.3-production/types";
export { resolveActualCurrentMonthKey, resolveDefaultSelectedMonthKey } from "./v0.3-production/resolve-default-month";

export type MonthlyFlowAnalysis = MonthlyFlowV03ProductionAnalysis;

export interface AnalyzeMonthlyFlowOptions {
  school: ZiweiSchool;
  annualAxesResult?: AnnualAxesResult;
}

export function analyzeMonthlyFlow(
  chart: ChartData,
  options: AnalyzeMonthlyFlowOptions
): MonthlyFlowAnalysis {
  return analyzeMonthlyFlowProductionV03(chart, options);
}
