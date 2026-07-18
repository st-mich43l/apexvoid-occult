import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { MAJOR_FORTUNE_DOMAINS, type MajorFortuneDomain } from "../../contracts/major-fortune";
import { loadPalaceOverviewKnowledgeV1, type PalaceOverviewKnowledgeV1 } from "../../knowledge";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import { resolveMajorFortuneContext } from "./resolve-context";
import { collectDomainFrames, collectOverallFrame, type MajorFortuneFrame } from "./collect-major-frames";
import { collectStarEvidence } from "./collect-star-evidence";
import { collectTransformationEvidence } from "./collect-transformation-evidence";
import { collectStructuralEvidence } from "./collect-structural-evidence";
import { aggregateMajorFortuneEvidence } from "./aggregate";
import { normalizeMajorFortuneAxes, sumWeightedAxes } from "./normalize";
import { dedupeMajorFortuneDiagnostics, emptyMajorFortuneDiagnostics } from "./diagnostics";
import type { ResolvedMajorFortuneContext } from "./resolve-context";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import {
  type MajorFortuneAxisResult,
  type MajorFortuneCapabilities,
  type MajorFortuneDiagnostics,
  type MajorFortuneEvidence,
  type MajorFortuneScoringResult,
} from "./types";

const CONTRACT_VERSION = "0.1.0";
const ENGINE_VERSION = "0.1.0";
const TOP_DRIVER_COUNT = 3;

function topDrivers(
  evidence: MajorFortuneEvidence[],
  axis: "support" | "pressure",
): MajorFortuneEvidence[] {
  return evidence
    .filter((e) => e.weightedAxes[axis] > 0)
    .sort((a, b) => b.weightedAxes[axis] - a.weightedAxes[axis])
    .slice(0, TOP_DRIVER_COUNT);
}

function unavailableAxisResult(reasonCodes: string[]): MajorFortuneAxisResult {
  return { status: "unavailable", score: null, band: null, evidence: [], reasonCodes };
}

function capabilitiesFor(
  school: ZiweiSchool,
  knowledge: MajorFortuneScoringKnowledgeV0,
): MajorFortuneCapabilities {
  const profile = knowledge.schoolCapabilities.profiles[school];
  return {
    supportsOverallFrame: profile.supportsOverallFrame,
    supportsTwelveDomainOverlay: profile.supportsTwelveDomainOverlay,
    supportsMajorFortuneTransformations: profile.supportsMajorFortuneTransformations,
  };
}

function resolvePeriodPhase(
  yearInCycle: number | undefined,
  knowledge: MajorFortuneScoringKnowledgeV0,
): { phaseId: string } | null {
  if (yearInCycle === undefined) return null;
  const phase = knowledge.periodPhase.phases.find(
    (p) => yearInCycle >= p.yearInCycleMin && yearInCycle <= p.yearInCycleMax,
  );
  return phase ? { phaseId: phase.phaseId } : null;
}

function scoreFrame(
  chart: ChartData,
  frame: MajorFortuneFrame,
  resolvedContext: ResolvedMajorFortuneContext,
  numericKnowledge: PalaceOverviewKnowledgeV1,
  mfKnowledge: MajorFortuneScoringKnowledgeV0,
  diagnostics: MajorFortuneDiagnostics,
): MajorFortuneAxisResult {
  const starEvidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });
  const transformationEvidence = collectTransformationEvidence({
    frame,
    transformations: resolvedContext.transformations,
    knowledge: mfKnowledge,
    diagnostics,
  });
  const structuralEvidence = collectStructuralEvidence({
    frame,
    transformationEvidence,
    knowledge: mfKnowledge,
  });

  const evidence = aggregateMajorFortuneEvidence(
    [...starEvidence, ...transformationEvidence, ...structuralEvidence],
    mfKnowledge.scoringProfile,
  );
  const rawAxes = sumWeightedAxes(evidence);
  const normalized = normalizeMajorFortuneAxes(rawAxes, mfKnowledge.scoringProfile);

  return {
    status: "available",
    score: normalized.score,
    band: normalized.band,
    rawAxes,
    normalizedAxes: normalized.normalizedAxes,
    intensity: normalized.intensity,
    conflict: normalized.conflict,
    evidence,
    topSupportDrivers: topDrivers(evidence, "support"),
    topPressureDrivers: topDrivers(evidence, "pressure"),
  };
}

