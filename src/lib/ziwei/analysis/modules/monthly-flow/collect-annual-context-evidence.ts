import type { ChartData, ChartStar, MutagenRecord } from "@/types/chart";
import { canonicalStarName, isVoidStarName } from "../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { AnnualMutagenImpactCatalog } from "../../knowledge/annual-axes";
import type { MonthlyFrame } from "./collect-monthly-frame";
import type {
  MonthlyFlowAxes,
  MonthlyFlowEvidence,
  MonthlyFlowEvidenceFrame,
  MonthlyFlowFrameRole,
  MonthlyFlowMonthDiagnostics,
  MonthlyFlowScoringScope,
} from "./types";

const ARCH_SOURCE_ID = "SRC-MONTHLY-ENG-001";

function starAxesFromNumericKnowledge(
  canonical: string,
  brightness: string | undefined,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): {
  axes: MonthlyFlowAxes;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  starClass: "major" | "minor";
} | { kind: "not-scored" } | null {
  const major = numericKnowledge.majorStars.stars.find((s) => s.name === canonical);
  if (major) {
    const status = numericKnowledge.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: MonthlyFlowAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numericKnowledge.majorStars.brightnessModifiers[brightness] ??
        numericKnowledge.majorStars.brightnessModifiers.Bình;
      if (modifier) {
        axes = {
          support: axes.support * modifier.supportFactor,
          pressure: axes.pressure * modifier.pressureFactor,
          stability: axes.stability + modifier.stabilityDelta,
          activation: axes.activation * modifier.activationFactor,
        };
      }
    }
    return {
      axes,
      sourceIds: numericKnowledge.majorStars.sourceIds,
      knowledgeStatus: status,
      starClass: "major",
    };
  }

  const minor = numericKnowledge.minorStars.stars.find((s) => s.canonicalName === canonical);
  if (minor && minor.scoringMode !== "direct") return { kind: "not-scored" };
  if (minor && minor.scoringMode === "direct") {
    const family = numericKnowledge.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return null;
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: MonthlyFlowAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy =
        numericKnowledge.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
      if (policy) {
        axes = {
          support: axes.support * policy.supportFactor,
          pressure: axes.pressure * policy.pressureFactor,
          stability: axes.stability + policy.stabilityDelta,
          activation: axes.activation * policy.activationFactor,
        };
      }
    }
    return {
      axes,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
      starClass: "minor",
    };
  }

  return null;
}

interface Context {
  chart: ChartData;
  domain: MonthlyFlowScoringScope;
  monthKey: string;
  monthlyFrame: MonthlyFrame;
  annualDomainFrame: MonthlyFlowEvidenceFrame;
  monthDiagnostics: MonthlyFlowMonthDiagnostics;
}

function pushRolesForTarget(
  targetIndex: number,
  ctx: Context,
): { monthlyRole: MonthlyFlowFrameRole; annualRole: MonthlyFlowFrameRole } {
  const monthlyRole: MonthlyFlowFrameRole = ctx.monthlyFrame.indexSet.has(targetIndex)
    ? ctx.monthlyFrame.nodes.find((n) => n.palaceIndex === targetIndex)!.role
    : "outside";
  const annualRole: MonthlyFlowFrameRole =
    ctx.annualDomainFrame.roleByIndex.get(targetIndex) ?? "outside";
  return { monthlyRole, annualRole };
}

