import type { NatalZiweiFact, ZiweiBrightness, ZiweiSchool } from "../../facts";
import type { StaticFrame, StaticFrameNode } from "../../frame";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  AxisSeed,
  MinorStarRecord,
  MinorStateModifierPolicy,
  SchoolProfileId,
} from "../../knowledge/schema";
import {
  absEffect,
  emptyAxes,
  scaleAxes,
  type PalaceEvidence,
  type PalaceEvidenceAxes,
  type PalaceOverviewDiagnostics,
} from "./types";

/** Bridge Calculation-Core school id to knowledge-catalog school profile id. */
function schoolProfileId(school: ZiweiSchool): SchoolProfileId {
  return school === "nam-phai" ? "nam-phai-v1" : "trung-chau-v1";
}

export interface CollectEvidenceContext {
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  diagnostics: PalaceOverviewDiagnostics;
}

function axesFromSeed(seed: AxisSeed): PalaceEvidenceAxes {
  return {
    support: seed.support,
    pressure: seed.pressure,
    stability: seed.stability,
    activation: seed.activation,
  };
}

function multiplyAxes(
  axes: PalaceEvidenceAxes,
  factor: number,
): PalaceEvidenceAxes {
  return scaleAxes(axes, factor);
}

/** Brightness multiply then additive delta. Clamp is the caller's job (after Tứ Hóa). */
export function applyBrightnessUnclamped(
  axes: PalaceEvidenceAxes,
  brightness: ZiweiBrightness,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceEvidenceAxes {
  const mod =
    knowledge.majorStars.brightnessModifiers[brightness] ??
    knowledge.majorStars.brightnessModifiers.Bình!;
  return {
    support: axes.support * mod.supportFactor + (mod.supportDelta ?? 0),
    pressure: axes.pressure * mod.pressureFactor + (mod.pressureDelta ?? 0),
    stability: axes.stability + mod.stabilityDelta,
    activation: axes.activation * mod.activationFactor,
  };
}

export function applyBrightness(
  axes: PalaceEvidenceAxes,
  brightness: ZiweiBrightness,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceEvidenceAxes {
  return clampSupportPressure(applyBrightnessUnclamped(axes, brightness, knowledge));
}

function applyMinorStateModifier(
  axes: PalaceEvidenceAxes,
  policy: MinorStateModifierPolicy,
): PalaceEvidenceAxes {
  return {
    support: axes.support * policy.supportFactor,
    pressure: axes.pressure * policy.pressureFactor,
    stability: axes.stability + policy.stabilityDelta,
    activation: axes.activation * policy.activationFactor,
  };
}

function nodeFacts(
  ctx: CollectEvidenceContext,
  node: StaticFrameNode,
): NatalZiweiFact[] {
  return ctx.factsByPalace.get(node.palaceIndex) ?? [];
}

function majorFacts(facts: NatalZiweiFact[]): NatalZiweiFact[] {
  return facts.filter(
    (f) => f.kind === "star" && f.starClass === "major" && f.canonicalStarName,
  );
}

function voidTypesOnPalace(facts: NatalZiweiFact[]): Array<"Tuần" | "Triệt"> {
  return facts
    .filter((f) => f.kind === "void-marker" && f.voidType)
    .map((f) => f.voidType!);
}

function knowledgeStatus(
  knowledge: PalaceOverviewKnowledgeV1,
): "experimental" | "approved" {
  return knowledge.profile.status === "approved" ? "approved" : "experimental";
}

function majorStarLookup(knowledge: PalaceOverviewKnowledgeV1, name: string) {
  return knowledge.majorStars.stars.find((s) => s.name === name);
}

function clampSupportPressure(axes: PalaceEvidenceAxes): PalaceEvidenceAxes {
  return {
    ...axes,
    support: Math.max(0, axes.support),
    pressure: Math.max(0, axes.pressure),
  };
}

function frameStarNames(ctx: CollectEvidenceContext): Set<string> {
  return new Set(
    ctx.frame.nodes.flatMap((node) =>
      nodeFacts(ctx, node)
        .filter((f) => f.kind === "star" && f.canonicalStarName)
        .map((f) => f.canonicalStarName!),
    ),
  );
}

function transformationFacts(ctx: CollectEvidenceContext): NatalZiweiFact[] {
  return ctx.frame.nodes.flatMap((node) =>
    nodeFacts(ctx, node).filter((f) => f.kind === "transformation" && f.transformation),
  );
}

function lookupTuHoaCell(
  knowledge: PalaceOverviewKnowledgeV1,
  star: string,
  transformation: string,
) {
  return knowledge.transformationMatrix.cells.find(
    (c) => c.star === star && c.transformation === transformation,
  );
}

/** seed → brightness → tứ hóa delta → clamp ≥0. Geometry is applied by callers. */
export function applyTuHoaDeltas(
  axes: PalaceEvidenceAxes,
  star: string,
  transformations: Array<{ transformation: string; factId: string }>,
  knowledge: PalaceOverviewKnowledgeV1,
): {
  axes: PalaceEvidenceAxes;
  extraFactIds: string[];
  transformation?: string;
  transformationCellId?: string;
  label?: string;
  unmapped: string[];
} {
  let next = { ...axes };
  const extraFactIds: string[] = [];
  const unmapped: string[] = [];
  let lastLabel: string | undefined;
  let lastCellId: string | undefined;
  let lastHoa: string | undefined;
  for (const t of transformations) {
    const cell = lookupTuHoaCell(knowledge, star, t.transformation);
    if (!cell) {
      unmapped.push(t.factId);
      continue;
    }
    const d = cell.usesFallback
      ? knowledge.transformationMatrix.fallback[cell.transformation]
      : cell;
    next = {
      support: next.support + d.supportDelta,
      pressure: next.pressure + d.pressureDelta,
      stability: next.stability + d.stabilityDelta,
      activation: next.activation + d.activationDelta,
    };
    extraFactIds.push(t.factId);
    lastLabel = cell.label;
    lastCellId = cell.id;
    lastHoa = cell.transformation;
  }
  return {
    axes: clampSupportPressure(next),
    extraFactIds,
    transformation: lastHoa,
    transformationCellId: lastCellId,
    label: lastLabel,
    unmapped,
  };
}

function transformsForStar(
  facts: NatalZiweiFact[],
  star: string,
): Array<{ transformation: string; factId: string }> {
  return facts
    .filter((f) => f.targetStar === star && f.transformation)
    .map((f) => ({ transformation: f.transformation!, factId: f.id }));
}

function collectMajorEvidence(
  ctx: CollectEvidenceContext,
  borrowedFactIds: Set<string>,
): PalaceEvidence[] {
  const { frame, knowledge, diagnostics } = ctx;
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!focus) return [];

  const focusMajors = majorFacts(nodeFacts(ctx, focus));
  const isVoidMajor = focusMajors.length === 0;
  const out: PalaceEvidence[] = [];
  const status = knowledgeStatus(knowledge);

  const hoaFacts = transformationFacts(ctx);
  const namesInFrame = frameStarNames(ctx);
  for (const fact of hoaFacts) {
    if (!fact.targetStar || !namesInFrame.has(fact.targetStar)) {
      diagnostics.unmappedTransformations.push(fact.id);
    }
  }

  if (isVoidMajor) {
    const opposite = frame.nodes.find((n) => n.role === "opposite");
    const oppositeMajors = opposite ? majorFacts(nodeFacts(ctx, opposite)) : [];
    if (oppositeMajors.length > 0) {
      const borrow = knowledge.voidEnvironment.voidMajorBorrowFactor;
      for (const fact of oppositeMajors) {
        const name = fact.canonicalStarName!;
        const record = majorStarLookup(knowledge, name);
        if (!record) {
          diagnostics.unknownStars.push(name);
          continue;
        }
        let brightness = fact.brightness;
        const brightnessStatus = brightness ? "resolved" : "unavailable";
        if (!brightness) {
          diagnostics.missingBrightness.push(fact.id);
        }
        let axes = brightness
          ? applyBrightnessUnclamped(axesFromSeed(record.axes), brightness, knowledge)
          : axesFromSeed(record.axes);
        const hoa = applyTuHoaDeltas(
          axes,
          name,
          transformsForStar(hoaFacts, name),
          knowledge,
        );
        hoa.unmapped.forEach((id) => diagnostics.unmappedTransformations.push(id));
        axes = multiplyAxes(hoa.axes, borrow * focus.geometryWeight);
        borrowedFactIds.add(fact.id);
        out.push({
          id: `ev:major-borrow:${focus.palaceIndex}:${name}`,
          category: "major-star",
          factIds: [fact.id, ...hoa.extraFactIds],
          palaceRole: "focus",
          palaceName: focus.palaceName,
          palaceBranch: focus.palaceBranch,
          axes,
          label: hoa.label ?? `${name} (mượn đối cung)`,
          explanationKey: "major.borrowed-from-opposite",
          sourceIds: knowledge.majorStars.sourceIds,
          knowledgeStatus: status,
          borrowedFromOpposite: true,
          starName: name,
          starBrightness: brightness,
          brightnessStatus,
          sourceKind: "borrowed-opposite",
          transformation: hoa.transformation,
          transformationCellId: hoa.transformationCellId,
        });
      }
      out.push({
        id: `ev:void-context:${focus.palaceIndex}`,
        category: "void-environment",
        factIds: [],
        palaceRole: "focus",
        palaceName: focus.palaceName,
        palaceBranch: focus.palaceBranch,
        axes: axesFromSeed(knowledge.voidEnvironment.voidContext),
        label: "Vô chính diệu",
        explanationKey: "void.borrow-context",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
        sourceKind: "context",
      });
    } else {
      out.push({
        id: `ev:void-double:${focus.palaceIndex}`,
        category: "void-environment",
        factIds: [],
        palaceRole: "focus",
        palaceName: focus.palaceName,
        palaceBranch: focus.palaceBranch,
        axes: axesFromSeed(knowledge.voidEnvironment.doubleVoidContext),
        label: "Vô chính diệu (đối cung cũng trống)",
        explanationKey: "void.double-empty",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
        sourceKind: "context",
      });
    }
  }

  for (const node of frame.nodes) {
    for (const fact of majorFacts(nodeFacts(ctx, node))) {
      if (borrowedFactIds.has(fact.id)) continue;
      const name = fact.canonicalStarName!;
      const record = majorStarLookup(knowledge, name);
      if (!record) {
        diagnostics.unknownStars.push(name);
        continue;
      }
      let brightness = fact.brightness;
      const brightnessStatus = brightness ? "resolved" : "unavailable";
      if (!brightness) {
        diagnostics.missingBrightness.push(fact.id);
      }
      let axes = brightness
        ? applyBrightnessUnclamped(axesFromSeed(record.axes), brightness, knowledge)
        : axesFromSeed(record.axes);
      const hoa = applyTuHoaDeltas(
        axes,
        name,
        transformsForStar(hoaFacts, name),
        knowledge,
      );
      hoa.unmapped.forEach((id) => diagnostics.unmappedTransformations.push(id));
      axes = multiplyAxes(hoa.axes, node.geometryWeight);
      out.push({
        id: `ev:major:${node.palaceIndex}:${name}:${node.role}`,
        category: "major-star",
        factIds: [fact.id, ...hoa.extraFactIds],
        palaceRole: node.role,
        palaceName: node.palaceName,
        palaceBranch: node.palaceBranch,
        axes,
        label: hoa.label ?? name,
        explanationKey: `major.${name}`,
        sourceIds: knowledge.majorStars.sourceIds,
        knowledgeStatus: status,
        starName: name,
        starBrightness: brightness,
        brightnessStatus,
        sourceKind: "natal",
        transformation: hoa.transformation,
        transformationCellId: hoa.transformationCellId,
      });
    }
  }

  return out;
}

/**
 * Resolve minor-star evidence through the per-star catalog (V1.1). Family
 * `starNames` is gone — per-star records are the single membership SSOT.
 * See integration-prompt.md "Evidence collection" for the 6-step contract.
 */
function collectMinorFamilyEvidence(
  ctx: CollectEvidenceContext,
): PalaceEvidence[] {
  const { frame, knowledge, diagnostics } = ctx;
  const status = knowledgeStatus(knowledge);
  const profile = knowledge.profile;
  const out: PalaceEvidence[] = [];

  const recordByCanonicalName = new Map(
    knowledge.minorStars.stars.map((s) => [s.canonicalName, s]),
  );
  const familyById = new Map(
    knowledge.minorFamilies.families.map((f) => [f.id, f]),
  );

  type Contributor = {
    fact: NatalZiweiFact;
    node: StaticFrameNode;
    record: MinorStarRecord;
    axes: PalaceEvidenceAxes;
  };

  const groups = new Map<string, Contributor[]>();

  for (const node of frame.nodes) {
    for (const fact of nodeFacts(ctx, node)) {
      if (fact.kind !== "star" || fact.starClass === "major") continue;
      const name = fact.canonicalStarName;
      if (!name) continue;

      const record = recordByCanonicalName.get(name);
      if (!record) {
        diagnostics.unknownStars.push(name);
        continue;
      }

      // School isolation: a record known to the catalog but not scoped to
      // this school is silently ignored here — Calculation Core should not
      // emit it for this school in the first place (§ School isolation).
      if (!record.schoolProfiles.includes(schoolProfileId(fact.school))) {
        continue;
      }

      if (record.scoringMode === "context-only") {
        diagnostics.contextOnlyFacts.push(fact.id);
        continue;
      }

      const family = familyById.get(record.familyId);
      if (!family) {
        diagnostics.unknownStars.push(name);
        continue;
      }

      let axes = axesFromSeed(record.axesOverride ?? family.axes);

      if (record.brightnessPolicy !== "none" && fact.brightness) {
        const policy =
          knowledge.minorStateModifiers.policies[record.brightnessPolicy][
            fact.brightness
          ];
        if (policy) axes = applyMinorStateModifier(axes, policy);
      }

      const hoa = applyTuHoaDeltas(
        axes,
        name,
        transformsForStar(transformationFacts(ctx), name),
        knowledge,
      );
      hoa.unmapped.forEach((id) => diagnostics.unmappedTransformations.push(id));
      axes = multiplyAxes(hoa.axes, node.geometryWeight);

      const list = groups.get(family.diminishingGroup) ?? [];
      list.push({ fact, node, record, axes });
      groups.set(family.diminishingGroup, list);
    }
  }

  const max = profile.familyMaxContributors;
  const factors = profile.familyDiminishingReturns;

  for (const contributors of groups.values()) {
    contributors.sort((a, b) => absEffect(b.axes) - absEffect(a.axes));
    contributors.forEach((c, index) => {
      if (index >= max) return;
      const factor = factors[index] ?? 0;
      if (factor === 0) return;
      const axes = multiplyAxes(c.axes, factor);
      const name = c.fact.canonicalStarName!;
      const family = familyById.get(c.record.familyId);
      const hoaFacts = transformsForStar(transformationFacts(ctx), name);
      out.push({
        id: `ev:minor:${c.record.familyId}:${c.node.palaceIndex}:${name}`,
        category: "minor-star-family",
        factIds: [c.fact.id, ...hoaFacts.map((h) => h.factId)],
        palaceRole: c.node.role,
        palaceName: c.node.palaceName,
        palaceBranch: c.node.palaceBranch,
        axes,
        label: name,
        explanationKey: c.record.explanationKey,
        sourceIds: knowledge.minorStars.sourceIds,
        knowledgeStatus: status,
        starName: name,
        starBrightness: c.fact.brightness,
        familyId: c.record.familyId,
        familyLabel: family?.label,
        traitTags: c.record.traitTags,
        diminishingGroup: family?.diminishingGroup,
        diminishingRank: index,
        diminishingFactor: factor,
        sourceKind: "natal",
        transformation: hoaFacts[0]?.transformation,
      });
    });
  }

  return out;
}

function collectChangShengEvidence(
  ctx: CollectEvidenceContext,
): PalaceEvidence[] {
  const { frame, knowledge } = ctx;
  const status = knowledgeStatus(knowledge);
  const out: PalaceEvidence[] = [];

  for (const node of frame.nodes) {
    for (const fact of nodeFacts(ctx, node)) {
      if (fact.kind !== "chang-sheng" || !fact.changShengStage) continue;
      const record = knowledge.changSheng.stages.find(
        (s) => s.stage === fact.changShengStage,
      );
      if (!record) continue;
      const axes = multiplyAxes(
        axesFromSeed(record.axes),
        node.geometryWeight,
      );
      out.push({
        id: `ev:chang-sheng:${node.palaceIndex}:${fact.changShengStage}`,
        category: "chang-sheng",
        factIds: [fact.id],
        palaceRole: node.role,
        palaceName: node.palaceName,
        palaceBranch: node.palaceBranch,
        axes,
        label: fact.changShengStage,
        explanationKey: `chang-sheng.${fact.changShengStage}`,
        sourceIds: knowledge.changSheng.sourceIds,
        knowledgeStatus: status,
        sourceKind: "natal",
      });
    }
  }
  return out;
}

/**
 * Apply Tuần/Triệt attenuation to evidence local to voided palaces.
 * Structural rules are included (one pass). Does not multiply the whole frame.
 */
export function applyLocalVoidAttenuation(
  ctx: CollectEvidenceContext,
  evidence: PalaceEvidence[],
): PalaceEvidence[] {
  const { frame, knowledge } = ctx;
  const status = knowledgeStatus(knowledge);
  const result: PalaceEvidence[] = [];
  const voidDeltaAdded = new Set<number>();

  for (const ev of evidence) {
    const palaceNode =
      frame.nodes.find(
        (n) =>
          n.role === ev.palaceRole &&
          n.palaceName === ev.palaceName &&
          n.palaceBranch === ev.palaceBranch,
      ) ?? frame.nodes.find((n) => n.palaceBranch === ev.palaceBranch);

    if (!palaceNode || ev.category === "void-environment") {
      result.push(ev);
      continue;
    }

    const voids = voidTypesOnPalace(nodeFacts(ctx, palaceNode));
    if (voids.length === 0) {
      result.push(ev);
      continue;
    }

    const cfg =
      voids.length >= 2
        ? knowledge.voidEnvironment.doubleVoid
        : knowledge.voidEnvironment.singleVoid;

    let axes = { ...ev.axes };
    if (ev.category === "major-star") {
      axes.support *= cfg.localMajorMagnitudeFactor;
      axes.pressure *= cfg.localMajorMagnitudeFactor;
    } else if (ev.category === "transformation") {
      axes.support *= cfg.localTransformationMagnitudeFactor;
      axes.pressure *= cfg.localTransformationMagnitudeFactor;
    } else if (ev.category === "structural-rule") {
      axes.support *= cfg.localStructuralMagnitudeFactor;
      axes.pressure *= cfg.localStructuralMagnitudeFactor;
    } else if (
      ev.category === "minor-star-family" ||
      ev.category === "chang-sheng"
    ) {
      axes.support *= cfg.localMinorMagnitudeFactor;
      axes.pressure *= cfg.localMinorMagnitudeFactor;
    }
    axes.activation *= cfg.activationFactor;

    result.push({ ...ev, axes });

    if (!voidDeltaAdded.has(palaceNode.palaceIndex)) {
      voidDeltaAdded.add(palaceNode.palaceIndex);
      result.push({
        id: `ev:void-attenuate:${palaceNode.palaceIndex}`,
        category: "void-environment",
        factIds: nodeFacts(ctx, palaceNode)
          .filter((f) => f.kind === "void-marker")
          .map((f) => f.id),
        palaceRole: palaceNode.role,
        palaceName: palaceNode.palaceName,
        palaceBranch: palaceNode.palaceBranch,
        axes: {
          ...emptyAxes(),
          stability: cfg.stabilityDelta,
        },
        label: voids.join("+"),
        explanationKey: "void.local-attenuation",
        sourceIds: knowledge.voidEnvironment.sourceIds,
        knowledgeStatus: status,
        sourceKind: "context",
      });
    }
  }

  return result;
}

export function collectPalaceEvidencePreVoid(
  ctx: CollectEvidenceContext,
): { evidence: PalaceEvidence[]; isVoidMajor: boolean; borrowedFactIds: Set<string> } {
  const focus = ctx.frame.nodes.find((n) => n.role === "focus");
  const focusMajors = focus ? majorFacts(nodeFacts(ctx, focus)) : [];
  const isVoidMajor = focusMajors.length === 0;
  const borrowedFactIds = new Set<string>();

  const evidence = [
    ...collectMajorEvidence(ctx, borrowedFactIds),
    ...collectMinorFamilyEvidence(ctx),
    ...collectChangShengEvidence(ctx),
  ];

  return { evidence, isVoidMajor, borrowedFactIds };
}

export function collectPalaceEvidence(
  ctx: CollectEvidenceContext,
): { evidence: PalaceEvidence[]; isVoidMajor: boolean; borrowedFactIds: Set<string> } {
  const pre = collectPalaceEvidencePreVoid(ctx);
  return {
    evidence: applyLocalVoidAttenuation(ctx, pre.evidence),
    isVoidMajor: pre.isVoidMajor,
    borrowedFactIds: pre.borrowedFactIds,
  };
}

export function emptyDiagnostics(): PalaceOverviewDiagnostics {
  return {
    unknownStars: [],
    duplicateFacts: [],
    contextOnlyFacts: [],
    unmappedTransformations: [],
    missingBrightness: [],
    ruleHits: [],
  };
}
