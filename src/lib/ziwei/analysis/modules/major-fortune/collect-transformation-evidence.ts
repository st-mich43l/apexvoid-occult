import type { MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneFrame } from "./collect-major-frames";
import type { MajorFortuneDiagnostics, MajorFortuneEvidence } from "./types";

const ARCH_SOURCE_ID = "SRC-MFS-ENG-001";

interface CollectTransformationEvidenceInput {
  frame: MajorFortuneFrame;
  transformations: readonly MutagenRecord[] | undefined;
  knowledge: MajorFortuneScoringKnowledgeV0;
  diagnostics: MajorFortuneDiagnostics;
}

/**
 * Tứ Hóa Đại Vận evidence — exact target star + resolved palace only, never
 * spread across the whole TP4C frame. Only counted when the transformation's
 * resolved palace lies inside the frame being scored (overall or the given
 * domain). `transformations` is already school-capability-gated by
 * resolve-context.ts — this collector trusts it as given.
 */
export function collectTransformationEvidence(
  input: CollectTransformationEvidenceInput,
): MajorFortuneEvidence[] {
  const { frame, transformations, knowledge, diagnostics } = input;
  const out: MajorFortuneEvidence[] = [];
  if (!transformations) return out;

  for (const record of transformations) {
    if (!record.palace) {
      diagnostics.unresolvedTransformationTargets.push(`${record.mutagen}:${record.starName}`);
      continue;
    }

    const impact = knowledge.transformationImpact.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) continue;

    const targetNode = frame.nodes.find((n) => n.palaceIndex === record.palace?.index);
    if (!targetNode) continue;

    const canonical = canonicalStarName(record.starName);
    const physicalFactId = `transformation:${record.palace.index}:${record.mutagen}:${canonical}`;

    out.push({
      id: `mfs:${frame.scope}:${frame.domainId ?? "overall"}:transformation:${physicalFactId}:${targetNode.role}`,
      scope: frame.scope,
      domainId: frame.domainId,
      category: "transformation",
      physicalFactId,
      ruleId: impact.ruleId,
      targetPalaceIndex: record.palace.index,
      targetNatalPalaceName: record.palace.name,
      targetMajorPalaceName: targetNode.majorPalaceName,
      frameRole: targetNode.role,
      stackingGroup: impact.stackingGroup,
      rawAxes: { ...impact.axes },
      effectiveWeight: frame.frameWeight,
      weightedAxes: { ...impact.axes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    });
  }

  return out;
}
