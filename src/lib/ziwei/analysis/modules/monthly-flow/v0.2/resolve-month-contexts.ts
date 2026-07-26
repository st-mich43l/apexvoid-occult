import type { ChartData } from "@/types/chart";
import type {
  MonthlyFlowV02MonthResult,
  MonthlyFlowV02Result,
  AnnualBaselineInput,
  MonthlyDomainProjection,
  MonthlyFlowBand,
  MonthlyFlowV021Input,
  MonthlyFlowResolutionStatus,
  MonthlyFlowV02ReasonCode,
  MonthlyAnnualContext
} from "./types";
import { scoreMonth } from "./score-month";
import { evaluatePalace } from "./evaluate-palace";
import { resolveTransformations } from "./resolve-transformations";
import { validateAnnualBaseline } from "./validate-annual-baseline";
import { resolveMonthContexts } from "../resolve-month-contexts";
import type { MonthlyCalculationProvider, MonthlyFlowYearDiagnostics } from "../types";

export interface ResolveMonthlyFlowV02Input {
  chart: ChartData;
  annualBaseline: AnnualBaselineInput | null;
  provider: MonthlyCalculationProvider; // injected
  diagnostics: MonthlyFlowYearDiagnostics; // injected
}

function getBand(score: number): MonthlyFlowBand {
  if (score > 75) return "breakthrough";
  if (score >= 55) return "favorable";
  if (score >= 45) return "stable";
  if (score >= 25) return "obstructed";
  return "alert";
}

