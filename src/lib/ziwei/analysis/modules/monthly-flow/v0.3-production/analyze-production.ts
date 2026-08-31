import type { ChartData, School as ZiweiSchool } from "@/types/chart";
import type { AnnualAxesResult } from "../../annual-axes/types";

import { createMonthlyCalculationProvider } from "../create-monthly-calculation-provider";
import { buildV02Result } from "../v0.2/resolve-month-contexts";
import { deriveAnnualBaseline } from "./derive-annual-baseline";
import { buildMonthlyFlowV03MonthSummaries } from "./month-summaries";
import type { MonthlyFlowV03Diagnostics, MonthlyFlowV03ProductionAnalysis } from "./types";
import type { MonthlyFlowYearDiagnostics } from "../types";

export function analyzeMonthlyFlowProductionV03(
  chart: ChartData,
  options: {
    school: ZiweiSchool;
    annualAxesResult?: AnnualAxesResult;
  }
): MonthlyFlowV03ProductionAnalysis {
  const { school, annualAxesResult } = options;

  const diagnostics: MonthlyFlowV03Diagnostics = {
    providerUnavailable: false,
    providerSchoolMismatch: [],
    invalidKnowledge: [],
    engineStatus: "unavailable",
    notes: [],
    unresolvedTransformationTargets: [],
    ambiguousTransformationTargets: []
  };

  const provider = createMonthlyCalculationProvider(school);
  if (!provider) {
    diagnostics.providerUnavailable = true;
    return {
      module: "monthly-flow",
      version: "0.3.0",
      engine: "event-driven",
      school: "nam-phai",
      annualYear: chart.annualYear ?? 0,
      status: "unavailable",
      annualBaseline: null,
      monthSummaries: [],
      diagnostics
    };
  }

  if (provider.school !== school) {
    diagnostics.providerSchoolMismatch.push(`requested=${school};provider=${provider.school}`);
    return {
      module: "monthly-flow",
      version: "0.3.0",
      engine: "event-driven",
      school: "nam-phai",
      annualYear: chart.annualYear ?? 0,
      status: "unavailable",
      annualBaseline: null,
      monthSummaries: [],
      diagnostics
    };
  }

  const resolvedAnnualAxesResult = annualAxesResult || (chart as any).annualAxesResult;
  if (!resolvedAnnualAxesResult) return { module: "monthly-flow", version: "0.3.0", engine: "event-driven", school: "nam-phai", annualYear: chart.annualYear ?? null, status: "unavailable", annualBaseline: null, monthSummaries: [], diagnostics };

  const annualBaseline = deriveAnnualBaseline(resolvedAnnualAxesResult);
  const fullDiagnostics = Object.assign(
    {
      missingMonthlyEntries: [],
      duplicateMonthKeys: [],
      invalidMonthNumber: [],
      missingFocusPalace: [],
      missingCalendarStemBranch: [],
      missingMonthlyFrameNodes: [],
      incompleteAnnualDomainLabels: [],
      duplicateAnnualDomainLabels: [],
      unknownStars: [],
      forbiddenPreviousScores: [],
      forbiddenMovingStarInputs: [],
      duplicatePhysicalFacts: [],
    },
    diagnostics
  ) as any as MonthlyFlowYearDiagnostics & MonthlyFlowV03Diagnostics;

  const engineResult = buildV02Result({
    chart,
    annualBaseline: annualBaseline ? {
      status: resolvedAnnualAxesResult?.status === "partial-data" ? "partial" : "resolved",
      score: annualBaseline.score,
      sourceModule: annualBaseline.sourceModule,
      sourceContractVersion: annualBaseline.sourceContractVersion,
      sourceEngineVersion: annualBaseline.sourceEngineVersion
    } : null,
    provider,
    diagnostics: fullDiagnostics
  });

  diagnostics.engineStatus = engineResult.status;

  if (engineResult.months.length > 0) {
    // Just collect diagnostics from the first month as they share year-level context in V0.2
    const firstMonth = engineResult.months[0];
    if (firstMonth && "diagnostics" in firstMonth && firstMonth.diagnostics) {
      diagnostics.unresolvedTransformationTargets = firstMonth.diagnostics.unresolvedTransformationTargets || [];
      diagnostics.ambiguousTransformationTargets = firstMonth.diagnostics.ambiguousTransformationTargets || [];
    }
  }

  const monthSummaries = buildMonthlyFlowV03MonthSummaries(engineResult.months);

  return {
    module: "monthly-flow",
    version: "0.3.0",
    engine: "event-driven",
    school: "nam-phai",
    annualYear: engineResult.annualYear,
    status: engineResult.status,
    annualBaseline,
    monthSummaries,
    diagnostics
  };
}
