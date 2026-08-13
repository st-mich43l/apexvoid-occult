import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
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

export interface MajorFortuneV1Frame {
  context: MajorFortuneV1Context;
  principalStars: ChartStar[];
  auxiliaryStars: ChartStar[];
  elementRelation: {
    menh: string;
    palace: string;
    type: "generates" | "generated-by" | "controls" | "controlled-by" | "same";
  };
  transformations: Array<{
    starKey: string;
    transformation: string;
    sourceStem: string;
  }>;
}

export interface MajorFortuneV1Evidence {
  evidenceId: string;
  claimId: string;
  familyId: string;
  pillarId: string;
  fact: any;
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
  rawScore: number;
  normalizedScore: number;
  band: string;
}

export interface MajorFortuneV1Result {
  engineVersion: MajorFortuneEngineVersion;
  score: MajorFortuneV1Score;
  pillars: Record<string, MajorFortuneV1PillarResult>;
  diagnostics: MajorFortuneV1Diagnostics;
}