export function buildV02Result(input: ResolveMonthlyFlowV02Input): MonthlyFlowV02Result {
  const baselineValidation = validateAnnualBaseline(input.annualBaseline);
  let yearStatus: MonthlyFlowResolutionStatus = baselineValidation.status === "unavailable" ? "unavailable" : "resolved";
  const yearReasonCodes = new Set<MonthlyFlowV02ReasonCode>(baselineValidation.reasonCodes);

  const annualYear = input.chart.annualYear ?? 0;
  const annualStem = input.chart.annualStem ?? "";
  const annualBranch = input.chart.annualBranch ?? "";
  const annualHeadPalace = input.chart.annualHeadPalace?.index ?? null;
  const smallLimitPalace = input.chart.smallLimitPalace?.index ?? null;
  const taiTuePalace = input.chart.taiTuePalace?.index ?? null;
  const monthStartPalace = input.chart.monthStartPalace?.index ?? null;

  if (yearStatus === "unavailable") {
    return {
      status: "unavailable",
      reasonCodes: Array.from(yearReasonCodes),
      annualYear,
      annualStem,
      annualBranch,
      months: []
    };
  }

  // 1. Resolve Canonical Coordinates
  const canonicalContexts = resolveMonthContexts({
    chart: input.chart,
    school: "nam-phai",
    provider: input.provider,
    diagnostics: input.diagnostics
  });

  if (canonicalContexts.rejected || canonicalContexts.contexts.length !== 12) {
    yearReasonCodes.add("canonical-context-unavailable");
    return {
      status: "partial",
      reasonCodes: Array.from(yearReasonCodes),
      annualScoreSource: input.annualBaseline!,
      annualYear,
      annualStem,
      annualBranch,
      months: []
    };
  }

  const months: MonthlyFlowV02MonthResult[] = [];
  
  const annualContext: MonthlyAnnualContext = {
    annualHeadPalaceIndex: annualHeadPalace,
    smallLimitPalaceIndex: smallLimitPalace,
    taiTuePalaceIndex: taiTuePalace,
    annualHeadStatus: annualHeadPalace !== null ? "resolved" : "unavailable",
    smallLimitStatus: smallLimitPalace !== null ? "resolved" : "unavailable",
    taiTueStatus: taiTuePalace !== null ? "resolved" : "unavailable",
  };

  if (annualContext.annualHeadStatus === "unavailable") {
    yearReasonCodes.add("annual-head-unavailable");
    yearStatus = "partial"; // Provenance missing doesn't break the whole engine but marks it partial
  }

  for (const ctx of canonicalContexts.contexts) {
    let monthStatus: MonthlyFlowResolutionStatus = "resolved";
    const monthReasonCodes = new Set<MonthlyFlowV02ReasonCode>();
    
    if (annualContext.annualHeadStatus === "unavailable") {
      monthStatus = "partial";
      monthReasonCodes.add("annual-head-unavailable");
    }

    const focusPalaceIndex = ctx.identity.focusPalaceIndex;
    const isDauQuanMonth = monthStartPalace !== null ? focusPalaceIndex === monthStartPalace : false;
    if (monthStartPalace === null) {
      monthReasonCodes.add("dau-quan-anchor-unavailable");
    }
    
    // Evaluate Palace
    const targetPalace = input.chart.palaces.find(p => p.index === focusPalaceIndex);
    if (!targetPalace) {
      monthStatus = "unavailable";
      monthReasonCodes.add("focus-palace-unavailable");

      months.push({
        status: "unavailable",
        reasonCodes: Array.from(monthReasonCodes),
        diagnostics: {
          unresolvedTransformationTargets: [...(ctx.transformationDiagnostics?.unresolved || [])],
          ambiguousTransformationTargets: [...(ctx.transformationDiagnostics?.ambiguous || [])]
        },
        monthIndex: ctx.identity.lunarMonth,
        lunarMonth: ctx.identity.lunarMonth,
        isLeapMonth: ctx.identity.isLeapMonth,
        calendarStem: ctx.identity.calendarStem,
        calendarBranch: ctx.identity.calendarBranch,
        focusPalaceIndex,
        provenance: {
          annualHeadPalace,
          smallLimitPalace,
          taiTuePalace
        },
        overallMonthlyScore: null,
        overallBand: null,
        breakdown: null,
        domainProjections: []
      });

      monthReasonCodes.forEach(c => yearReasonCodes.add(c));
      continue;
    }

    const evaluated = targetPalace ? evaluatePalace(targetPalace, input.chart.menhElement) : null;
    const palaceRawDelta = evaluated ? evaluated.rawDelta : 0;

    if (evaluated && evaluated.status !== "resolved") {
      if (evaluated.status === "unavailable") monthStatus = "unavailable";
      else monthStatus = "partial";
      evaluated.reasonCodes.forEach(c => monthReasonCodes.add(c));
    }
    
    // Tứ Hóa Event Triggers (using canonical facts)
    const resolvedT = resolveTransformations({
      chart: input.chart,
      canonicalTransformations: ctx.transformations,
      focusPalaceIndex,
      unresolvedTargets: [...(ctx.transformationDiagnostics?.unresolved || [])],
      ambiguousTargets: [...(ctx.transformationDiagnostics?.ambiguous || [])]
    });

    if (resolvedT.resolutionStatus !== "resolved") {
      if (monthStatus !== "unavailable") monthStatus = "partial";
      monthReasonCodes.add("monthly-transformations-partial");
      
      if (resolvedT.unresolvedTargets.length > 0) monthReasonCodes.add("monthly-transformation-target-unresolved");
      if (resolvedT.ambiguousTargets.length > 0) monthReasonCodes.add("monthly-transformation-target-ambiguous");
      if (resolvedT.collisionCandidates.length > 0) monthReasonCodes.add("ji-collision-policy-pending");
    }
    
    const v021Input: MonthlyFlowV021Input = {
      annualBaseline: input.annualBaseline!,
      focusPalaceFacts: {
        focusPalaceIndex: ctx.identity.focusPalaceIndex,
        lunarMonth: ctx.identity.lunarMonth,
        isLeapMonth: ctx.identity.isLeapMonth,
        calendarStem: ctx.identity.calendarStem,
        calendarBranch: ctx.identity.calendarBranch
      },
      annualContext,
      transformationContext: resolvedT,
      isDauQuanMonth,
      palaceRawDelta
    };

    const breakdown = scoreMonth(v021Input);
    const finalScore = breakdown.finalMonthlyScore;

    const domainProjections: MonthlyDomainProjection[] = [];

    const monthObj: MonthlyFlowV02MonthResult = monthStatus === "unavailable" ? {
      status: "unavailable",
      reasonCodes: Array.from(monthReasonCodes),
      diagnostics: {
        unresolvedTransformationTargets: [...resolvedT.unresolvedTargets],
        ambiguousTransformationTargets: [...resolvedT.ambiguousTargets]
      },
      monthIndex: ctx.identity.lunarMonth,
      lunarMonth: ctx.identity.lunarMonth,
      isLeapMonth: ctx.identity.isLeapMonth,
      calendarStem: ctx.identity.calendarStem,
      calendarBranch: ctx.identity.calendarBranch,
      focusPalaceIndex,
      provenance: {
        annualHeadPalace,
        smallLimitPalace,
        taiTuePalace
      },
      overallMonthlyScore: null,
      overallBand: null,
      breakdown: null,
      domainProjections: []
    } : {
      status: monthStatus as "resolved" | "partial",
      reasonCodes: Array.from(monthReasonCodes),
      diagnostics: {
        unresolvedTransformationTargets: [...resolvedT.unresolvedTargets],
        ambiguousTransformationTargets: [...resolvedT.ambiguousTargets]
      },
      monthIndex: ctx.identity.lunarMonth,
      lunarMonth: ctx.identity.lunarMonth,
      isLeapMonth: ctx.identity.isLeapMonth,
      calendarStem: ctx.identity.calendarStem,
      calendarBranch: ctx.identity.calendarBranch,
      focusPalaceIndex,
      provenance: {
        annualHeadPalace,
        smallLimitPalace,
        taiTuePalace
      },
      overallMonthlyScore: finalScore,
      overallBand: getBand(finalScore),
      breakdown,
      domainProjections
    };

    months.push(monthObj);
    monthReasonCodes.forEach(c => yearReasonCodes.add(c));
  }

  const scoredMonths = months.filter(m => m.status === "resolved" || m.status === "partial").length;
  const partialOrUnavailableCount = months.filter(m => m.status !== "resolved").length;

  if (baselineValidation.status === "unavailable" || scoredMonths === 0) {
    yearStatus = "unavailable";
  } else if (partialOrUnavailableCount > 0 || baselineValidation.status === "partial") {
    yearStatus = "partial";
  } else {
    yearStatus = "resolved";
  }

  return {
    status: yearStatus,
    reasonCodes: Array.from(yearReasonCodes),
    annualScoreSource: input.annualBaseline!,
    annualYear,
    annualStem,
    annualBranch,
    months
  };
}
