import type { ChartData, School as ZiweiSchool } from "@/types/chart";
import type { AnnualAxesResult } from "../annual-axes/types";

import { analyzeMonthlyFlowProductionV03 } from "./v0.3-production/analyze-production";
import type { MonthlyFlowV03ProductionAnalysis } from "./v0.3-production/types";
export { resolveActualCurrentMonthKey, resolveDefaultSelectedMonthKey } from "./month-selection";

export type MonthlyFlowAnalysis = MonthlyFlowV03ProductionAnalysis;

export interface AnalyzeMonthlyFlowOptions {
  school: ZiweiSchool;
  annualAxesResult?: AnnualAxesResult;
}

import { analyzeMonthlyFlow as analyzeV1 } from "./analyze";
import { createMonthlyCalculationProvider } from "./create-monthly-calculation-provider";

export function analyzeMonthlyFlow(
  chart: ChartData,
  options: AnalyzeMonthlyFlowOptions
): MonthlyFlowAnalysis {
  // 1. Run the legacy V0.3 baseline for production UI.
  const baseline = analyzeMonthlyFlowProductionV03(chart, options);

  // 2. Fire-and-forget the V1 engine in shadow mode.
  try {
    const provider = createMonthlyCalculationProvider(options.school);
    if (provider) {
      analyzeV1(chart, { school: options.school, provider });
      // TODO: Log shadow comparison to a structured telemetry sink in the future.
      // The GO_SHADOW gate guarantees V1 runs successfully.
    }
  } catch (e) {
    // Shadow failures must never break the legacy production return.
    console.warn("[Shadow V1 Monthly Flow Error]", e);
  }

  return baseline;
}
