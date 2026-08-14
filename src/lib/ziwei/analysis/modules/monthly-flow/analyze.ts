import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../contracts/annual-axes";
import { loadPalaceOverviewKnowledgeV1 } from "../../knowledge";
import { loadAnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../knowledge/monthly-flow";
import type { DeepReadonly, MonthlyFlowScoringKnowledgeV0 } from "../../knowledge/monthly-flow";
import {
  buildAllAnnualDomainFrames,
  type AnnualDomainFrame,
} from "./collect-annual-domain-frames";
import { collectMonthlyFrame, type MonthlyFrame } from "./collect-monthly-frame";
import { collectStarEvidence } from "./collect-star-evidence";
import { collectMonthlyTransformationEvidence } from "./collect-monthly-transformation-evidence";
import { collectAnnualContextEvidence } from "./collect-annual-context-evidence";
import { collectMajorContextEvidence } from "./collect-major-context-evidence";
import { collectStructuralEvidence } from "./collect-structural-evidence";
import { detectDisabledRules } from "./detect-disabled-rules";
import { auditEvidenceSources } from "./audit-evidence-sources";
import { aggregateMonthlyEvidence } from "./aggregate";
import { normalizeMonthlyFlowAxes, sumWeightedAxes } from "./normalize";
import {
  dedupeMonthlyFlowMonthDiagnostics,
  dedupeMonthlyFlowYearDiagnostics,
  emptyMonthlyFlowMonthDiagnostics,
  emptyMonthlyFlowYearDiagnostics,
  foldMonthDiagnosticsIntoYear,
} from "./diagnostics";
import {
  resolveAnnualDomainMap,
  type AnnualDomainMap,
} from "./resolve-annual-domain-map";
import { resolveMonthContexts } from "./resolve-month-contexts";
import {
  deriveMonthlyFlowConfidence,
  deriveMonthlyFlowCoverage,
} from "./metrics";
import { MONTHLY_FLOW_V1_VERSION } from "./version";
import type {
  ExplicitLeapMonthContext,
  MonthlyCalculationProvider,
  MonthlyFlowAnalysis,
  MonthlyFlowDomainResult,
  MonthlyFlowEvidence,
  MonthlyFlowEvidenceFrame,
  MonthlyFlowMonthCapabilities,
  MonthlyFlowMonthDiagnostics,
  MonthlyFlowMonthResult,
  MonthlyFlowOverallResult,
  MonthlyFlowReasonCode,
  MonthlyFlowScoringScope,
  MonthlyFlowVersionProvenance,
  MonthlyFlowYearDiagnostics,
  ResolvedMonthlyFlowContext,
} from "./types";
import type { MonthlyFlowResolvedDomainContext } from "./resolve-monthly-flow-annual-domains";

const TOP_DRIVER_COUNT = 3;

type MonthlyKnowledge = DeepReadonly<MonthlyFlowScoringKnowledgeV0> | MonthlyFlowScoringKnowledgeV0;
type AnnualKnowledge = {
  mutagenImpact: Parameters<typeof collectAnnualContextEvidence>[0]["annualMutagenImpact"];
};
type NumericKnowledge = Parameters<typeof collectAnnualContextEvidence>[0]["numericKnowledge"];

function topDrivers(
  evidence: MonthlyFlowEvidence[],
  axis: "support" | "pressure",
): MonthlyFlowEvidence[] {
  return evidence
    .filter((item) => item.weightedAxes[axis] > 0)
    .sort((a, b) => b.weightedAxes[axis] - a.weightedAxes[axis])
    .slice(0, TOP_DRIVER_COUNT);
}

function zeroConfidence() {
  return {
    confidencePercent: 0,
    verifiedContributionPercent: 0,
    engineeringContributionPercent: 0,
    experimentalContributionPercent: 0,
  } as const;
}

function unavailableDomainResult(
  domain: AnnualAxisDomain,
  reasonCodes: MonthlyFlowReasonCode[],
  coverage = { coveragePercent: 0, missingComponents: [...reasonCodes] },
): MonthlyFlowDomainResult {
  return {
    domain,
    status: "unavailable",
    score: null,
    band: null,
    coverage,
    confidence: zeroConfidence(),
    evidence: [],
    reasonCodes,
  };
}

function unavailableOverallResult(
  reasonCodes: MonthlyFlowReasonCode[],
): MonthlyFlowOverallResult {
  return {
    status: "unavailable",
    score: null,
    band: null,
    coverage: { coveragePercent: 0, missingComponents: [...reasonCodes] },
    confidence: zeroConfidence(),
    evidence: [],
    reasonCodes,
  };
}

function capabilitiesFor(
  school: ZiweiSchool,
  knowledge: MonthlyKnowledge,
): MonthlyFlowMonthCapabilities {
  const profile = knowledge.schoolCapabilities.profiles[school];
  return {
    supportsMonthlyFocus: profile.supportsMonthlyFocus,
    supportsCalendarStemBranch: profile.supportsCalendarStemBranch,
    supportsMonthlyTransformations: profile.supportsMonthlyTransformations,
    supportsSixAxisOverlayFromCurrentChart: profile.supportsSixAxisOverlayFromCurrentChart,
    supportsLeapMonth: profile.supportsLeapMonth,
  };
}

const EMPTY_CAPABILITIES: MonthlyFlowMonthCapabilities = {
  supportsMonthlyFocus: false,
  supportsCalendarStemBranch: false,
  supportsMonthlyTransformations: false,
  supportsSixAxisOverlayFromCurrentChart: false,
  supportsLeapMonth: "unavailable",
};

function versionProvenance(
  monthlyKnowledge: MonthlyKnowledge | null,
): MonthlyFlowVersionProvenance {
  if (!monthlyKnowledge) {
    return {
      contractVersion: MONTHLY_FLOW_V1_VERSION.contractVersion,
      engineVersion: MONTHLY_FLOW_V1_VERSION.engineVersion,
      scoringKnowledgeVersion: "unavailable",
      capabilityProfileVersion: "unavailable",
      calculationPolicyProfileVersion: null,
    };
  }

  return {
    contractVersion: MONTHLY_FLOW_V1_VERSION.contractVersion,
    engineVersion: MONTHLY_FLOW_V1_VERSION.engineVersion,
    scoringKnowledgeVersion: `${monthlyKnowledge.scoringProfile.profileId}@${monthlyKnowledge.scoringProfile.schemaVersion}`,
    capabilityProfileVersion: `${monthlyKnowledge.schoolCapabilities.catalogId}@${monthlyKnowledge.schoolCapabilities.schemaVersion}`,
    calculationPolicyProfileVersion: null,
  };
}

function findActivationAxes(
  monthlyKnowledge: MonthlyKnowledge,
): { support: 0; pressure: 0; stability: 0; activation: number } {
  const focusMarker = monthlyKnowledge.focusMarkers.records.find(
    (record) => record.frameRole === "focus",
  );
  return {
    support: 0,
    pressure: 0,
    stability: 0,
    activation: focusMarker?.axes.activation ?? 0,
  };
}

interface ScoreEvidenceScopeInput {
  chart: ChartData;
  context: ResolvedMonthlyFlowContext;
  scope: MonthlyFlowScoringScope;
  monthlyFrame: MonthlyFrame;
  scoringFrame: MonthlyFlowEvidenceFrame;
  monthlyKnowledge: MonthlyKnowledge;
  annualKnowledge: AnnualKnowledge;
  numericKnowledge: NumericKnowledge;
  supportsMajorTransformations: boolean;
  monthDiagnostics: MonthlyFlowMonthDiagnostics;
  requiresDomainFrame: boolean;
}

function scoreEvidenceScope(input: ScoreEvidenceScopeInput) {
  const {
    chart,
    context,
    scope,
    monthlyFrame,
    scoringFrame,
    monthlyKnowledge,
    annualKnowledge,
    numericKnowledge,
    supportsMajorTransformations,
    monthDiagnostics,
    requiresDomainFrame,
  } = input;
  const unknownCountBefore = monthDiagnostics.unknownStars.length;
  const activationAxes = findActivationAxes(monthlyKnowledge);

  const candidates: MonthlyFlowEvidence[] = [
    ...collectStarEvidence({
      chart,
      domain: scope,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: scoringFrame,
      numericKnowledge,
      monthDiagnostics,
    }),
    ...collectMonthlyTransformationEvidence({
      chart,
      domain: scope,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: scoringFrame,
      transformations: context.transformations,
      impactCatalog: monthlyKnowledge.transformationImpact,
    }),
    ...collectAnnualContextEvidence({
      chart,
      domain: scope,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: scoringFrame,
      numericKnowledge,
      annualMutagenImpact: annualKnowledge.mutagenImpact,
      monthDiagnostics,
    }),
    ...collectMajorContextEvidence({
      chart,
      domain: scope,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: scoringFrame,
      supportsMajorTransformations,
      annualMutagenImpact: annualKnowledge.mutagenImpact,
      activePalaceActivationAxes: activationAxes,
    }),
    ...collectStructuralEvidence({
      domain: scope,
      monthKey: context.identity.monthKey,
      monthlyFrame,
      annualDomainFrame: scoringFrame,
      focusMarkers: monthlyKnowledge.focusMarkers,
    }),
  ];

  const evidence = aggregateMonthlyEvidence({
    candidates,
    profile: monthlyKnowledge.scoringProfile,
    monthDiagnostics,
  });
  const rawAxes = sumWeightedAxes(evidence);
  const normalized = normalizeMonthlyFlowAxes(rawAxes, monthlyKnowledge.scoringProfile);
  const coverage = deriveMonthlyFlowCoverage({
    hasMonthlyFrame: true,
    starKnowledgeComplete: monthDiagnostics.unknownStars.length === unknownCountBefore,
    transformationsComplete: !context.transformationsPartial,
    requiresDomainFrame,
    hasDomainFrame: true,
  });

  return {
    score: normalized.score,
    band: normalized.band,
    coverage,
    confidence: deriveMonthlyFlowConfidence(evidence, monthlyKnowledge.scoringProfile),
    rawAxes,
    normalizedAxes: normalized.normalizedAxes,
    intensity: normalized.intensity,
    conflict: normalized.conflict,
    evidence,
    topSupportDrivers: topDrivers(evidence, "support"),
    topPressureDrivers: topDrivers(evidence, "pressure"),
  };
}

function scoreOneDomain(
  chart: ChartData,
  context: ResolvedMonthlyFlowContext,
  domain: AnnualAxisDomain,
  monthlyFrame: MonthlyFrame | null,
  domainFrame: AnnualDomainFrame | undefined,
  monthlyKnowledge: MonthlyKnowledge,
  annualKnowledge: AnnualKnowledge,
  numericKnowledge: NumericKnowledge,
  supportsMajorTransformations: boolean,
  monthDiagnostics: MonthlyFlowMonthDiagnostics,
): MonthlyFlowDomainResult {
  if (!monthlyFrame) {
    return unavailableDomainResult(domain, ["missing-monthly-frame-nodes"]);
  }
  if (!domainFrame) {
    return unavailableDomainResult(
      domain,
      ["missing-frame-nodes"],
      deriveMonthlyFlowCoverage({
        hasMonthlyFrame: true,
        starKnowledgeComplete: true,
        transformationsComplete: !context.transformationsPartial,
        requiresDomainFrame: true,
        hasDomainFrame: false,
      }),
    );
  }

  return {
    domain,
    status: "available",
    ...scoreEvidenceScope({
      chart,
      context,
      scope: domain,
      monthlyFrame,
      scoringFrame: domainFrame,
      monthlyKnowledge,
      annualKnowledge,
      numericKnowledge,
      supportsMajorTransformations,
      monthDiagnostics,
      requiresDomainFrame: true,
    }),
  };
}

function buildOverallFrame(monthlyFrame: MonthlyFrame): MonthlyFlowEvidenceFrame {
  return {
    indexSet: monthlyFrame.indexSet,
    roleByIndex: new Map(
      monthlyFrame.nodes.map((node) => [node.palaceIndex, node.role]),
    ),
  };
}

function scoreOverall(
  chart: ChartData,
  context: ResolvedMonthlyFlowContext,
  monthlyFrame: MonthlyFrame | null,
  monthlyKnowledge: MonthlyKnowledge,
  annualKnowledge: AnnualKnowledge,
  numericKnowledge: NumericKnowledge,
  supportsMajorTransformations: boolean,
  monthDiagnostics: MonthlyFlowMonthDiagnostics,
): MonthlyFlowOverallResult {
  if (!monthlyFrame) {
    return unavailableOverallResult(["missing-monthly-frame-nodes"]);
  }

  return {
    status: "available",
    ...scoreEvidenceScope({
      chart,
      context,
      scope: "overall",
      monthlyFrame,
      scoringFrame: buildOverallFrame(monthlyFrame),
      monthlyKnowledge,
      annualKnowledge,
      numericKnowledge,
      supportsMajorTransformations,
      monthDiagnostics,
      requiresDomainFrame: false,
    }),
  };
}

function scoreMonth(
  chart: ChartData,
  context: ResolvedMonthlyFlowContext,
  domainFrames: Map<AnnualAxisDomain, AnnualDomainFrame>,
  hasDomainMap: boolean,
  monthlyKnowledge: MonthlyKnowledge,
  annualKnowledge: AnnualKnowledge,
  numericKnowledge: NumericKnowledge,
  supportsMajorTransformations: boolean,
  yearDiagnostics: MonthlyFlowYearDiagnostics,
): MonthlyFlowMonthResult {
  const monthDiagnostics = emptyMonthlyFlowMonthDiagnostics();
  const monthKey = context.identity.monthKey;

  monthDiagnostics.ambiguousTransformationTargets.push(
    ...context.transformationDiagnostics.ambiguous,
  );
  monthDiagnostics.unresolvedTransformationTargets.push(
    ...context.transformationDiagnostics.unresolved,
  );

  const monthlyFrame = collectMonthlyFrame({
    chart,
    focusPalaceIndex: context.identity.focusPalaceIndex,
    monthKey,
    geometry: monthlyKnowledge.domainDefinitions.monthlyActivationFrame,
    onMissingNode: (detail) => monthDiagnostics.missingMonthlyFrameNodes.push(detail),
  });

  detectDisabledRules({
    chart,
    monthKey,
    monthlyTransformations: context.transformations,
    interactionRules: monthlyKnowledge.interactionRules,
    calendarRelations: monthlyKnowledge.calendarRelations,
    monthDiagnostics,
  });

  const overall = scoreOverall(
    chart,
    context,
    monthlyFrame,
    monthlyKnowledge,
    annualKnowledge,
    numericKnowledge,
    supportsMajorTransformations,
    monthDiagnostics,
  );

  const domains = {} as Record<AnnualAxisDomain, MonthlyFlowDomainResult>;
  const domainStatuses: Array<"available" | "unavailable"> = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const result = hasDomainMap
      ? scoreOneDomain(
          chart,
          context,
          domain,
          monthlyFrame,
          domainFrames.get(domain),
          monthlyKnowledge,
          annualKnowledge,
          numericKnowledge,
          supportsMajorTransformations,
          monthDiagnostics,
        )
      : unavailableDomainResult(
          domain,
          ["incomplete-annual-domain-map"],
          deriveMonthlyFlowCoverage({
            hasMonthlyFrame: monthlyFrame !== null,
            starKnowledgeComplete: true,
            transformationsComplete: !context.transformationsPartial,
            requiresDomainFrame: true,
            hasDomainFrame: false,
          }),
        );
    domains[domain] = result;
    domainStatuses.push(result.status);
  }

  let monthStatus: MonthlyFlowMonthResult["status"] =
    overall.status === "unavailable"
      ? "unavailable"
      : domainStatuses.every((status) => status === "available")
        ? "available"
        : "partial";

  if (context.transformationsPartial && monthStatus === "available") {
    monthStatus = "partial";
  }

  foldMonthDiagnosticsIntoYear(monthDiagnostics, yearDiagnostics);

  return {
    identity: context.identity,
    status: monthStatus,
    overall,
    domains,
    diagnostics: dedupeMonthlyFlowMonthDiagnostics(monthDiagnostics),
  };
}

