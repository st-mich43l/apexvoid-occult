import sourceRegistry from "../../../knowledge/palace-overview/v1/doctrine/source-registry.json";
import palaceMatrix from "../../../knowledge/palace-overview/v1/doctrine/palace-matrix.json";
import starClaims from "../../../knowledge/palace-overview/v1/doctrine/major-star-palace-claims.json";
import starSystems from "../../../knowledge/palace-overview/v1/doctrine/star-systems.json";
import vcdPolicy from "../../../knowledge/palace-overview/v1/doctrine/vcd-policy.json";
import tuhoaPalace from "../../../knowledge/palace-overview/v1/doctrine/tuhoa-palace.json";
import crossPalaceGraph from "../../../knowledge/palace-overview/v1/doctrine/cross-palace-graph.json";
import constraints from "../../../knowledge/palace-overview/v1/doctrine/constraints.json";
import parameterGroups from "../../../knowledge/palace-overview/v1/doctrine/parameter-groups.json";
import juanErMap from "../../../knowledge/palace-overview/v1/doctrine/quanshu-juan-er-map.json";
import conditionalClaimsRaw from "../../../knowledge/palace-overview/v1/doctrine/conditional-claims.json";
import type {
  HonestDoctrineCoverage,
  MajorStarPalaceClaim,
  PalaceDomainModifierCandidate,
} from "./types";

const PALACES = (palaceMatrix as { palaces: Array<{ palace: string }> }).palaces.map(
  (p) => p.palace,
);
const STARS = (starClaims as { stars: string[] }).stars;
const conditionalClaims = (conditionalClaimsRaw as { claims: MajorStarPalaceClaim[] })
  .claims;

function conditionsPresent(c: MajorStarPalaceClaim): boolean {
  const cond = c.conditions ?? {};
  return Object.values(cond).some((v) => Array.isArray(v) && v.length > 0);
}

export function expandMajorStarPalaceMatrix(): Array<{
  star: string;
  palace: string;
  status: "UNKNOWN" | "claimed";
  supportTendency: string;
  sourceIds: string[];
  claimIds: string[];
}> {
  const key = (s: string, p: string) => `${s}::${p}`;
  const byPair = new Map<string, MajorStarPalaceClaim[]>();
  for (const c of conditionalClaims) {
    const k = key(c.star, c.palace);
    const list = byPair.get(k) ?? [];
    list.push(c);
    byPair.set(k, list);
  }
  const out: Array<{
    star: string;
    palace: string;
    status: "UNKNOWN" | "claimed";
    supportTendency: string;
    sourceIds: string[];
    claimIds: string[];
  }> = [];
  for (const star of STARS) {
    for (const palace of PALACES) {
      const hits = byPair.get(key(star, palace));
      if (!hits || hits.length === 0) {
        out.push({
          star,
          palace,
          status: "UNKNOWN",
          supportTendency: "UNKNOWN",
          sourceIds: [],
          claimIds: [],
        });
        continue;
      }
      out.push({
        star,
        palace,
        status: "claimed",
        supportTendency: hits[0]!.tendency.support ?? "unspecified",
        sourceIds: [...new Set(hits.flatMap((h) => h.sourceIds))],
        claimIds: hits.map((h) => h.claimId),
      });
    }
  }
  return out;
}

export function buildPalaceDomainCandidates(
  palaceName: string,
  starNames: string[],
): PalaceDomainModifierCandidate[] {
  const overlay = conditionalClaims.filter(
    (c) => c.palace === palaceName && starNames.includes(c.star),
  );
  return overlay.map((c) => ({
    claimIds: [c.claimId],
    starOrSystem: c.star,
    palace: c.palace,
    tendency: JSON.stringify(c.tendency),
    strengthOrdinal: c.magnitudeOrdinal === "unspecified" ? null : (c.magnitudeOrdinal ?? null),
    numericDelta: null,
    status: "research-only" as const,
  }));
}

export function loadDoctrinePack() {
  return {
    sourceRegistry,
    palaceMatrix,
    starClaims,
    starSystems,
    vcdPolicy,
    tuhoaPalace,
    crossPalaceGraph,
    constraints,
    parameterGroups,
    juanErMap,
    conditionalClaims,
  };
}

