import type { MonthlyFlowV02MonthResult } from "../v0.2/types";
import type { MonthlyFlowV03MonthSummary } from "./types";

export function buildMonthlyFlowV03MonthSummaries(
  months: MonthlyFlowV02MonthResult[]
): MonthlyFlowV03MonthSummary[] {
  return months.map((month) => {
    const monthKey = `${month.calendarStem} ${month.calendarBranch}`;
    
    if (month.status === "unavailable") {
      return {
        status: "unavailable",
        monthKey,
        lunarMonth: month.lunarMonth,
        isLeapMonth: false, // Explicit cast based on contract
        focusPalaceIndex: month.focusPalaceIndex,
        calendarStem: month.calendarStem,
        calendarBranch: month.calendarBranch,
        score: null,
        band: null,
        breakdown: null,
        reasonCodes: [...month.reasonCodes],
        collisionCandidates: [],
      };
    }

    return {
      status: month.status,
      monthKey,
      lunarMonth: month.lunarMonth,
      isLeapMonth: false,
      focusPalaceIndex: month.focusPalaceIndex,
      calendarStem: month.calendarStem,
      calendarBranch: month.calendarBranch,
      score: month.overallMonthlyScore,
      band: month.overallBand,
      breakdown: month.breakdown,
      reasonCodes: [...month.reasonCodes],
      collisionCandidates: month.breakdown.transformations.collisionCandidates || [],
    };
  });
}