/**
 * Year availability follows the twelve regular month results. Domain overlay
 * gaps produce `partial`; they do not erase a valid month-wide overall score.
 */
export function resolveYearStatus(
  months: readonly MonthlyFlowMonthResult[],
  diagnostics: MonthlyFlowYearDiagnostics,
): "available" | "partial" | "unavailable" {
  const scoreable = months.filter((month) => month.status !== "unavailable");
  if (scoreable.length === 0) return "unavailable";

  const regular = months.filter((month) => !month.identity.isLeapMonth);
  const regularMonths = new Set(regular.map((month) => month.identity.lunarMonth));
  const hasAllTwelveRegular =
    regular.length === 12 &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((month) => regularMonths.has(month));
  const allRegularAvailable =
    hasAllTwelveRegular && regular.every((month) => month.status === "available");
  const incompleteRegularSet =
    diagnostics.missingMonthlyEntries.length > 0 ||
    diagnostics.duplicateMonthKeys.length > 0 ||
    !hasAllTwelveRegular;

  if (allRegularAvailable && !incompleteRegularSet) return "available";
  return "partial";
}

export interface AnalyzeMonthlyFlowV1Options {
  school: ZiweiSchool;
  provider: MonthlyCalculationProvider;
  yearInCycle?: number;
  explicitLeapContexts?: readonly ExplicitLeapMonthContext[];
  explicitAnnualDomainMap?: ReadonlyMap<number, AnnualAxisDomain>;
  resolvedDomainContext?: MonthlyFlowResolvedDomainContext;
}

