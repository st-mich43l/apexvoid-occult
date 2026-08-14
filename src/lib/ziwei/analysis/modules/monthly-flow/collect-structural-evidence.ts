import type { MonthlyFlowFocusMarkersCatalog } from "../../knowledge/monthly-flow";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowEvidenceFrame,
  MonthlyFlowFrameRole,
  MonthlyFlowScoringScope,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

export interface CollectStructuralEvidenceInput {
  domain: MonthlyFlowScoringScope;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: MonthlyFlowEvidenceFrame;
  focusMarkers: MonthlyFlowFocusMarkersCatalog;
}

/**
 * Structural (activation-only) monthly markers per role. The supplied
 * scoring frame can be a real Annual Axes domain frame or the month-wide
 * overall frame, so overall scoring never needs a fabricated domain id.
 */
export function collectStructuralEvidence(
  input: CollectStructuralEvidenceInput,
): MonthlyFlowEvidence[] {
  const { domain, monthKey, monthlyFrame, annualDomainFrame, focusMarkers } = input;
  const out: MonthlyFlowEvidence[] = [];

  for (const node of monthlyFrame.nodes) {
    if (!annualDomainFrame.indexSet.has(node.palaceIndex)) continue;

    const marker = focusMarkers.records.find((r) => r.frameRole === node.role);
    if (!marker) continue;

    const monthlyRole: MonthlyFlowFrameRole = node.role;
    const annualRole: MonthlyFlowFrameRole =
      annualDomainFrame.roleByIndex.get(node.palaceIndex) ?? "outside";

    const physicalFactId = `structural:${marker.markerId}:${node.palaceIndex}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:structural-activation:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "structural-activation",
      physicalFactId,
      ruleId: marker.ruleId,
      targetPalaceIndex: node.palaceIndex,
      targetNatalPalaceName: node.natalPalaceName,
      targetAnnualPalaceName: node.annualPalaceName,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: "structural-activation",
      rawAxes: { ...marker.axes },
      effectiveWeight: 1,
      weightedAxes: { ...marker.axes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    });
  }

  return out;
}