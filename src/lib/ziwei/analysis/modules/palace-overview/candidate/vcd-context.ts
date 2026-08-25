import type { NatalZiweiFact, ZiweiSchool } from "../../../facts";
import type { StaticFrame } from "../../../frame";
import type { PalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2/schema";
import { emptyAxes, type PalaceEvidence } from "../types";
import type { InteractionCandidateProfile, VcdContextHit } from "./types";

export function applyVcdContextExperiment(
  school: ZiweiSchool,
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
  knowledge: PalaceOverviewResearchKnowledgeV2,
  evidence: PalaceEvidence[],
  borrowedFactIds: Set<string>,
  isVoidMajor: boolean,
  profile: InteractionCandidateProfile,
): { evidence: PalaceEvidence[]; hit: VcdContextHit } {
  const enabled =
    school === "trung-chau"
      ? profile.vcdContext.trungChauEnabled
      : profile.vcdContext.namPhaiEnabled;
  const empty: VcdContextHit = { added: false, factIds: [], school };
  if (!enabled || !isVoidMajor || !profile.vcdContext.borrowTransformationsOnBorrowedMajors) {
    return { evidence, hit: empty };
  }

  const opposite = frame.nodes.find((n) => n.role === "opposite");
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!opposite || !focus) return { evidence, hit: empty };

  const borrowedNames = new Set(
    evidence
      .filter((e) => e.borrowedFromOpposite)
      .map((e) => e.starName)
      .filter((n): n is string => Boolean(n)),
  );
  const seenFacts = new Set(evidence.flatMap((e) => e.factIds));
  const added: PalaceEvidence[] = [];
  const factIds: string[] = [];

  for (const fact of factsByPalace.get(opposite.palaceIndex) ?? []) {
    if (fact.kind !== "transformation" || !fact.transformation || !fact.targetStar) continue;
    if (!borrowedNames.has(fact.targetStar)) continue;
    if (seenFacts.has(fact.id) || borrowedFactIds.has(fact.id)) continue;
    const record = knowledge.transformations.transformations.find(
      (t) => t.transformation === fact.transformation,
    );
    if (!record) continue;
    factIds.push(fact.id);
    seenFacts.add(fact.id);
    added.push({
      id: `ev:vcd-context-transform:${focus.palaceIndex}:${fact.transformation}:${fact.targetStar}`,
      category: "transformation",
      factIds: [fact.id],
      palaceRole: "focus",
      palaceName: focus.palaceName,
      palaceBranch: focus.palaceBranch,
      axes: {
        support: record.axes.support * profile.vcdContext.contextMagnitudeFactor * focus.geometryWeight,
        pressure: record.axes.pressure * profile.vcdContext.contextMagnitudeFactor * focus.geometryWeight,
        stability: record.axes.stability * profile.vcdContext.contextMagnitudeFactor * focus.geometryWeight,
        activation: record.axes.activation * profile.vcdContext.contextMagnitudeFactor * focus.geometryWeight,
      },
      label: `Hóa ${fact.transformation}→${fact.targetStar} (ngữ cảnh đối cung)`,
      explanationKey: "vcd.borrowed-opposite-context",
      sourceIds: ["src-candidate-interaction-v1"],
      knowledgeStatus: "experimental",
      borrowedFromOpposite: true,
      starName: fact.targetStar,
      sourceKind: "borrowed-opposite-context",
      contributionKind: "context",
    });
  }

  if (added.length === 0) {
    return { evidence, hit: empty };
  }
  return {
    evidence: [...evidence, ...added],
    hit: { added: true, factIds, school },
  };
}

export function experimentalFormationDelta(
  ruleHits: PalaceEvidence[],
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
  profile: InteractionCandidateProfile,
): PalaceEvidence[] {
  if (!profile.structuralInteractions.enableExperimentalDelta) return [];
  if (ruleHits.length === 0) return [];
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!focus) return [];
  let ham = 0;
  let voids = 0;
  for (const node of frame.nodes) {
    for (const f of factsByPalace.get(node.palaceIndex) ?? []) {
      if (f.kind === "star" && f.starClass === "major" && f.brightness === "Hãm") ham += 1;
      if (f.kind === "void-marker") voids += 1;
    }
  }
  if (ham < 2 || voids < 1) return [];
  return [
    {
      id: `ev:formation-candidate-delta:${focus.palaceIndex}`,
      category: "structural-rule",
      factIds: ruleHits.flatMap((e) => e.factIds),
      palaceRole: "focus",
      palaceName: focus.palaceName,
      palaceBranch: focus.palaceBranch,
      axes: {
        ...emptyAxes(),
        pressure: profile.structuralInteractions.hamVoidExtraPressure,
        stability: profile.structuralInteractions.hamVoidExtraStability,
      },
      label: "interaction-delta (ham+void, experimental)",
      explanationKey: "rule.candidate-ham-void",
      sourceIds: ["src-candidate-interaction-v1"],
      knowledgeStatus: "experimental",
      sourceKind: "rule",
      contributionKind: "interaction-delta",
    },
  ];
}
