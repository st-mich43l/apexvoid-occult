import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";

export interface MonthlyFlowAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type MonthlyFlowBand = "guarded" | "balanced" | "supportive" | "strong";

export type MonthlyFlowEvidenceCategory =
  | "monthly-focus-star"
  | "monthly-transformation"
  | "annual-star-context"
  | "annual-transformation-context"
  | "major-transformation-context"
  | "major-active-palace-context"
  | "structural-activation"
  | "interaction";

export type MonthlyFlowFrameRole = "focus" | "opposite" | "trine" | "outside";
export type MonthlyFlowScoringScope = AnnualAxisDomain | "overall";

export interface MonthlyFlowEvidenceFrame {
  indexSet: ReadonlySet<number>;
  roleByIndex: ReadonlyMap<number, Exclude<MonthlyFlowFrameRole, "outside">>;
}

export type MonthlyFlowReasonCode =
  | "invalid-knowledge"
  | "provider-school-mismatch"
  | "missing-month-context"
  | "missing-frame-nodes"
  | "missing-focus-palace"
  | "missing-calendar-stem-branch"
  | "missing-monthly-frame-nodes"
  | "incomplete-annual-domain-map"
  | "unsupported-school-capability"
  | "duplicate-month-key"
  | "invalid-month-number"
  | "monthly-frame"
  | "star-knowledge"
  | "monthly-transformations"
  | "annual-domain-frame";

