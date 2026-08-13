import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import type { ZiweiSchool } from "../../../facts";

export type MajorFortuneEngineVersion = "1.0.0-rc.1";

export interface MajorFortuneV1Context {
  school: ZiweiSchool;
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalace: ChartPalace;
  chart: ChartData;
}

export interface MajorFortuneV1Node {
  palaceIndex: number;
  branch: string;
  stem?: string;
  natalPalaceName: string;
  role: "focus" | "opposite" | "trine-1" | "trine-2";
  isVCD: boolean;
  principalStars: ChartStar[];
  auxiliaryStars: ChartStar[];
}

export interface MajorFortuneV1Frame {
  context: MajorFortuneV1Context;
  focusNode: MajorFortuneV1Node;
  oppositeNode: MajorFortuneV1Node;
  trine1Node: MajorFortuneV1Node;
  trine2Node: MajorFortuneV1Node;
  majorMutagens: MutagenRecord[];
}

export interface BaseFact {
  type: string;
}

export interface PrincipalStarFact extends BaseFact {
  type: "principal-star";
  starName: string;
  palaceIndex: number;
  dignity?: string;
}

export interface AuxiliaryStarFact extends BaseFact {
  type: "auxiliary-star";
  starName: string;
  palaceIndex: number;
}

export interface MaleficStarFact extends BaseFact {
  type: "malefic-star";
  starName: string;
  palaceIndex: number;
}

export interface TransformationFact extends BaseFact {
  type: "transformation";
  starName: string;
  transformation: string; // "Lộc" | "Quyền" | "Khoa" | "Kỵ"
  palaceIndex: number;
}

export interface StructuralFact extends BaseFact {
  type: "structural";
  marker: string;
  palaceIndex: number;
}

export type MajorFortuneV1Fact =
  | PrincipalStarFact
  | AuxiliaryStarFact
  | MaleficStarFact
  | TransformationFact
  | StructuralFact;

export interface MajorFortuneV1Evidence {
  evidenceId: string;
  physicalFactId: string;
  evidenceClusterId: string;
  familyId: string;
  category: "principal-star" | "auxiliary-support" | "malefic-pressure" | "major-transformation" | "structural-interaction";
  school: ZiweiSchool;
  temporalScope: "dai-van";
  frameRole: "focus" | "opposite" | "trine";
  targetPalaceIndex: number;
  sourceIds: string[];
  claimIds: string[];
  scoringAuthority: "DOMAIN_VERIFIED" | "ENGINEERING_CALIBRATED" | "EXPERIMENTAL" | "CONTEXT_ONLY" | "BLOCKED";
  fact: MajorFortuneV1Fact;
}

export interface MajorFortuneV1Contribution {
  evidenceId: string;
  rawContribution: number;
  adjustedContribution: number;
  reason: string;
}

export interface MajorFortuneV1PillarResult {
  pillarId: string;
  label: string;
  score: number;
  contributions: MajorFortuneV1Contribution[];
}

export interface MajorFortuneV1Diagnostics {
  coveragePercent: number;
  confidencePercent: number;
  admittedEvidenceIds: string[];
  rejectedEvidence: Array<{ evidenceId: string; reason: string }>;
  blockedFamilies: string[];
}

export interface MajorFortuneV1Score {
  rawAxes: {
    support: number;
    pressure: number;
    stability: number;
    activation: number;
  };
  normalizedScore: number;
  band: string;
  intensity: number;
  conflict: number;
}

export interface MajorFortuneV1Result {
  status: "available" | "partial" | "unavailable";
  versions: {
    engineVersion: MajorFortuneEngineVersion;
    formulaVersion: string;
    knowledgeVersion: string;
    contractVersion: string;
    sourcePackVersion: string;
  };
  score: MajorFortuneV1Score | null;
  quality: {
    coveragePercent: number;
    confidencePercent: number;
    engineeringContributionPercent: number;
    experimentalContributionPercent: number;
    verifiedDomainContributionPercent: number;
  };
  evidence: {
    admitted: MajorFortuneV1Evidence[];
    rejected: MajorFortuneV1Evidence[];
    contextOnly: MajorFortuneV1Evidence[];
    blocked: MajorFortuneV1Evidence[];
  };
  diagnostics: MajorFortuneV1Diagnostics;
  trace: MajorFortuneV1Contribution[];
}
