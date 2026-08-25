import {
  indexFactsByPalace,
  normalizeNatalFacts,
  type ZiweiSchool,
} from "../../../facts";
import type { ChartData } from "@/types/chart";
import type { PalaceOverviewBand, PalaceOverviewResult } from "../types";
import { loadPalaceOverviewFormulaV2 } from "./load-formula";
import { combineTp4c, type PalaceNetworkNode } from "./network";
import { bandForV2Score, mapSCungToRadarScore } from "./normalize";
import { applyTuanTrietFlip, computePalaceBaseScore } from "./score-base";
import type { PalaceV2Breakdown } from "./types";

const PALACE_OVERVIEW_V2_VERSIONS = {
  contractVersion: "2.0.0",
  engineVersion: "2.0.0",
  knowledgeVersion: "2.0.0-experimental",
} as const;

export interface AnalyzeAllPalacesV2Result {
  results: PalaceOverviewResult[];
  breakdowns: PalaceV2Breakdown[];
  knowledgeValid: boolean;
  knowledgeIssues?: string[];
}

function emptyAxes() {
  return { support: 0, pressure: 0, stability: 0, activation: 0 };
}

function toResult(
  chart: ChartData,
  school: ZiweiSchool,
  b: PalaceV2Breakdown,
): PalaceOverviewResult {
  const palace = chart.palaces.find((p) => p.index === b.palaceIndex)!;
  const isMenh = palace.index === chart.menhIndex;
  const isThan = palace.index === chart.thanIndex;
  return {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: {
      ...PALACE_OVERVIEW_V2_VERSIONS,
      scoringKnowledgeVersion: PALACE_OVERVIEW_V2_VERSIONS.knowledgeVersion,
      semanticKnowledgeVersion: PALACE_OVERVIEW_V2_VERSIONS.knowledgeVersion,
      calibrationVersion: null,
      scoringInfrastructureVersion: "2.0.0",
      releaseStage: "experimental",
    },
    palaceIndex: b.palaceIndex,
    palaceName: b.palaceName,
    palaceBranch: b.palaceBranch,
    score: b.score,
    band: b.band as PalaceOverviewBand,
    axes: emptyAxes(),
    rawAxes: emptyAxes(),
    intensity: 0,
    evidenceCompleteness: 100,
    majorStars: [],
    contextOnlyStars: [],
    isVoidMajor: b.isVcd,
    topSupportDrivers: [],
    topPressureDrivers: [],
    allEvidence: [],
    profileId: "palace-overview-scoring-formula-v2",
    school,
    confidence: {
      evidenceCompletenessPercent: 100,
      sourceConfidencePercent: 40,
      calibrationConfidence: "unvalidated",
      reasons: ["v2-teacher-seed"],
    },
    calibration: {
      profileVersion: PALACE_OVERVIEW_V2_VERSIONS.knowledgeVersion,
      benchmarkVersion: null,
      calibrationVersion: null,
      releaseStage: "experimental",
      scoringInfrastructureVersion: "2.0.0",
    },
    annotations: [],
    isMenh,
    isThan,
    scoringV2: b,
  };
}

export function analyzeAllPalacesV2(
  chart: ChartData,
  options: { school: ZiweiSchool },
): AnalyzeAllPalacesV2Result {
  const formula = loadPalaceOverviewFormulaV2();
  const { facts } = normalizeNatalFacts(chart, { school: options.school });
  const factsByPalace = indexFactsByPalace(facts);

  const bases = chart.palaces.map((palace) => {
    const parts = computePalaceBaseScore(
      factsByPalace.get(palace.index) ?? [],
      formula,
    );
    const sAfterTt = applyTuanTrietFlip(
      parts.sBase,
      parts.hasTuanTriet,
      formula,
    );
    return { palace, parts, sAfterTt };
  });

  const nodes: PalaceNetworkNode[] = bases.map(({ palace, parts, sAfterTt }) => ({
    palaceIndex: palace.index,
    palaceBranch: palace.branch,
    isVcd: parts.isVcd,
    sAfterTt,
  }));

  const breakdowns: PalaceV2Breakdown[] = bases.map(({ palace, parts, sAfterTt }) => {
    const focus = nodes.find((n) => n.palaceIndex === palace.index)!;
    const combined = combineTp4c(focus, nodes, formula);
    const score = mapSCungToRadarScore(combined.sCung, formula);
    return {
      palaceIndex: palace.index,
      palaceName: palace.name,
      palaceBranch: palace.branch,
      isVcd: parts.isVcd,
      hasTuanTriet: parts.hasTuanTriet,
      majorContribution: parts.majorContribution,
      transformContribution: parts.transformContribution,
      lucCatContribution: parts.lucCatContribution,
      lucSatContribution: parts.lucSatContribution,
      sBase: parts.sBase,
      sAfterTt,
      weights: combined.weights,
      neighborIndexes: combined.neighborIndexes,
      sCung: combined.sCung,
      score,
      band: bandForV2Score(score, formula),
    };
  });

  return {
    results: breakdowns.map((b) => toResult(chart, options.school, b)),
    breakdowns,
    knowledgeValid: true,
  };
}