function globallyUnavailableResult(
  school: ZiweiSchool,
  reasonCodes: string[],
  diagnostics: MajorFortuneDiagnostics,
  knowledgeVersion: string,
): MajorFortuneScoringResult {
  return {
    module: "major-fortune",
    school,
    cycle: null,
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion,
      policyProfileVersion: "unavailable",
    },
    status: "unavailable",
    overall: unavailableAxisResult(reasonCodes),
    domainsStatus: "unavailable",
    domains: {},
    capabilities: {
      supportsOverallFrame: false,
      supportsTwelveDomainOverlay: false,
      supportsMajorFortuneTransformations: false,
    },
    diagnostics: dedupeMajorFortuneDiagnostics(diagnostics),
    periodPhase: null,
  };
}

/**
 * Public entry point — deterministic Major Fortune decade scoring for one
 * chart + school. Never mutates `chart` or the loaded knowledge. Never reads
 * `annualYear`/annual facts numerically. `yearInCycle` is metadata-only
 * (entry/core/exit) and never changes the numeric result.
 */
export function analyzeMajorFortune(
  chart: ChartData,
  options: { school: ZiweiSchool; yearInCycle?: number },
): MajorFortuneScoringResult {
  const { school, yearInCycle } = options;
  const diagnostics = emptyMajorFortuneDiagnostics();

  const mfKnowledgeResult = loadMajorFortuneScoringKnowledgeV0();
  if (!mfKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...mfKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return globallyUnavailableResult(school, ["invalid-knowledge"], diagnostics, "unavailable");
  }
  const mfKnowledge = mfKnowledgeResult.knowledge;
  const knowledgeVersion = `${mfKnowledge.scoringProfile.profileId}@${mfKnowledge.scoringProfile.schemaVersion}`;

  const numericKnowledgeResult = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledgeResult.ok) {
    diagnostics.invalidKnowledge.push(
      ...numericKnowledgeResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
    return globallyUnavailableResult(school, ["invalid-knowledge"], diagnostics, knowledgeVersion);
  }
  const numericKnowledge = numericKnowledgeResult.knowledge;

  const capabilities = capabilitiesFor(school, mfKnowledge);
  const resolvedContext = resolveMajorFortuneContext(chart, school, mfKnowledge, capabilities, diagnostics);

  if (!resolvedContext) {
    const reasonCodes =
      diagnostics.noActiveMajorFortune.length > 0
        ? ["no-active-major-fortune"]
        : ["invalid-resolved-context"];
    return globallyUnavailableResult(school, reasonCodes, diagnostics, knowledgeVersion);
  }

  const overallFrame = collectOverallFrame(chart, resolvedContext, mfKnowledge.domainDefinitions, diagnostics);
  const overall = overallFrame
    ? scoreFrame(chart, overallFrame, resolvedContext, numericKnowledge, mfKnowledge, diagnostics)
    : unavailableAxisResult(["missing-frame-nodes"]);

  let domainsStatus: "available" | "unavailable" = "unavailable";
  const domains: Partial<Record<MajorFortuneDomain, MajorFortuneAxisResult>> = {};

  if (resolvedContext.majorPalaceLabels && capabilities.supportsTwelveDomainOverlay) {
    const domainFrames = collectDomainFrames(chart, resolvedContext, mfKnowledge.domainDefinitions, diagnostics);
    if (domainFrames.size === MAJOR_FORTUNE_DOMAINS.length) {
      domainsStatus = "available";
      for (const domainId of MAJOR_FORTUNE_DOMAINS) {
        const frame = domainFrames.get(domainId);
        if (!frame) continue;
        domains[domainId] = scoreFrame(chart, frame, resolvedContext, numericKnowledge, mfKnowledge, diagnostics);
      }
    }
  }

  const moduleStatus: "available" | "partial" | "unavailable" =
    overall.status === "unavailable" ? "unavailable" : domainsStatus === "available" ? "available" : "partial";

  return {
    module: "major-fortune",
    school,
    cycle: {
      cycleIndex: resolvedContext.cycleIndex,
      startAge: resolvedContext.startAge,
      endAge: resolvedContext.endAge,
      activePalaceIndex: resolvedContext.activePalaceIndex,
    },
    versions: {
      contractVersion: CONTRACT_VERSION,
      engineVersion: ENGINE_VERSION,
      knowledgeVersion,
      policyProfileVersion: `${mfKnowledge.schoolCapabilities.catalogId}@${mfKnowledge.schoolCapabilities.schemaVersion}`,
    },
    status: moduleStatus,
    overall,
    domainsStatus,
    domains,
    capabilities,
    diagnostics: dedupeMajorFortuneDiagnostics(diagnostics),
    periodPhase: resolvePeriodPhase(yearInCycle, mfKnowledge),
  };
}
