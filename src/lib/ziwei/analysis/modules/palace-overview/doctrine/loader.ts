import sourceRegistry from "../../../knowledge/palace-overview/v1/doctrine/source-registry.json";
import palaceMatrix from "../../../knowledge/palace-overview/v1/doctrine/palace-matrix.json";
import starClaims from "../../../knowledge/palace-overview/v1/doctrine/major-star-palace-claims.json";
import starSystems from "../../../knowledge/palace-overview/v1/doctrine/star-systems.json";
import vcdPolicy from "../../../knowledge/palace-overview/v1/doctrine/vcd-policy.json";
import tuhoaPalace from "../../../knowledge/palace-overview/v1/doctrine/tuhoa-palace.json";
import crossPalaceGraph from "../../../knowledge/palace-overview/v1/doctrine/cross-palace-graph.json";
import constraints from "../../../knowledge/palace-overview/v1/doctrine/constraints.json";
import parameterGroups from "../../../knowledge/palace-overview/v1/doctrine/parameter-groups.json";
import type { PalaceDomainModifierCandidate } from "./types";

const PALACES = (palaceMatrix as { palaces: Array<{ palace: string }> }).palaces.map(
  (p) => p.palace,
);
const STARS = (starClaims as { stars: string[] }).stars;
const overlays = (
  starClaims as {
    palaceClaims: Array<{
      star: string;
      palace: string;
      supportTendency: string;
      strengthOrdinal: string;
      sourceIds: string[];
    }>;
  }
).palaceClaims;

export function expandMajorStarPalaceMatrix(): Array<{
  star: string;
  palace: string;
  status: "UNKNOWN" | "claimed";
  supportTendency: string;
  sourceIds: string[];
}> {
  const key = (s: string, p: string) => `${s}::${p}`;
  const overlay = new Map(overlays.map((c) => [key(c.star, c.palace), c]));
  const out: Array<{
    star: string;
    palace: string;
    status: "UNKNOWN" | "claimed";
    supportTendency: string;
    sourceIds: string[];
  }> = [];
  for (const star of STARS) {
    for (const palace of PALACES) {
      const hit = overlay.get(key(star, palace));
      if (!hit) {
        out.push({
          star,
          palace,
          status: "UNKNOWN",
          supportTendency: "UNKNOWN",
          sourceIds: [],
        });
        continue;
      }
      out.push({
        star,
        palace,
        status: "claimed",
        supportTendency: hit.supportTendency,
        sourceIds: hit.sourceIds,
      });
    }
  }
  return out;
}

export function buildPalaceDomainCandidates(
  palaceName: string,
  starNames: string[],
): PalaceDomainModifierCandidate[] {
  const overlay = overlays.filter(
    (c) => c.palace === palaceName && starNames.includes(c.star),
  );
  return overlay.map((c) => ({
    claimIds: c.sourceIds,
    starOrSystem: c.star,
    palace: c.palace,
    tendency: c.supportTendency,
    strengthOrdinal: c.strengthOrdinal === "unknown" ? null : c.strengthOrdinal,
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
  };
}

export function unknownStarPalaceCellCount(): number {
  return expandMajorStarPalaceMatrix().filter((c) => c.status === "UNKNOWN").length;
}