export function unknownStarPalaceCellCount(): number {
  return expandMajorStarPalaceMatrix().filter((c) => c.status === "UNKNOWN").length;
}

function sourceTier(sourceId: string): string {
  const src = (
    sourceRegistry as { sources: Array<{ id: string; tier: string }> }
  ).sources.find((s) => s.id === sourceId);
  return src?.tier ?? "unknown";
}

export function honestDoctrineCoverage(): HonestDoctrineCoverage {
  const matrix = expandMajorStarPalaceMatrix();
  const uniqueClaimedPairs = matrix.filter((c) => c.status === "claimed").length;
  const unknownPairs = matrix.filter((c) => c.status === "UNKNOWN").length;
  const synthesis = (
    starClaims as { palaceClaims: Array<{ adjudication: string }> }
  ).palaceClaims.filter((c) => c.adjudication === "EXPERT_SYNTHESIS").length;

  const directPrimaryClaims = conditionalClaims.filter(
    (c) => c.adjudication === "VERIFIED_PRIMARY" && !conditionsPresent(c),
  ).length;
  const conditionalPrimaryClaims = conditionalClaims.filter(
    (c) => c.adjudication === "VERIFIED_PRIMARY" && conditionsPresent(c),
  ).length;
  const schoolSpecificClaims = conditionalClaims.filter(
    (c) => c.school !== "classical-shared",
  ).length;
  const unresolvedConditions = conditionalClaims.filter(conditionsPresent).length;

  let contradictedPairs = 0;
  const byPair = new Map<string, MajorStarPalaceClaim[]>();
  for (const c of conditionalClaims) {
    const k = `${c.star}::${c.palace}`;
    const list = byPair.get(k) ?? [];
    list.push(c);
    byPair.set(k, list);
  }
  for (const group of byPair.values()) {
    const uncond = group.filter((c) => !conditionsPresent(c));
    const ups = uncond.some((c) => c.tendency.support === "up");
    const downs = uncond.some((c) => c.tendency.support === "down");
    if (ups && downs) contradictedPairs += 1;
  }

  const byPalace: Record<string, number> = {};
  const byStar: Record<string, number> = {};
  const bySchool: Record<string, number> = {};
  const bySourceTier: Record<string, number> = {};
  for (const c of conditionalClaims) {
    byPalace[c.palace] = (byPalace[c.palace] ?? 0) + 1;
    byStar[c.star] = (byStar[c.star] ?? 0) + 1;
    bySchool[c.school] = (bySchool[c.school] ?? 0) + 1;
    for (const sid of c.sourceIds) {
      const t = sourceTier(sid);
      bySourceTier[t] = (bySourceTier[t] ?? 0) + 1;
    }
  }

  return {
    directPrimaryClaims,
    conditionalPrimaryClaims,
    schoolSpecificClaims,
    expertSynthesisClaims: synthesis,
    unknownPairs,
    contradictedPairs,
    unresolvedConditions,
    uniqueClaimedPairs,
    cartesianCells: STARS.length * PALACES.length,
    byPalace,
    byStar,
    bySchool,
    bySourceTier,
  };
}

const EXACT_LOCATORS = new Set(["EXACT_SECTION", "EXACT_LINE_OR_PARAGRAPH", "PAGE"]);

export function verifiedPrimaryRequiresExactLocator(): string[] {
  const errors: string[] = [];
  const sources = (
    sourceRegistry as {
      sources: Array<{ id: string; adjudication: string; locatorType: string }>;
    }
  ).sources;
  for (const s of sources) {
    if (s.adjudication === "VERIFIED_PRIMARY" && !EXACT_LOCATORS.has(s.locatorType)) {
      errors.push(`source ${s.id} VERIFIED_PRIMARY without exact locator`);
    }
  }
  for (const c of conditionalClaims) {
    if (c.adjudication === "VERIFIED_PRIMARY" && !EXACT_LOCATORS.has(c.locatorType)) {
      errors.push(`claim ${c.claimId} VERIFIED_PRIMARY without exact locator`);
    }
    if (c.numericDelta !== null) {
      errors.push(`claim ${c.claimId} numericDelta must be null`);
    }
  }
  return errors;
}
