import type { MonthlyFlowV02ReasonCode, MonthlyJiCollisionCandidate, MonthlyFlowBand, MonthlyScoreBreakdown } from "../v0.2/types";

export interface AnnualBaselineProvenance {
  score: number;
  sourceModule: "annual-axes";
  sourceContractVersion: string;
  sourceEngineVersion: string;
  sourceKnowledgeVersion: string;
  aggregationMethod: "lower-median-v1";
  sourceScoreCount: number;
  sourceScores: number[];
}

export type MonthlyFlowV03MonthSummary =
  | {
      status: "resolved" | "partial";
      monthKey: string;
      lunarMonth: number;
      isLeapMonth: false;
      focusPalaceIndex: number;
      calendarStem: string;
      calendarBranch: string;
      score: number;
      band: MonthlyFlowBand;
      breakdown: MonthlyScoreBreakdown;
      reasonCodes: MonthlyFlowV02ReasonCode[];
      collisionCandidates: MonthlyJiCollisionCandidate[];
    }
  | {
      status: "unavailable";
      monthKey: string;
      lunarMonth: number;
      isLeapMonth: false;
      focusPalaceIndex: number | null;
      calendarStem: string | null;
      calendarBranch: string | null;
      score: null;
      band: null;
      breakdown: null;
      reasonCodes: MonthlyFlowV02ReasonCode[];
      collisionCandidates: MonthlyJiCollisionCandidate[];
    };

export interface MonthlyFlowV03Diagnostics {
  providerUnavailable: boolean;
  providerSchoolMismatch: string[];
  invalidKnowledge: string[];
  engineStatus: "resolved" | "partial" | "unavailable";
  notes: string[];
  unresolvedTransformationTargets: string[];
  ambiguousTransformationTargets: string[];
}

export interface MonthlyFlowV03ProductionAnalysis {
  module: "monthly-flow";
  version: "0.3.0";
  engine: "event-driven";
  school: "nam-phai";
  annualYear: number;
  status: "resolved" | "partial" | "unavailable";
  annualBaseline: AnnualBaselineProvenance | null;
  monthSummaries: MonthlyFlowV03MonthSummary[];
  diagnostics: MonthlyFlowV03Diagnostics;
}
