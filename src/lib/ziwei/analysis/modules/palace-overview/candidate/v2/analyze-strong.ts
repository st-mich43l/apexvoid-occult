import type { NatalZiweiFact, ZiweiSchool } from "../../../../facts";
import { buildStaticFrame } from "../../../../frame";
import type { PalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2/schema";
import type { ChartData } from "@/types/chart";
import { aggregateEvidence, topDrivers } from "../../aggregate-evidence";
import {
  collectPalaceEvidencePreVoid,
  emptyDiagnostics,
  type CollectEvidenceContext,
} from "../../research/collect-evidence-v2";
import { evaluateStructuralRules } from "../../evaluate-structural-rules";
import {
  bandForScore,
  computeIntensity,
  computePalaceScore,
  normalizeAxes,
} from "../../research/normalize-v2";
import type { PalaceOverviewResult } from "../../types";
import { applyBrightnessDominance } from "../brightness";
import { loadInteractionCandidateProfile } from "../load-profile";
import type { InteractionCandidateProfile } from "../types";
import { applyCandidateVoidInteraction } from "../void-interaction";
import { experimentalFormationDelta } from "../vcd-context";
import { scaleAndBoundFormations } from "./formation";
import { loadInteractionCandidateV2Pack } from "./load";
import { applyRescueContext } from "./rescue";
import type { AblationId, StrongDiagnostics } from "./types";
import { applyStrongVcdContext } from "./vcd";

export interface AnalyzeStrongInput {
  chart: ChartData;
  palaceIndex: number;
  school: ZiweiSchool;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewResearchKnowledgeV2;
  duplicateFactIds: string[];
  ablation?: AblationId;
}

function voidProfileFromStrong(
  base: InteractionCandidateProfile,
  strong: ReturnType<typeof loadInteractionCandidateV2Pack>["profiles"]["strong"],
  ablation: AblationId,
): InteractionCandidateProfile {
  const clone: InteractionCandidateProfile = structuredClone(base);
  clone.brightnessDominance.supportCap = strong.brightness.supportCap;
  clone.brightnessDominance.pressureCap = strong.brightness.pressureCap;
  clone.voidInteraction.singleVoid = strong.void.singleVoid;
  clone.voidInteraction.doubleVoid = strong.void.doubleVoid;
  if (ablation === "no-void-relief") {
    clone.voidInteraction.singleVoid.pressureRelief.enabled = false;
    clone.voidInteraction.doubleVoid.pressureRelief.enabled = false;
  }
  return clone;
}

export function analyzePalaceStrong(
  input: AnalyzeStrongInput,
): { result: PalaceOverviewResult; diagnostics: StrongDiagnostics } {
  const pack = loadInteractionCandidateV2Pack();
  const strong = pack.profiles.strong;
  const ablation = input.ablation ?? "full";
  const geometry =
    ablation === "no-geometry"
      ? { focus: 1, opposite: 0.5, trine: 0.3 }
      : strong.geometry;
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
  const v1 = voidProfileFromStrong(loadInteractionCandidateProfile(), strong, ablation);
  const bright = applyBrightnessDominance(pre.evidence, v1);
  const rules = evaluateStructuralRules({
    frame,
    factsByPalace: input.factsByPalace,
    knowledge: input.knowledge as never,
    diagnostics: overviewDiag,
    focusPalaceName: palace.name,
    focusPalaceBranch: palace.branch,
  });
  const extra =
    ablation === "no-formation-amplification"
      ? []
      : experimentalFormationDelta(rules, frame, input.factsByPalace, v1);
  const scaled = scaleAndBoundFormations(
    [...rules, ...extra],
    frame,
    input.factsByPalace,
    strong,
    ablation !== "no-formation-amplification",
  );

  const withRules = [...bright.evidence, ...scaled];
  const voided = applyCandidateVoidInteraction(
    frame,
    input.factsByPalace,
    withRules,
    v1,
  );

  const focusFacts = input.factsByPalace.get(palace.index) ?? [];
  const focusHasHam = focusFacts.some(
    (f) => f.kind === "star" && f.starClass === "major" && f.brightness === "Hãm",
  );
  const voidTypes = focusFacts
    .filter((f) => f.kind === "void-marker" && f.voidType)
    .map((f) => f.voidType!);

  const rescued =
    ablation === "no-rescue"
      ? {
          evidence: voided.evidence,
          hit: {
            fired: false,
            reason: "ablated",
            strength: 0,
            need: 0,
            supportBoost: 0,
            pressureRelief: 0,
            stabilityBoost: 0,
          },
        }
      : applyRescueContext({
          evidence: voided.evidence,
          rescue: strong.rescue,
          beneficMinorFamilyIds: pack.beneficMinorFamilyIds,
          focusHasHam,
          isVcd: pre.isVoidMajor,
          palaceName: palace.name,
          palaceBranch: palace.branch,
        });

  const vcdEnabled =
    ablation === "no-vcd-context"
      ? false
      : input.school === "trung-chau"
        ? strong.vcd.trungChauEnabled
        : strong.vcd.namPhaiEnabled;
  const vcd = applyStrongVcdContext({
    school: input.school,
    frame,
    factsByPalace: input.factsByPalace,
    knowledge: input.knowledge,
    evidence: rescued.evidence,
    borrowedFactIds: pre.borrowedFactIds,
    isVoidMajor: pre.isVoidMajor,
    profile: strong,
    pack,
    enabled: vcdEnabled,
  });

  const seenEv = new Set<string>();
  const allEvidence = vcd.evidence.filter((e) => {
    if (seenEv.has(e.id)) return false;
    seenEv.add(e.id);
    return true;
  });
  const rawAxes = aggregateEvidence(allEvidence);
  const score = computePalaceScore(allEvidence, input.knowledge);
  const result: PalaceOverviewResult = {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: {
      contractVersion: "candidate-interaction-v2",
      engineVersion: "candidate-interaction-v2",
      knowledgeVersion: strong.id,
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
    profileId: strong.id,
    school: input.school,
    confidence: {
      evidenceCompletenessPercent: 100,
      sourceConfidencePercent: null,
      calibrationConfidence: "unvalidated",
      reasons: ["RESEARCH_CANDIDATE", "UNCALIBRATED", "STRONG"],
    },
    calibration: {
      profileVersion: strong.id,
      benchmarkVersion: null,
      calibrationVersion: null,
      releaseStage: "experimental",
      scoringInfrastructureVersion: "candidate-interaction-v2",
    },
  };

  const triggered: string[] = [];
  if (bright.hits.length) triggered.push("H-BRIGHTNESS-01");
  if (voided.hit.voidInteractionMode !== "none") triggered.push("H-VOID-01");
  if (ablation !== "no-geometry") triggered.push("H-GEOMETRY-01");
  if (rules.length) triggered.push("H-FORMATION-01");
  if (vcd.added) triggered.push("H-VCD-01");
  if (rescued.hit.fired) triggered.push("H-RESCUE-01");

  return {
    result,
    diagnostics: {
      ablation,
      rescue: rescued.hit,
      voidTypes,
      formationScaled: ablation !== "no-formation-amplification",
      formationRuleCount: rules.length,
      vcdAdded: vcd.added,
      triggeredHypotheses: [...new Set(triggered)],
      budget: {
        rescueSupport: rescued.hit.supportBoost,
        rescuePressureRelief: rescued.hit.pressureRelief,
        voidExtraPressureRelief: Math.max(
          0,
          voided.hit.pressureBefore - voided.hit.pressureAfter,
        ),
        formationAxisMagnitude: scaled.reduce(
          (m, e) => Math.max(m, Math.abs(e.axes.support), Math.abs(e.axes.pressure)),
          0,
        ),
        vcdAxisMagnitude: vcd.added,
      },
    },
  };
}
