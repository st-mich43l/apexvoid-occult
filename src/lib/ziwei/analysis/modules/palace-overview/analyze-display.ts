import { isPalaceOverviewV2Enabled } from "../../feature-flags";
import type { ZiweiSchool } from "../../facts";
import type { ChartData } from "@/types/chart";
import { analyzeAllPalaces, type AnalyzeAllPalacesResult } from "./analyze-all-palaces";
import { emptyDiagnostics } from "./collect-evidence";
import { emptySemanticDiagnostics } from "./types";
import { analyzeAllPalacesV2 } from "./v2/analyze";

export function analyzePalaceOverviewDisplay(
  chart: ChartData,
  options: { school: ZiweiSchool },
): AnalyzeAllPalacesResult {
  if (options.school === "nam-phai" && isPalaceOverviewV2Enabled()) {
    const v2 = analyzeAllPalacesV2(chart, options);
    return {
      results: v2.results,
      diagnostics: emptyDiagnostics(),
      knowledgeValid: v2.knowledgeValid,
      knowledgeIssues: v2.knowledgeIssues,
      semanticStatus: "unavailable",
      semanticDiagnostics: emptySemanticDiagnostics(),
    };
  }
  return analyzeAllPalaces(chart, options);
}
