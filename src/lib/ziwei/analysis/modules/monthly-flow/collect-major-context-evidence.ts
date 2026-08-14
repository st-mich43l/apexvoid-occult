import type { ChartData, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../facts";
import type { AnnualMutagenImpactCatalog } from "../../knowledge/annual-axes";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowEvidence,
  MonthlyFlowEvidenceFrame,
  MonthlyFlowFrameRole,
  MonthlyFlowScoringScope,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

function pushRolesForTarget(
  targetIndex: number,
  monthlyFrame: MonthlyFrame,
  scoringFrame: MonthlyFlowEvidenceFrame,
): { monthlyRole: MonthlyFlowFrameRole; annualRole: MonthlyFlowFrameRole } {
  const monthlyRole: MonthlyFlowFrameRole = monthlyFrame.indexSet.has(targetIndex)
    ? monthlyFrame.nodes.find((n) => n.palaceIndex === targetIndex)!.role
    : "outside";
  const annualRole: MonthlyFlowFrameRole =
    scoringFrame.roleByIndex.get(targetIndex) ?? "outside";
  return { monthlyRole, annualRole };
}

function collectMajorMutagensInBothFrames(
  chart: ChartData,
  domain: MonthlyFlowScoringScope,
  monthKey: string,
  monthlyFrame: MonthlyFrame,
  scoringFrame: MonthlyFlowEvidenceFrame,
  records: readonly MutagenRecord[] | undefined,
  impactCatalog: AnnualMutagenImpactCatalog,
): MonthlyFlowEvidence[] {
  const out: MonthlyFlowEvidence[] = [];
  if (!records) return out;

  for (const record of records) {
    if (!record.palace) continue;
    const targetIndex = record.palace.index;
    if (!monthlyFrame.indexSet.has(targetIndex)) continue;
    if (!scoringFrame.indexSet.has(targetIndex)) continue;

    const canonical = canonicalStarName(record.starName);
    const chartPalace = chart.palaces.find((p) => p.index === targetIndex);
    if (!chartPalace) continue;
    const holds = (chartPalace.stars ?? []).some(
      (s) => canonicalStarName(s.name) === canonical,
    );
    if (!holds) continue;

    const impact = impactCatalog.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) continue;

    const { monthlyRole, annualRole } = pushRolesForTarget(
      targetIndex,
      monthlyFrame,
      scoringFrame,
    );

    const physicalFactId = `major-transformation-context:${targetIndex}:${record.mutagen}:${canonical}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:major-transformation-context:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "major-transformation-context",
      physicalFactId,
      ruleId: impact.ruleId || "RULE-MFS-MO-MAJOR-MUTAGEN-V0",
      targetPalaceIndex: targetIndex,
      targetNatalPalaceName: record.palace.name,
      targetAnnualPalaceName: chartPalace.annualPalaceName ?? null,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: impact.stackingGroup,
      rawAxes: { ...impact.axes },
      effectiveWeight: 1,
      weightedAxes: { ...impact.axes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    });
  }

  return out;
}

function collectActiveMajorPalace(
  chart: ChartData,
  domain: MonthlyFlowScoringScope,
  monthKey: string,
  monthlyFrame: MonthlyFrame,
  scoringFrame: MonthlyFlowEvidenceFrame,
  activationAxes: { support: 0; pressure: 0; stability: 0; activation: number },
): MonthlyFlowEvidence[] {
  const active = chart.majorFortunePalace;
  if (!active) return [];
  const targetIndex = active.index;
  if (!monthlyFrame.indexSet.has(targetIndex)) return [];
  if (!scoringFrame.indexSet.has(targetIndex)) return [];

  const { monthlyRole, annualRole } = pushRolesForTarget(
    targetIndex,
    monthlyFrame,
    scoringFrame,
  );
  const physicalFactId = `major-active-palace:${targetIndex}`;

  return [
    {
      id: `mfs-monthly:${monthKey}:${domain}:major-active-palace-context:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "major-active-palace-context",
      physicalFactId,
      ruleId: "RULE-MFS-MO-MAJOR-ACTIVE-PALACE-V0",
      targetPalaceIndex: targetIndex,
      targetNatalPalaceName: active.name,
      targetAnnualPalaceName: active.annualPalaceName ?? null,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: "major-active-palace",
      rawAxes: { ...activationAxes },
      effectiveWeight: 1,
      weightedAxes: { ...activationAxes },
      factIds: [physicalFactId],
      sourceIds: [ARCH_SOURCE_ID],
      knowledgeStatus: "experimental",
    },
  ];
}

export interface CollectMajorContextEvidenceInput {
  chart: ChartData;
  domain: MonthlyFlowScoringScope;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: MonthlyFlowEvidenceFrame;
  supportsMajorTransformations: boolean;
  annualMutagenImpact: AnnualMutagenImpactCatalog;
  activePalaceActivationAxes: {
    support: 0;
    pressure: 0;
    stability: 0;
    activation: number;
  };
}

/**
 * Major-Fortune context evidence — never re-scores Major Fortune. The
 * supplied scoring frame can be a domain frame or the month-wide overall
 * frame; only exact physical intersections are admitted.
 */
export function collectMajorContextEvidence(
  input: CollectMajorContextEvidenceInput,
): MonthlyFlowEvidence[] {
  const out: MonthlyFlowEvidence[] = [];

  if (input.supportsMajorTransformations) {
    out.push(
      ...collectMajorMutagensInBothFrames(
        input.chart,
        input.domain,
        input.monthKey,
        input.monthlyFrame,
        input.annualDomainFrame,
        input.chart.majorMutagens,
        input.annualMutagenImpact,
      ),
    );
  }

  out.push(
    ...collectActiveMajorPalace(
      input.chart,
      input.domain,
      input.monthKey,
      input.monthlyFrame,
      input.annualDomainFrame,
      input.activePalaceActivationAxes,
    ),
  );

  return out;
}