function collectAnnualStarsInBothFrames(
  ctx: Context,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): MonthlyFlowEvidence[] {
  const { chart, domain, monthKey, monthlyFrame, annualDomainFrame, monthDiagnostics } = ctx;
  const out: MonthlyFlowEvidence[] = [];
  if (!chart.annualStars) return out;

  const seen = new Set<string>();

  for (const star of chart.annualStars as Array<ChartStar & { palace: { index: number; name: string; annualPalaceName?: string } }>) {
    const palaceIndex = star.palace.index;
    if (!monthlyFrame.indexSet.has(palaceIndex)) continue;
    if (!annualDomainFrame.indexSet.has(palaceIndex)) continue;
    if (isVoidStarName(star.name)) continue;

    const canonical = canonicalStarName(star.name);
    const physicalFactId = `annual-star:${palaceIndex}:${canonical}`;
    const identity = `${monthKey}|${domain}|${physicalFactId}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    const resolved = starAxesFromNumericKnowledge(canonical, star.brightness, numericKnowledge);
    if (!resolved) {
      monthDiagnostics.unknownStars.push(canonical);
      continue;
    }
    if ("kind" in resolved && resolved.kind === "not-scored") continue;
    if ("kind" in resolved) continue;

    const { monthlyRole, annualRole } = pushRolesForTarget(palaceIndex, ctx);
    const chartPalace = chart.palaces.find((p) => p.index === palaceIndex);

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:annual-star-context:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category: "annual-star-context",
      physicalFactId,
      ruleId:
        resolved.starClass === "major"
          ? "RULE-MFS-MO-ANNUAL-STAR-MAJOR-V0"
          : "RULE-MFS-MO-ANNUAL-STAR-MINOR-V0",
      targetPalaceIndex: palaceIndex,
      targetNatalPalaceName: chartPalace?.name ?? star.palace.name,
      targetAnnualPalaceName: chartPalace?.annualPalaceName ?? star.palace.annualPalaceName ?? null,
      monthlyFrameRole: monthlyRole,
      annualDomainRole: annualRole,
      stackingGroup: resolved.diminishingGroup ?? "major-star",
      rawAxes: { ...resolved.axes },
      effectiveWeight: 1,
      weightedAxes: { ...resolved.axes },
      factIds: [physicalFactId],
      sourceIds: resolved.sourceIds,
      knowledgeStatus: resolved.knowledgeStatus,
    });
  }

  return out;
}

function collectMutagensInBothFrames(
  ctx: Context,
  records: readonly MutagenRecord[] | undefined,
  category: "annual-transformation-context" | "major-transformation-context",
  ruleFallback: string,
  impactCatalog: AnnualMutagenImpactCatalog,
): MonthlyFlowEvidence[] {
  const { chart, domain, monthKey, monthlyFrame, annualDomainFrame } = ctx;
  const out: MonthlyFlowEvidence[] = [];
  if (!records) return out;

  for (const record of records) {
    if (!record.palace) continue;
    const targetIndex = record.palace.index;
    if (!monthlyFrame.indexSet.has(targetIndex)) continue;
    if (!annualDomainFrame.indexSet.has(targetIndex)) continue;

    const canonical = canonicalStarName(record.starName);
    const chartPalace = chart.palaces.find((p) => p.index === targetIndex);
    if (!chartPalace) continue;
    const holdsCanonical = (chartPalace.stars ?? []).some(
      (s) => canonicalStarName(s.name) === canonical,
    );
    if (!holdsCanonical) continue;

    const impact = impactCatalog.records.find((r) => r.mutagen === record.mutagen);
    if (!impact) continue;

    const { monthlyRole, annualRole } = pushRolesForTarget(targetIndex, ctx);
    const physicalFactId = `${category}:${targetIndex}:${record.mutagen}:${canonical}`;

    out.push({
      id: `mfs-monthly:${monthKey}:${domain}:${category}:${physicalFactId}:${monthlyRole}:${annualRole}`,
      domain,
      monthKey,
      category,
      physicalFactId,
      ruleId: impact.ruleId || ruleFallback,
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

export interface CollectAnnualContextEvidenceInput extends Context {
  numericKnowledge: PalaceOverviewKnowledgeV1;
  annualMutagenImpact: AnnualMutagenImpactCatalog;
}

/**
 * Annual context evidence inside the intersection of the monthly frame and
 * the supplied scoring frame. This supports both domain overlays and the
 * explicit month-wide overall scope without inventing a domain.
 */
export function collectAnnualContextEvidence(
  input: CollectAnnualContextEvidenceInput,
): MonthlyFlowEvidence[] {
  const ctx: Context = {
    chart: input.chart,
    domain: input.domain,
    monthKey: input.monthKey,
    monthlyFrame: input.monthlyFrame,
    annualDomainFrame: input.annualDomainFrame,
    monthDiagnostics: input.monthDiagnostics,
  };

  const stars = collectAnnualStarsInBothFrames(ctx, input.numericKnowledge);
  const mutagens = collectMutagensInBothFrames(
    ctx,
    input.chart.annualMutagens,
    "annual-transformation-context",
    "RULE-MFS-MO-ANNUAL-MUTAGEN-V0",
    input.annualMutagenImpact,
  );
  return [...stars, ...mutagens];
}