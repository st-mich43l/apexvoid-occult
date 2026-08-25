import type { NatalZiweiFact, ZiweiSchool } from "../../facts";
import { buildStaticFrame, type StaticFrame } from "../../frame";
import {
  getPalaceOverviewVersions,
  type PalaceOverviewKnowledgeV1,
  type PalaceOverviewSemanticKnowledgeV1,
} from "../../knowledge";
import type { ChartData } from "@/types/chart";
import { aggregateEvidence, topDrivers } from "./aggregate-evidence";
import {
  collectPalaceEvidence,
  emptyDiagnostics,
  type CollectEvidenceContext,
} from "./collect-evidence";
import { evaluateStructuralRules } from "./evaluate-structural-rules";
import { buildMenhThanAnnotations, resolveMenhThanStatus } from "./menh-than-annotations";
import { buildMinorPairAnnotations } from "./minor-pair-annotations";
import { buildTransformationTargetAnnotations } from "./transformation-target-annotations";
import { buildTraitProjectionAnnotations } from "./trait-projection-annotations";
import {
  bandForScore,
  computeIntensity,
  computeRadarScore,
  normalizeAxes,
} from "./normalize-result";
import {
  buildPalaceOverviewCalibrationMetadata,
  buildPalaceOverviewConfidence,
} from "./scoring/confidence";
import { computeCoverageComponents, legacyCompleteness } from "./doctrine/coverage";
import { supportPressureConflict } from "./doctrine/conflict";
import { buildPalaceDomainCandidates, loadDoctrinePack } from "./doctrine/loader";
import {
  emptySemanticDiagnostics,
  type PalaceAnnotation,
  type PalaceOverviewDiagnostics,
  type PalaceOverviewResult,
  type PalaceOverviewSemanticDiagnostics,
} from "./types";

export interface AnalyzePalaceInput {
  chart: ChartData;
  palaceIndex: number;
  school: ZiweiSchool;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  duplicateFactIds: string[];
  diagnostics?: PalaceOverviewDiagnostics;
  /** V1.2 — optional; absent/invalid semantic knowledge yields no annotations. */
  semanticKnowledge?: PalaceOverviewSemanticKnowledgeV1;
  semanticDiagnostics?: PalaceOverviewSemanticDiagnostics;
}

