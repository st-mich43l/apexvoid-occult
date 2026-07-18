import type { ZiweiSchool } from "../../facts";
import type { MajorFortuneDomain } from "../../contracts/major-fortune";

export interface MajorFortuneAxes {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export type MajorFortuneBand = "guarded" | "balanced" | "supportive" | "strong";

export type MajorFortuneScope = "overall" | "domain";

export type MajorFortuneEvidenceCategory =
  | "star"
  | "transformation"
  | "structural-activation"
  | "interaction";

export type MajorFortuneFrameRole = "focus" | "opposite" | "trine";

export interface MajorFortuneEvidence {
  id: string;
  scope: MajorFortuneScope;
  domainId: MajorFortuneDomain | null;
  category: MajorFortuneEvidenceCategory;
  /** Layer-independent identity of the underlying physical fact (star/transformation/marker). */
  physicalFactId: string;
  ruleId: string;
  targetPalaceIndex: number;
  targetNatalPalaceName: string;
  /** The target palace's own resolved Major Fortune ("trùng bài") label —
   * distinct from the natal name and from the frame's own anchor label.
   * Null when the school/chart never resolves majorPalaceName. */
  targetMajorPalaceName: string | null;
  frameRole: MajorFortuneFrameRole;
  /** Diminishing-return competition group within the same scope+domain+
   * evidence-layer (e.g. a minor-star family id, "major-star",
   * "major-transformation", "structural-activation"). */
  stackingGroup: string;
  rawAxes: MajorFortuneAxes;
  effectiveWeight: number;
  weightedAxes: MajorFortuneAxes;
  factIds: string[];
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

export type MajorFortuneAxisResult =
  | {
      status: "available";
      score: number;
      band: MajorFortuneBand;
      rawAxes: MajorFortuneAxes;
      normalizedAxes: MajorFortuneAxes;
      intensity: number;
      conflict: number;
      evidence: MajorFortuneEvidence[];
      topSupportDrivers: MajorFortuneEvidence[];
      topPressureDrivers: MajorFortuneEvidence[];
    }
  | {
      status: "unavailable";
      score: null;
      band: null;
      evidence: [];
      reasonCodes: string[];
    };

export interface MajorFortuneCapabilities {
  supportsOverallFrame: boolean;
  supportsTwelveDomainOverlay: boolean;
  supportsMajorFortuneTransformations: boolean;
}

export interface MajorFortuneDiagnostics {
  invalidKnowledge: string[];
  invalidResolvedContext: string[];
  noActiveMajorFortune: string[];
  incompleteMajorPalaceLabels: string[];
  duplicateMajorPalaceLabels: string[];
  missingFrameNodes: string[];
  unknownStars: string[];
  unresolvedTransformationTargets: string[];
  forbiddenSchoolTransformations: string[];
  forbiddenAnnualFacts: string[];
  duplicatePhysicalFacts: string[];
  disabledInteractionHits: string[];
  missingSourceIds: string[];
  unsupportedSchoolCapability: string[];
}

export interface MajorFortuneScoringResult {
  module: "major-fortune";
  school: ZiweiSchool;
  cycle: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  } | null;
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
    policyProfileVersion: string;
  };
  status: "available" | "partial" | "unavailable";
  overall: MajorFortuneAxisResult;
  domainsStatus: "available" | "unavailable";
  domains: Partial<Record<MajorFortuneDomain, MajorFortuneAxisResult>>;
  capabilities: MajorFortuneCapabilities;
  diagnostics: MajorFortuneDiagnostics;
  /** Entry/core/exit metadata only — never influences numeric output.
   * Present only when the caller supplies `yearInCycle`. */
  periodPhase: { phaseId: string } | null;
}

export function emptyMajorFortuneAxes(): MajorFortuneAxes {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

export function addMajorFortuneAxes(a: MajorFortuneAxes, b: MajorFortuneAxes): MajorFortuneAxes {
  return {
    support: a.support + b.support,
    pressure: a.pressure + b.pressure,
    stability: a.stability + b.stability,
    activation: a.activation + b.activation,
  };
}

export function scaleMajorFortuneAxes(axes: MajorFortuneAxes, factor: number): MajorFortuneAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

export function emptyMajorFortuneDiagnostics(): MajorFortuneDiagnostics {
  return {
    invalidKnowledge: [],
    invalidResolvedContext: [],
    noActiveMajorFortune: [],
    incompleteMajorPalaceLabels: [],
    duplicateMajorPalaceLabels: [],
    missingFrameNodes: [],
    unknownStars: [],
    unresolvedTransformationTargets: [],
    forbiddenSchoolTransformations: [],
    forbiddenAnnualFacts: [],
    duplicatePhysicalFacts: [],
    disabledInteractionHits: [],
    missingSourceIds: [],
    unsupportedSchoolCapability: [],
  };
}
