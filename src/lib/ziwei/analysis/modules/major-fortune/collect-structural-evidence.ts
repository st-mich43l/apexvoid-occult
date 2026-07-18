import type { MajorFortuneScoringKnowledgeV0, MajorFortuneStructuralActivationRecord } from "../../knowledge/major-fortune-scoring";
import type { DeepReadonly } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneFrame, MajorFrameNode } from "./collect-major-frames";
import type { MajorFortuneEvidence } from "./types";

const ARCH_SOURCE_ID = "SRC-MFS-ENG-001";

interface CollectStructuralEvidenceInput {
  frame: MajorFortuneFrame;
  /** Transformation evidence already collected for this SAME frame — used
   * only to back "major-transformation-target-hit", which must never be
   * fabricated without a distinct transformation physical fact. */
  transformationEvidence: MajorFortuneEvidence[];
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0;
}

function focusMarkerEvidence(
  frame: MajorFortuneFrame,
  focusNode: MajorFrameNode,
  marker: MajorFortuneStructuralActivationRecord,
): MajorFortuneEvidence {
  const physicalFactId = `structural:${marker.markerId}:${frame.domainId ?? "overall"}:${focusNode.palaceIndex}`;
  return {
    id: `mfs:${frame.scope}:${frame.domainId ?? "overall"}:structural:${physicalFactId}`,
    scope: frame.scope,
    domainId: frame.domainId,
    category: "structural-activation",
    physicalFactId,
    ruleId: marker.ruleId,
    targetPalaceIndex: focusNode.palaceIndex,
    targetNatalPalaceName: focusNode.natalPalaceName,
    targetMajorPalaceName: focusNode.majorPalaceName,
    frameRole: "focus",
    stackingGroup: "structural-activation",
    rawAxes: { ...marker.axes },
    effectiveWeight: frame.frameWeight,
    weightedAxes: { ...marker.axes },
    factIds: [physicalFactId],
    sourceIds: [ARCH_SOURCE_ID],
    knowledgeStatus: "experimental",
  };
}

/**
 * Structural (activation-only) markers: the active Major Fortune Mệnh
 * marker applies once to the overall frame; the domain-focus marker applies
 * once per available domain frame; the transformation-target-hit marker
 * only fires when a distinct transformation physical fact already backs it
 * in this same frame — never fabricated on its own.
 */
export function collectStructuralEvidence(input: CollectStructuralEvidenceInput): MajorFortuneEvidence[] {
  const { frame, transformationEvidence, knowledge } = input;
  const out: MajorFortuneEvidence[] = [];

  const focusNode = frame.nodes.find((n) => n.role === "focus");
  if (focusNode) {
    if (frame.scope === "overall") {
      const marker = knowledge.structuralActivations.records.find((r) => r.markerId === "active-major-fortune-menh");
      if (marker) out.push(focusMarkerEvidence(frame, focusNode, marker));
    } else {
      const marker = knowledge.structuralActivations.records.find((r) => r.markerId === "major-domain-focus");
      if (marker) out.push(focusMarkerEvidence(frame, focusNode, marker));
    }
  }

  const hitMarker = knowledge.structuralActivations.records.find(
    (r) => r.markerId === "major-transformation-target-hit",
  );
  if (hitMarker) {
    for (const tx of transformationEvidence) {
      const physicalFactId = `structural:transformation-hit:${tx.physicalFactId}`;
      out.push({
        id: `mfs:${frame.scope}:${frame.domainId ?? "overall"}:structural:${physicalFactId}:${tx.frameRole}`,
        scope: frame.scope,
        domainId: frame.domainId,
        category: "structural-activation",
        physicalFactId,
        ruleId: hitMarker.ruleId,
        targetPalaceIndex: tx.targetPalaceIndex,
        targetNatalPalaceName: tx.targetNatalPalaceName,
        targetMajorPalaceName: tx.targetMajorPalaceName,
        frameRole: tx.frameRole,
        stackingGroup: "structural-activation",
        rawAxes: { ...hitMarker.axes },
        effectiveWeight: frame.frameWeight,
        weightedAxes: { ...hitMarker.axes },
        factIds: [physicalFactId],
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
      });
    }
  }

  return out;
}