export interface MonthlyFlowEvidence {
  id: string;
  domain: MonthlyFlowScoringScope;
  monthKey: string;
  category: MonthlyFlowEvidenceCategory;
  physicalFactId: string;
  ruleId: string;
  targetPalaceIndex: number;
  targetNatalPalaceName: string;
  targetAnnualPalaceName: string | null;
  monthlyFrameRole: MonthlyFlowFrameRole;
  annualDomainRole: MonthlyFlowFrameRole;
  stackingGroup: string;
  rawAxes: MonthlyFlowAxes;
  effectiveWeight: number;
  weightedAxes: MonthlyFlowAxes;
  factIds: string[];
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

export interface MonthlyFlowCoverage {
  coveragePercent: number;
  missingComponents: MonthlyFlowReasonCode[];
}

export interface MonthlyFlowConfidence {
  confidencePercent: number;
  verifiedContributionPercent: number;
  engineeringContributionPercent: number;
  experimentalContributionPercent: number;
}

export type MonthlyFlowDomainResult =
  | {
      domain: AnnualAxisDomain;
      status: "available";
      score: number;
      band: MonthlyFlowBand;
      coverage: MonthlyFlowCoverage;
      confidence: MonthlyFlowConfidence;
      rawAxes: MonthlyFlowAxes;
      normalizedAxes: MonthlyFlowAxes;
      intensity: number;
      conflict: number;
      evidence: MonthlyFlowEvidence[];
      topSupportDrivers: MonthlyFlowEvidence[];
      topPressureDrivers: MonthlyFlowEvidence[];
    }
  | {
      domain: AnnualAxisDomain;
      status: "unavailable";
      score: null;
      band: null;
      coverage: MonthlyFlowCoverage;
      confidence: MonthlyFlowConfidence;
      evidence: [];
      reasonCodes: MonthlyFlowReasonCode[];
    };

export type MonthlyFlowOverallResult =
  | {
      status: "available";
      score: number;
      band: MonthlyFlowBand;
      coverage: MonthlyFlowCoverage;
      confidence: MonthlyFlowConfidence;
      rawAxes: MonthlyFlowAxes;
      normalizedAxes: MonthlyFlowAxes;
      intensity: number;
      conflict: number;
      evidence: MonthlyFlowEvidence[];
      topSupportDrivers: MonthlyFlowEvidence[];
      topPressureDrivers: MonthlyFlowEvidence[];
    }
  | {
      status: "unavailable";
      score: null;
      band: null;
      coverage: MonthlyFlowCoverage;
      confidence: MonthlyFlowConfidence;
      evidence: [];
      reasonCodes: MonthlyFlowReasonCode[];
    };

export interface MonthlyFlowMonthCapabilities {
  supportsMonthlyFocus: boolean;
  supportsCalendarStemBranch: boolean;
  supportsMonthlyTransformations: boolean;
  supportsSixAxisOverlayFromCurrentChart: boolean;
  supportsLeapMonth: string;
}

export interface MonthlyFlowMonthDiagnostics {
  missingFocusPalace: string[];
  missingCalendarStemBranch: string[];
  missingMonthlyFrameNodes: string[];
  ambiguousTransformationTargets: string[];
  unresolvedTransformationTargets: string[];
  unknownStars: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  disabledCalendarRelationHits: string[];
  missingSourceIds: string[];
}

export interface MonthlyFlowYearDiagnostics {
  invalidKnowledge: string[];
  providerSchoolMismatch: string[];
  missingMonthlyEntries: string[];
  duplicateMonthKeys: string[];
  invalidMonthNumber: string[];
  missingFocusPalace: string[];
  missingCalendarStemBranch: string[];
  missingMonthlyFrameNodes: string[];
  incompleteAnnualDomainLabels: string[];
  duplicateAnnualDomainLabels: string[];
  unknownStars: string[];
  ambiguousTransformationTargets: string[];
  unresolvedTransformationTargets: string[];
  forbiddenPreviousScores: string[];
  forbiddenMovingStarInputs: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  disabledCalendarRelationHits: string[];
  missingSourceIds: string[];
  missingCalculationPolicyProfile: string[];
  unsupportedSchoolCapability: string[];
  leapMonthPolicyUnavailable: string[];
  missingFocusAnchor: string[];
  focusAnchorDomainMismatch: string[];
  productionFocusFallbackUsed: string[];
}

export interface MonthlyFlowMonthIdentity {
  annualYear: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  monthKey: string;
  focusPalaceIndex: number;
  calendarStem: string;
  calendarBranch: string;
}

export interface MonthlyFlowMonthResult {
  identity: MonthlyFlowMonthIdentity;
  status: "available" | "partial" | "unavailable";
  overall: MonthlyFlowOverallResult;
  domains: Record<AnnualAxisDomain, MonthlyFlowDomainResult>;
  diagnostics: MonthlyFlowMonthDiagnostics;
}

export interface MonthlyFlowVersionProvenance {
  contractVersion: string;
  engineVersion: string;
  scoringKnowledgeVersion: string;
  capabilityProfileVersion: string;
  calculationPolicyProfileVersion: string | null;
}

export interface MonthlyFlowAnalysis {
  module: "monthly-flow";
  annualYear: number;
  school: ZiweiSchool;
  versions: MonthlyFlowVersionProvenance;
  status: "available" | "partial" | "unavailable";
  months: MonthlyFlowMonthResult[];
  capabilities: MonthlyFlowMonthCapabilities;
  diagnostics: MonthlyFlowYearDiagnostics;
}

export interface MonthlyCalculationProvider {
  school: ZiweiSchool;
  tuHoaTargets(stem: string): Array<{ mutagen: string; starName: string }>;
  stemBranchForLunarMonth(
    yearStem: string,
    lunarMonth: number,
  ): { stem: string; branch: string };
}

export interface ResolvedMonthlyTransformation {
  mutagen: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  starName: string;
  canonicalStarName: string;
  targetPalaceIndex: number;
  targetNatalPalaceName: string;
}

export interface ResolvedMonthlyFlowContext {
  identity: MonthlyFlowMonthIdentity;
  transformations: readonly ResolvedMonthlyTransformation[];
  transformationsPartial: boolean;
  transformationDiagnostics: {
    ambiguous: readonly string[];
    unresolved: readonly string[];
  };
}

export interface ExplicitLeapMonthContext {
  lunarMonth: number;
  focusPalaceIndex: number;
  calendarStem: string;
  calendarBranch: string;
}

export function emptyMonthlyFlowAxes(): MonthlyFlowAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function addMonthlyFlowAxes(
  a: MonthlyFlowAxes,
  b: MonthlyFlowAxes,
): MonthlyFlowAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function scaleMonthlyFlowAxes(
  axes: MonthlyFlowAxes,
  factor: number,
): MonthlyFlowAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function emptyMonthlyFlowMonthDiagnostics(): MonthlyFlowMonthDiagnostics {
  return {
    missingFocusPalace: [],
    missingCalendarStemBranch: [],
    missingMonthlyFrameNodes: [],
    ambiguousTransformationTargets: [],
    unresolvedTransformationTargets: [],
    unknownStars: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    disabledCalendarRelationHits: [],
    missingSourceIds: [],
  };
}

export function emptyMonthlyFlowYearDiagnostics(): MonthlyFlowYearDiagnostics {
  return {
    invalidKnowledge: [],
    providerSchoolMismatch: [],
    missingMonthlyEntries: [],
    duplicateMonthKeys: [],
    invalidMonthNumber: [],
    missingFocusPalace: [],
    missingCalendarStemBranch: [],
    missingMonthlyFrameNodes: [],
    incompleteAnnualDomainLabels: [],
    duplicateAnnualDomainLabels: [],
    unknownStars: [],
    ambiguousTransformationTargets: [],
    unresolvedTransformationTargets: [],
    forbiddenPreviousScores: [],
    forbiddenMovingStarInputs: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    disabledCalendarRelationHits: [],
    missingSourceIds: [],
    missingCalculationPolicyProfile: [],
    unsupportedSchoolCapability: [],
    leapMonthPolicyUnavailable: [],
    missingFocusAnchor: [],
    focusAnchorDomainMismatch: [],
    productionFocusFallbackUsed: [],
  };
}
