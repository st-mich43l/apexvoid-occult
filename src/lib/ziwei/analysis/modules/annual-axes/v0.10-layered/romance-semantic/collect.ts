import type { ChartData } from "@/types/chart";
import { analyzeAllPalaces } from "../../../palace-overview";
import type { PalaceOverviewResult } from "../../../palace-overview/types";
import {
  loadDoctrinePack,
  verifiedPrimaryRequiresExactLocator,
} from "../../../palace-overview/doctrine/loader";
import type { MajorStarPalaceClaim } from "../../../palace-overview/doctrine/types";
import {
  aggregateConditionState,
  buildPalaceFactContext,
  resolveClaimConditions,
} from "./resolve-conditions";
import type {
  RomanceMagnitudeOrdinal,
  RomanceSemanticAdjudication,
  RomanceSemanticClaimResolution,
  RomanceSemanticConflict,
  RomanceTendency,
} from "./types";

export const LEGACY_ROMANCE_ANCHORS = ["Phu Thê", "Tử Tức"] as const;
const RESEARCH_COMPARISON_ANCHORS = ["Phúc Đức", "Mệnh"] as const;
export const ALL_ROMANCE_AUDIT_PALACES = [
  ...LEGACY_ROMANCE_ANCHORS,
  ...RESEARCH_COMPARISON_ANCHORS,
] as const;

const NAM_PHAI_SCHOOLS = new Set(["classical-shared", "nam-phai"]);
const TIER_A = new Set(["VERIFIED_PRIMARY", "VERIFIED_SCHOOL"]);
const TIER_B = new Set(["EXPERT_SYNTHESIS"]);
const EXACT_LOCATORS = new Set([
  "EXACT_SECTION",
  "EXACT_LINE_OR_PARAGRAPH",
  "PAGE",
]);

export function loadRomanceDoctrineClaims(): MajorStarPalaceClaim[] {
  return loadDoctrinePack().conditionalClaims;
}

export function claimsForPalace(
  claims: MajorStarPalaceClaim[],
  palace: string,
): MajorStarPalaceClaim[] {
  return claims
    .filter((c) => c.palace === palace)
    .slice()
    .sort((a, b) => a.claimId.localeCompare(b.claimId));
}

function sourceRegistryMap(): Map<
  string,
  { adjudication: string; locatorType: string; tier: string }
> {
  const pack = loadDoctrinePack().sourceRegistry as {
    sources: Array<{
      id: string;
      adjudication: string;
      locatorType: string;
      tier: string;
    }>;
  };
  return new Map(pack.sources.map((s) => [s.id, s]));
}

function claimTier(
  adjudication: string,
): RomanceSemanticClaimResolution["tier"] {
  if (TIER_A.has(adjudication)) return "A";
  if (TIER_B.has(adjudication)) return "B";
  if (adjudication === "ENGINEERING_POLICY") return "engineering";
  return "non-admitted";
}

/**
 * Gate school / adjudication / source locator integrity (fail closed).
 * Returns status if rejected before condition resolution; otherwise null.
 */
export function gateClaimAdmission(
  claim: MajorStarPalaceClaim,
): Extract<
  RomanceSemanticClaimResolution["status"],
  "rejected-school" | "rejected-source"
> | null {
  if (!NAM_PHAI_SCHOOLS.has(claim.school)) {
    return "rejected-school";
  }

  if (claim.adjudication === "UNVERIFIED") {
    return "rejected-source";
  }
  if (claim.adjudication === "ENGINEERING_POLICY") {
    return "rejected-source";
  }
  if (claim.numericDelta !== null) {
    return "rejected-source";
  }
  if (!claim.sourceIds || claim.sourceIds.length === 0) {
    return "rejected-source";
  }

  const sources = sourceRegistryMap();
  for (const sid of claim.sourceIds) {
    const src = sources.get(sid);
    if (!src) return "rejected-source";
  }

  if (TIER_A.has(claim.adjudication)) {
    if (!EXACT_LOCATORS.has(claim.locatorType)) {
      return "rejected-source";
    }
    // Mirror doctrine pack integrity: verified primary sources must also be exact.
    const packErrors = verifiedPrimaryRequiresExactLocator();
    if (
      claim.adjudication === "VERIFIED_PRIMARY" &&
      packErrors.some((e) => e.includes(claim.claimId) || e.includes("source "))
    ) {
      // Only fail this claim if the error mentions it or its sources.
      const touches = packErrors.some(
        (e) =>
          e.includes(claim.claimId) ||
          claim.sourceIds.some((sid) => e.includes(sid)),
      );
      if (touches) return "rejected-source";
    }
  }

  return null;
}

