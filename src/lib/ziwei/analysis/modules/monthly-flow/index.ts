export type * from "./types";
export { analyzeMonthlyFlow, resolveYearStatus } from "./analyze";
export { createMonthlyCalculationProvider } from "./create-monthly-calculation-provider";
export {
  resolveMonthlyFlowAnnualDomains,
  derivePrimaryDomainByPalaceIndex,
  deriveFocusPalaceIndexByDomain,
  type MonthlyFlowAnnualDomainAdapterResult,
  type MonthlyFlowAnnualDomainAdapterDiagnostics,
  type MonthlyFlowResolvedDomainContext,
} from "./resolve-monthly-flow-annual-domains";
// legacy v0.1 removed
export {
  analyzeMonthlyFlowProductionV03,
  type MonthlyFlowV03ProductionAnalysis,
  type MonthlyFlowV03MonthSummary,
  type MonthlyFlowV03Diagnostics,
  type AnnualBaselineProvenance,
} from "./v0.3-production";
export { isEligibleNatalPhysicalStar } from "./collect-star-evidence";
export {
  emptyMonthlyFlowMonthDiagnostics,
  emptyMonthlyFlowYearDiagnostics,
  dedupeMonthlyFlowMonthDiagnostics,
  dedupeMonthlyFlowYearDiagnostics,
} from "./diagnostics";
export {
  normalizeMonthlyFlowAxes,
  resolveMonthlyFlowBand,
  sumWeightedAxes as sumMonthlyFlowWeightedAxes,
} from "./normalize";
export { aggregateMonthlyEvidence } from "./aggregate";
export { auditEvidenceSources, collectKnownSourceIds } from "./audit-evidence-sources";
export {
  collectMonthlyFrame,
  type MonthlyFrame,
  type MonthlyFrameNode,
} from "./collect-monthly-frame";
export {
  buildAnnualDomainFrame,
  buildAllAnnualDomainFrames,
  type AnnualDomainFrame,
  type AnnualDomainFrameNode,
} from "./collect-annual-domain-frames";
export { collectStarEvidence as collectMonthlyFlowStarEvidence } from "./collect-star-evidence";
export { collectMonthlyTransformationEvidence } from "./collect-monthly-transformation-evidence";
export { collectAnnualContextEvidence } from "./collect-annual-context-evidence";
export { collectMajorContextEvidence } from "./collect-major-context-evidence";
export { collectStructuralEvidence } from "./collect-structural-evidence";
export { detectDisabledRules } from "./detect-disabled-rules";
export {
  resolveAnnualDomainMap,
  pickAnnualDomainFocusIndex,
  type AnnualDomainMap,
} from "./resolve-annual-domain-map";
export {
  resolveMonthContexts,
  type ResolveMonthContextsInput,
  type ResolveMonthContextsResult,
} from "./resolve-month-contexts";
