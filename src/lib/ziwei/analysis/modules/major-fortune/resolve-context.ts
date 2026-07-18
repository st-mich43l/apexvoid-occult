import type { ChartData, MutagenRecord } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import type { MajorFortuneDomain } from "../../contracts/major-fortune";
import type { MajorFortuneScoringKnowledgeV0 } from "../../knowledge/major-fortune-scoring";
import type { MajorFortuneCapabilities, MajorFortuneDiagnostics } from "./types";

/**
 * Everything the scorer needs, already resolved by Calculation Core. This
 * module never computes any of these fields itself — only reads them.
 */
export interface ResolvedMajorFortuneContext {
  school: ZiweiSchool;
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
  activePalaceBranch: string;
  fortuneStem?: string;
  majorPalaceLabels?: ReadonlyMap<number, MajorFortuneDomain>;
  transformations?: readonly MutagenRecord[];
}

const FORBIDDEN_ANNUAL_FIELDS: Array<{ name: string; present: (chart: ChartData) => boolean }> = [
  { name: "annualStars", present: (c) => Boolean(c.annualStars && c.annualStars.length > 0) },
  { name: "annualMutagens", present: (c) => Boolean(c.annualMutagens && c.annualMutagens.length > 0) },
  { name: "taiTuePalace", present: (c) => Boolean(c.taiTuePalace) },
  { name: "smallLimitPalace", present: (c) => Boolean(c.smallLimitPalace) },
  { name: "isTaiTuePalace", present: (c) => c.palaces.some((p) => p.isTaiTuePalace) },
  { name: "isSmallLimitPalace", present: (c) => c.palaces.some((p) => p.isSmallLimitPalace) },
  { name: "isLuuNienDaiVan", present: (c) => c.palaces.some((p) => p.isLuuNienDaiVan) },
  { name: "monthlyPalaces", present: (c) => Boolean(c.monthlyPalaces && c.monthlyPalaces.length > 0) },
  { name: "flowMonths", present: (c) => c.palaces.some((p) => p.flowMonths && p.flowMonths.length > 0) },
];

function recordForbiddenAnnualFacts(chart: ChartData, diagnostics: MajorFortuneDiagnostics): void {
  for (const field of FORBIDDEN_ANNUAL_FIELDS) {
    if (field.present(chart)) diagnostics.forbiddenAnnualFacts.push(field.name);
  }
}

function resolveMajorPalaceLabels(
  chart: ChartData,
  knowledge: MajorFortuneScoringKnowledgeV0,
  capabilities: MajorFortuneCapabilities,
  diagnostics: MajorFortuneDiagnostics,
): ReadonlyMap<number, MajorFortuneDomain> | undefined {
  const labelToDomain = new Map<string, MajorFortuneDomain>(
    knowledge.domainDefinitions.domains.map((d) => [d.majorPalaceName, d.domainId]),
  );

  const resolvedEntries = chart.palaces
    .filter((p) => Boolean(p.majorPalaceName) && labelToDomain.has(p.majorPalaceName as string))
    .map((p) => ({
      palaceIndex: p.index,
      domainId: labelToDomain.get(p.majorPalaceName as string) as MajorFortuneDomain,
    }));

  if (resolvedEntries.length === 0) return undefined;

  if (!capabilities.supportsTwelveDomainOverlay) {
    diagnostics.unsupportedSchoolCapability.push("majorPalaceName:twelve-domain-overlay");
    return undefined;
  }

  const byDomain = new Map<MajorFortuneDomain, number[]>();
  for (const entry of resolvedEntries) {
    const list = byDomain.get(entry.domainId) ?? [];
    list.push(entry.palaceIndex);
    byDomain.set(entry.domainId, list);
  }

  const duplicated = [...byDomain.entries()].filter(([, indices]) => indices.length > 1);
  if (duplicated.length > 0) {
    for (const [domainId, indices] of duplicated) {
      diagnostics.duplicateMajorPalaceLabels.push(`${domainId}:${indices.join(",")}`);
    }
    return undefined;
  }

  const expectedDomains = [...labelToDomain.values()];
  const missing = expectedDomains.filter((domainId) => !byDomain.has(domainId));
  if (missing.length > 0) {
    diagnostics.incompleteMajorPalaceLabels.push(...missing);
    return undefined;
  }

  const map = new Map<number, MajorFortuneDomain>();
  for (const [domainId, indices] of byDomain) {
    const index = indices[0];
    if (index !== undefined) map.set(index, domainId);
  }
  return map;
}

function resolveTransformations(
  chart: ChartData,
  fortuneStem: string | undefined,
  capabilities: MajorFortuneCapabilities,
  diagnostics: MajorFortuneDiagnostics,
): readonly MutagenRecord[] | undefined {
  const majorMutagens = chart.majorMutagens ?? [];
  if (majorMutagens.length === 0) return undefined;

  if (!capabilities.supportsMajorFortuneTransformations) {
    diagnostics.forbiddenSchoolTransformations.push("majorMutagens:transformations-disabled");
    return undefined;
  }

  if (!fortuneStem) {
    diagnostics.invalidResolvedContext.push("majorMutagens present but fortune stem unresolved");
    return undefined;
  }

  return majorMutagens;
}

/**
 * Resolve the typed adapter context from already-computed ChartData. Never
 * infers, calculates or repairs — missing/invalid resolved fields become
 * diagnostics and a `null` context (global unavailable), not a fabricated
 * default.
 */
export function resolveMajorFortuneContext(
  chart: ChartData,
  school: ZiweiSchool,
  knowledge: MajorFortuneScoringKnowledgeV0,
  capabilities: MajorFortuneCapabilities,
  diagnostics: MajorFortuneDiagnostics,
): ResolvedMajorFortuneContext | null {
  recordForbiddenAnnualFacts(chart, diagnostics);

  const activePalace = chart.majorFortunePalace;
  if (!activePalace) {
    diagnostics.noActiveMajorFortune.push("chart:no-active-major-fortune-palace");
    return null;
  }

  const cycleIndex = activePalace.majorFortune?.order;
  const startAge = activePalace.majorFortune?.start;
  const endAge = activePalace.majorFortune?.end;
  if (cycleIndex === undefined || startAge === undefined || endAge === undefined) {
    diagnostics.invalidResolvedContext.push("majorFortunePalace.majorFortune incomplete");
    return null;
  }

  const fortuneStem = activePalace.stem;
  const majorPalaceLabels = resolveMajorPalaceLabels(chart, knowledge, capabilities, diagnostics);
  const transformations = resolveTransformations(chart, fortuneStem, capabilities, diagnostics);

  return {
    school,
    cycleIndex,
    startAge,
    endAge,
    activePalaceIndex: activePalace.index,
    activePalaceBranch: activePalace.branch,
    fortuneStem,
    majorPalaceLabels,
    transformations,
  };
}