/**
 * Deterministic Monthly Flow V1 RC analysis. It consumes physical temporal
 * facts, never previous-module final scores, and keeps month coordinates
 * independent from calendar stem/branch calculation.
 */
export function analyzeMonthlyFlow(
  chart: ChartData,
  options: AnalyzeMonthlyFlowV1Options,
): MonthlyFlowAnalysis {
  const {
    school,
    provider,
    explicitLeapContexts,
    explicitAnnualDomainMap,
    resolvedDomainContext,
  } = options;
  const yearDiagnostics = emptyMonthlyFlowYearDiagnostics();

  yearDiagnostics.missingCalculationPolicyProfile.push(
    "chart:no-calculation-policy-profile-version",
  );

  const monthlyKnowledgeResult = loadMonthlyFlowScoringKnowledgeV0();
  if (!monthlyKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...monthlyKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(null),
      status: "unavailable",
      months: [],
      capabilities: EMPTY_CAPABILITIES,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const monthlyKnowledge = monthlyKnowledgeResult.knowledge;
  const capabilities = capabilitiesFor(school, monthlyKnowledge);

  const annualKnowledgeResult = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...annualKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const annualKnowledge = annualKnowledgeResult.knowledge;

  const numericKnowledgeResult = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...numericKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const numericKnowledge = numericKnowledgeResult.knowledge;

  const majorKnowledgeResult = loadMajorFortuneScoringKnowledgeV0();
  if (!majorKnowledgeResult.ok) {
    yearDiagnostics.invalidKnowledge.push(
      ...majorKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }
  const majorKnowledge = majorKnowledgeResult.knowledge;
  const supportsMajorTransformationsForSchool =
    majorKnowledge.schoolCapabilities.profiles[school].supportsMajorFortuneTransformations;

  const { contexts, rejected } = resolveMonthContexts({
    chart,
    school,
    provider,
    explicitLeapContexts,
    diagnostics: yearDiagnostics,
  });
  if (rejected) {
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }

  const domainMap: AnnualDomainMap | null = resolveAnnualDomainMap({
    chart,
    axisDefinitions: annualKnowledge.axisDefinitions,
    explicitAnnualDomainMap:
      resolvedDomainContext?.primaryDomainByPalaceIndex ?? explicitAnnualDomainMap,
    diagnostics: yearDiagnostics,
  });

  if (resolvedDomainContext) {
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      if (!resolvedDomainContext.focusPalaceIndexByDomain.has(domain)) {
        yearDiagnostics.missingFocusAnchor.push(`domain:${domain}`);
      }
    }
  }

  const domainFrames = domainMap
    ? buildAllAnnualDomainFrames(
        domainMap,
        chart,
        annualKnowledge.axisDefinitions,
        monthlyKnowledge.domainDefinitions.annualDomainFrame,
        yearDiagnostics,
        resolvedDomainContext?.focusPalaceIndexByDomain ?? null,
      )
    : new Map<AnnualAxisDomain, AnnualDomainFrame>();

  if (
    resolvedDomainContext &&
    domainMap &&
    (yearDiagnostics.missingFocusAnchor.length > 0 ||
      yearDiagnostics.focusAnchorDomainMismatch.length > 0 ||
      domainFrames.size !== ANNUAL_AXIS_DOMAINS.length)
  ) {
    return {
      module: "monthly-flow",
      annualYear: chart.annualYear,
      school,
      versions: versionProvenance(monthlyKnowledge),
      status: "unavailable",
      months: [],
      capabilities,
      diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
    };
  }

  if (!capabilities.supportsSixAxisOverlayFromCurrentChart && !explicitAnnualDomainMap) {
    yearDiagnostics.unsupportedSchoolCapability.push(`${school}:six-axis-overlay`);
  }

  const monthResults = contexts.map((context) =>
    scoreMonth(
      chart,
      context,
      domainFrames,
      Boolean(domainMap),
      monthlyKnowledge,
      { mutagenImpact: annualKnowledge.mutagenImpact },
      numericKnowledge,
      supportsMajorTransformationsForSchool,
      yearDiagnostics,
    ),
  );

  for (const month of monthResults) {
    if (month.overall.status === "available") {
      auditEvidenceSources(
        month.overall.evidence,
        {
          monthlyKnowledge,
          palaceKnowledge: numericKnowledge,
          annualKnowledge,
          majorFortuneKnowledge: majorKnowledge,
        },
        month.diagnostics,
      );
    }

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = month.domains[domain];
      if (axis.status !== "available") continue;
      auditEvidenceSources(
        axis.evidence,
        {
          monthlyKnowledge,
          palaceKnowledge: numericKnowledge,
          annualKnowledge,
          majorFortuneKnowledge: majorKnowledge,
        },
        month.diagnostics,
      );
    }
  }

  for (const month of monthResults) {
    yearDiagnostics.missingSourceIds.push(...month.diagnostics.missingSourceIds);
  }

  return {
    module: "monthly-flow",
    annualYear: chart.annualYear,
    school,
    versions: versionProvenance(monthlyKnowledge),
    status: resolveYearStatus(monthResults, yearDiagnostics),
    months: monthResults,
    capabilities,
    diagnostics: dedupeMonthlyFlowYearDiagnostics(yearDiagnostics),
  };
}