export function resolveClaimAgainstPalace(
  claim: MajorStarPalaceClaim,
  palace: PalaceOverviewResult,
): RomanceSemanticClaimResolution {
  const gate = gateClaimAdmission(claim);
  const base = {
    claimId: claim.claimId,
    palace: claim.palace,
    starOrSystem: claim.star,
    school: claim.school,
    adjudication: claim.adjudication as RomanceSemanticAdjudication,
    sourceIds: [...claim.sourceIds],
    locator: claim.locator,
    locatorType: claim.locatorType,
    tendency: { ...claim.tendency } as RomanceTendency,
    magnitudeOrdinal: (claim.magnitudeOrdinal === "unspecified"
      ? "unspecified"
      : (claim.magnitudeOrdinal ?? null)) as RomanceMagnitudeOrdinal,
    tier: claimTier(claim.adjudication),
  };

  if (gate) {
    return {
      ...base,
      status: gate,
      conditions: [],
    };
  }

  const ctx = buildPalaceFactContext(palace);
  if (!ctx.majorByName.has(claim.star) && !ctx.starNames.includes(claim.star)) {
    return {
      ...base,
      status: "rejected-condition",
      conditions: [
        {
          kind: "coStars",
          required: [claim.star],
          observed: ctx.starNames,
          state: "not-satisfied",
          detail: `claim star ${claim.star} not observed in ${palace.palaceName}`,
        },
      ],
    };
  }

  const conditions = resolveClaimConditions(claim, ctx);
  const agg = aggregateConditionState(conditions);
  if (agg === "unresolved") {
    return { ...base, status: "unresolved-condition", conditions };
  }
  if (agg === "not-satisfied") {
    return { ...base, status: "rejected-condition", conditions };
  }

  // Expert synthesis is Tier B: admissible for research visibility but marked.
  return { ...base, status: "admitted", conditions };
}

export function detectTendencyConflicts(
  admitted: RomanceSemanticClaimResolution[],
): RomanceSemanticConflict[] {
  type Bucket = {
    claimIds: string[];
    ups: boolean;
    downs: boolean;
  };
  const buckets = new Map<string, Bucket>();

  for (const c of admitted) {
    for (const axis of ["support", "pressure", "stability", "activation"] as const) {
      const dir = c.tendency[axis];
      if (!dir) continue;
      const key = `${c.palace}::${c.starOrSystem}::${axis}`;
      const b = buckets.get(key) ?? { claimIds: [], ups: false, downs: false };
      b.claimIds.push(c.claimId);
      if (dir === "up") b.ups = true;
      if (dir === "down") b.downs = true;
      buckets.set(key, b);
    }
  }

  const conflicts: RomanceSemanticConflict[] = [];
  for (const [key, b] of [...buckets.entries()].sort((a, c) =>
    a[0].localeCompare(c[0]),
  )) {
    if (!(b.ups && b.downs)) continue;
    const [palace, starOrSystem, axis] = key.split("::") as [
      string,
      string,
      "support" | "pressure" | "stability" | "activation",
    ];
    conflicts.push({
      key,
      palace,
      starOrSystem,
      axis,
      claimIds: [...new Set(b.claimIds)].sort((a, c) => a.localeCompare(c)),
      directions: ["up", "down"],
      note: `contradictory admitted ${axis} tendencies for ${starOrSystem} @ ${palace}`,
    });
  }
  return conflicts;
}

export function loadRomancePalaceResults(chart: ChartData): PalaceOverviewResult[] {
  return analyzeAllPalaces(chart, { school: "nam-phai" }).results;
}

export function palaceByName(
  results: PalaceOverviewResult[],
  name: string,
): PalaceOverviewResult | undefined {
  return results.find((r) => r.palaceName === name);
}