export function analyzePalace(input: AnalyzePalaceInput): PalaceOverviewResult {
  const {
    chart,
    palaceIndex,
    school,
    factsByPalace,
    knowledge,
    duplicateFactIds,
    semanticKnowledge,
  } = input;
  const diagnostics = input.diagnostics ?? emptyDiagnostics();
  diagnostics.duplicateFacts.push(...duplicateFactIds);
  const semanticDiagnostics = input.semanticDiagnostics ?? emptySemanticDiagnostics();

  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  if (!palace) {
    throw new Error(`palace index ${palaceIndex} not found`);
  }

  const frame: StaticFrame = buildStaticFrame(chart, palaceIndex, {
    geometry: knowledge.profile.geometry,
  });

  const ctx: CollectEvidenceContext = {
    frame,
    factsByPalace,
    knowledge,
    diagnostics,
  };

  const { evidence: baseEvidence, isVoidMajor } = collectPalaceEvidence(ctx);
  const ruleEvidence = evaluateStructuralRules({
    frame,
    factsByPalace,
    knowledge,
    diagnostics,
    focusPalaceName: palace.name,
    focusPalaceBranch: palace.branch,
  });

  const allEvidence = [...baseEvidence, ...ruleEvidence];
  const rawAxes = aggregateEvidence(allEvidence);
  const axes = normalizeAxes(rawAxes, knowledge);
  const score = computeRadarScore(rawAxes, knowledge);
  const intensity = computeIntensity(rawAxes, knowledge);
  const completenessInput = {
    missingBrightnessCount: new Set(diagnostics.missingBrightness).size,
    unmappedTransformationCount: new Set(diagnostics.unmappedTransformations)
      .size,
    unknownStarCount: new Set(diagnostics.unknownStars).size,
    frameNodeCount: frame.nodes.length,
    duplicateFactCount: new Set(duplicateFactIds).size,
  };
  const evidenceCompleteness = legacyCompleteness(completenessInput);

  const majorStars = frame.nodes.flatMap((node) => {
    const facts = factsByPalace.get(node.palaceIndex) ?? [];
    return facts
      .filter((f) => f.kind === "star" && f.starClass === "major")
      .map((f) => {
        const brightnessStatus: "resolved" | "unavailable" = f.brightness
          ? "resolved"
          : "unavailable";
        return {
          name: f.canonicalStarName ?? f.starName ?? "?",
          brightness: f.brightness ?? null,
          brightnessStatus,
          role: node.role,
        };
      });
  });

  const contextOnlyByName = new Map(
    knowledge.minorStars.stars
      .filter((s) => s.scoringMode === "context-only")
      .map((s) => [s.canonicalName, s] as const),
  );
  const contextOnlyStars = frame.nodes.flatMap((node) => {
    const facts = factsByPalace.get(node.palaceIndex) ?? [];
    return facts
      .filter(
        (f) =>
          f.kind === "star" &&
          f.canonicalStarName &&
          contextOnlyByName.has(f.canonicalStarName),
      )
      .map((f) => ({ name: f.canonicalStarName!, role: node.role }));
  });

  const palaceDomainCandidates = buildPalaceDomainCandidates(
    palace.name,
    majorStars.map((s) => s.name),
  );
  const coverage = computeCoverageComponents({
    ...completenessInput,
    domainClaimCount: palaceDomainCandidates.length,
    schoolPolicyResolved: true,
  });
  const doctrine = loadDoctrinePack();
  const recognizedStarSystems = diagnostics.ruleHits
    .filter((h) => h.palaceName === palace.name)
    .map((h) => {
      const sys = (
        doctrine.starSystems as {
          systems: Array<{ runtimeRuleId: string; id: string; label: string }>;
        }
      ).systems.find((s) => s.runtimeRuleId === h.ruleId);
      return {
        id: sys?.id ?? h.ruleId,
        label: sys?.label ?? h.ruleId,
        factIds: h.factIds,
      };
    });

  const menhThanStatus = resolveMenhThanStatus(chart, palace, semanticDiagnostics);
  const annotations: PalaceAnnotation[] = semanticKnowledge
    ? [
        ...buildMenhThanAnnotations({
          chart,
          palace,
          factsByPalace,
          knowledge: semanticKnowledge,
          status: menhThanStatus,
        }),
        ...buildMinorPairAnnotations({
          frame,
          factsByPalace,
          knowledge: semanticKnowledge,
          diagnostics: semanticDiagnostics,
          focusPalaceIndex: palace.index,
        }),
        ...buildTransformationTargetAnnotations({
          frame,
          factsByPalace,
          knowledge,
          semanticKnowledge,
          diagnostics: semanticDiagnostics,
          focusPalaceIndex: palace.index,
        }),
        ...buildTraitProjectionAnnotations({
          allEvidence,
          knowledge,
          semanticKnowledge,
          diagnostics: semanticDiagnostics,
          focusPalaceIndex: palace.index,
          focusPalaceName: palace.name,
        }),
      ]
    : [];

  return {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: getPalaceOverviewVersions(),
    palaceIndex: palace.index,
    palaceName: palace.name,
    palaceBranch: palace.branch,
    score,
    band: bandForScore(score, knowledge),
    axes,
    rawAxes,
    intensity,
    evidenceCompleteness,
    coverage,
    conflict: supportPressureConflict(axes.support, axes.pressure),
    palaceDomainCandidates,
    recognizedStarSystems,
    majorStars,
    contextOnlyStars,
    isVoidMajor,
    topSupportDrivers: topDrivers(allEvidence, "support", 3),
    topPressureDrivers: topDrivers(allEvidence, "pressure", 3),
    allEvidence,
    annotations,
    isMenh: menhThanStatus.isMenh,
    isThan: menhThanStatus.isThan,
    profileId: knowledge.profile.id,
    school,
    confidence: buildPalaceOverviewConfidence(evidenceCompleteness, 0),
    calibration: buildPalaceOverviewCalibrationMetadata(knowledge),
  };
}
