import type { ChartData, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type { DeepReadonly } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneFrame } from "./collect-major-frames";
import type { MajorFortuneDiagnostics, MajorFortuneEvidence } from "./types";

const ARCH_SOURCE_ID = "SRC-MFS-ENG-001";

interface CollectTransformationEvidenceInput {
  chart: ChartData;
  frame: MajorFortuneFrame;
  transformations: readonly MutagenRecord[] | undefined;
  knowledge: DeepReadonly<MajorFortuneScoringKnowledgeV0> | MajorFortuneScoringKnowledgeV0;
  diagnostics: MajorFortuneDiagnostics;
}

function palaceHasCanonicalStar(
  palace: NonNullable<MutagenRecord["palace"]>,
  targetStarName: string,
): boolean {
  const want = canonicalStarName(targetStarName);
  return (palace.stars ?? []).some((star) => canonicalStarName(star.name) === want);
}

/**
 * Tứ Hóa Đại Vận evidence — exact target star + resolved palace only.
 * Target star must exist in `record.palace.stars` under its canonical name.
 */
export function collectTransformationEvidence(
  input: CollectTransformationEvidenceInput,
): MajorFortuneEvidence[] {
  const { chart, frame, transformations, knowledge, diagnostics } = input;
  const out: MajorFortuneEvidence[] = [];
  if (!transformations) return out;

  for (const record of transformations) {
    if (!record.palace) {
      diagnostics.unresolvedTransformationTargets.push(
        `${record.mutagen}:${record.starName}:no-palace`,
      );
      continue;
    }

    if (!palaceHasCanonicalStar(record.palace, record.starName)) {
      diagnostics.unresolvedTransformationTargets.push(
        `${record.mutagen}:${record.starName}:palace=${record.palace.index}:absent`,
      );
      continue;
    }

    // Reject when the chart's palace at this index does not hold the star
    // (record.palace pointer disagrees with chart layout).
    const chartPalace = chart.palaces.find((p) => p.index === record.palace!.index);
    if (!chartPalace || !palaceHasCanonicalStar(chartPalace, record.starName)) {
      diagnostics.unresolvedTransformationTargets.push(
        `${record.mutagen}:${record.starName}:palace=${record.palace.index}:mismatch`,
      );
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
