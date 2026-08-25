import type { NatalZiweiFact, ZiweiSchool } from "../../../facts";
import { buildStaticFrame } from "../../../frame";
import type { PalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2/schema";
import type { ChartData } from "@/types/chart";
import { aggregateEvidence, topDrivers } from "../aggregate-evidence";
import {
  collectPalaceEvidencePreVoid,
  emptyDiagnostics,
  type CollectEvidenceContext,
} from "../research/collect-evidence-v2";
import { evaluateStructuralRules } from "../evaluate-structural-rules";
import {
  bandForScore,
  computeIntensity,
  computePalaceScore,
  normalizeAxes,
} from "../research/normalize-v2";
import type { PalaceOverviewResult } from "../types";
import { applyBrightnessDominance } from "./brightness";
import { loadInteractionCandidateProfile } from "./load-profile";
import type {
  CandidateDiagnostics,
  FormationAudit,
  GeometryProfileId,
  InteractionCandidateProfile,
} from "./types";
import { applyCandidateVoidInteraction } from "./void-interaction";
import { applyVcdContextExperiment, experimentalFormationDelta } from "./vcd-context";

export interface AnalyzeCandidateInput {
  chart: ChartData;
  palaceIndex: number;
  school: ZiweiSchool;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewResearchKnowledgeV2;
  duplicateFactIds: string[];
  geometryProfile?: GeometryProfileId;
  profile?: InteractionCandidateProfile;
}

export interface CandidatePalaceResult {
  result: PalaceOverviewResult;
  diagnostics: CandidateDiagnostics;
}

export function analyzePalaceCandidate(input: AnalyzeCandidateInput): CandidatePalaceResult {
  const profile = input.profile ?? loadInteractionCandidateProfile();
  const geometryProfile = input.geometryProfile ?? profile.geometry.defaultProfile;
  const geometry = profile.geometry.profiles[geometryProfile];
  const palace = input.chart.palaces.find((p) => p.index === input.palaceIndex);
  if (!palace) throw new Error(`palace index ${input.palaceIndex} not found`);

  const frame = buildStaticFrame(input.chart, input.palaceIndex, { geometry });
  const overviewDiag = emptyDiagnostics();
  overviewDiag.duplicateFacts.push(...input.duplicateFactIds);
  const ctx: CollectEvidenceContext = {
    frame,
    factsByPalace: input.factsByPalace,
    knowledge: input.knowledge as never,
    diagnostics: overviewDiag,
  };

  const pre = collectPalaceEvidencePreVoid(ctx);
  const bright = applyBrightnessDominance(pre.evidence, profile);
  const voided = applyCandidateVoidInteraction(
    frame,
    input.factsByPalace,
    bright.evidence,
    profile,
  );
  const borrowedNames = new Set(
    voided.evidence
      .filter((e) => e.borrowedFromOpposite)
      .map((e) => e.starName)
      .filter((n): n is string => Boolean(n)),
  );
  const vcdEnabled =
    input.school === "trung-chau"
      ? profile.vcdContext.trungChauEnabled
      : profile.vcdContext.namPhaiEnabled;
  const withoutOppositeDup = vcdEnabled
    ? voided.evidence.filter((e) => {
        if (e.category !== "transformation" || e.palaceRole !== "opposite") {
          return true;
        }
        return !borrowedNames.has(e.starName ?? "");
      })
    : voided.evidence;
  const vcd = applyVcdContextExperiment(
    input.school,
    frame,
    input.factsByPalace,
    input.knowledge,
    withoutOppositeDup,
    pre.borrowedFactIds,
    pre.isVoidMajor,
    profile,
  );

  const ruleEvidence = evaluateStructuralRules({
    frame,
    factsByPalace: input.factsByPalace,
    knowledge: input.knowledge as never,
    diagnostics: overviewDiag,
    focusPalaceName: palace.name,
    focusPalaceBranch: palace.branch,
  });
  const extraRules = experimentalFormationDelta(
    ruleEvidence,
    frame,
    input.factsByPalace,
    profile,
  );
  const allEvidence = [...vcd.evidence, ...ruleEvidence, ...extraRules];
  const rawAxes = aggregateEvidence(allEvidence);
  const score = computePalaceScore(allEvidence, input.knowledge);
  const result: PalaceOverviewResult = {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: {
      contractVersion: "candidate-interaction-v1",
      engineVersion: "candidate-interaction-v1",
      knowledgeVersion: profile.id,
      releaseStage: "experimental",
    },
    palaceIndex: palace.index,
    palaceName: palace.name,
    palaceBranch: palace.branch,
    score,
    structureNet: 0,
    band: bandForScore(score, input.knowledge),
    axes: normalizeAxes(rawAxes, input.knowledge),
    rawAxes,
    intensity: computeIntensity(rawAxes, input.knowledge),
    evidenceCompleteness: 100,
    majorStars: [],
    contextOnlyStars: [],
    isVoidMajor: pre.isVoidMajor,
    topSupportDrivers: topDrivers(allEvidence, "support", 3),
    topPressureDrivers: topDrivers(allEvidence, "pressure", 3),
    allEvidence,
    annotations: [],
    isMenh: palace.index === input.chart.menhIndex,
    isThan: palace.index === input.chart.thanIndex,
    profileId: profile.id,
    school: input.school,
    confidence: {
      evidenceCompletenessPercent: 100,
      sourceConfidencePercent: null,
      calibrationConfidence: "unvalidated",
      reasons: ["RESEARCH_CANDIDATE", "UNCALIBRATED"],
    },
    calibration: {
      profileVersion: profile.id,
      benchmarkVersion: null,
      calibrationVersion: null,
      releaseStage: "experimental",
      scoringInfrastructureVersion: "candidate-interaction-v1",
    },
  };

  const formationAudits: FormationAudit[] = ruleEvidence.map((e) => ({
    ruleId: e.ruleId ?? e.id,
    label: e.label,
    participants: e.factIds,
    brightness: [],
    transformations: [],
    voidMarkers: [],
  }));

  const triggered: string[] = [];
  if (bright.hits.length) triggered.push("H-BRIGHTNESS-01");
  if (voided.hit.voidInteractionMode !== "none") triggered.push("H-VOID-01");
  if (geometryProfile !== "baseline-relative") triggered.push("H-GEOMETRY-01");
  if (ruleEvidence.length) triggered.push("H-FORMATION-01");
  if (vcd.hit.added) triggered.push("H-VCD-01");

  return {
    result,
    diagnostics: {
      brightnessHits: bright.hits,
      voidHit: voided.hit,
      vcdContext: vcd.hit,
      formationAudits,
      geometryProfile,
      triggeredHypotheses: [...new Set(triggered)],
    },
  };
}
