import type { ChartData, ChartStar } from "@/types/chart";
import type {
  AnnualAxesKnowledgeV13,
  V13DoctrineClaim,
  V13MagnitudeOrdinal,
} from "../../../knowledge/annual-axes/v0.13";
import { exactCanonicalStarName } from "../nam-phai-v08/star-identity";

type V13DoctrineDirection = "support" | "pressure" | "context";

export interface V13DoctrineEvidence {
  claimId: string;
  starName: string;
  palaceName: string;
  direction: V13DoctrineDirection;
  points: number;
  magnitudeOrdinal: V13MagnitudeOrdinal;
  sourceIds: string[];
  locator: string;
  specificity: number;
  admittedForNumeric: boolean;
  reason: string;
}

function canonical(value: string): string {
  return exactCanonicalStarName(value);
}

function findStar(stars: ChartStar[], name: string): ChartStar | undefined {
  const target = canonical(name);
  return stars.find((star) => canonical(star.name) === target);
}

function allPresent(stars: ChartStar[], required: string[] | undefined): boolean {
  if (!required || required.length === 0) return true;
  const observed = new Set(stars.map((star) => canonical(star.name)));
  return required.every((name) => observed.has(canonical(name)));
}

function conditionSpecificity(claim: V13DoctrineClaim): number {
  const c = claim.conditions ?? {};
  return (
    (c.brightness?.length ?? 0) +
    (c.coStars?.length ?? 0) +
    (c.supportStars?.length ?? 0) +
    (c.pressureStars?.length ?? 0) +
    (c.transformations?.length ?? 0)
  );
}

function conditionsSatisfied(claim: V13DoctrineClaim, stars: ChartStar[]): boolean {
  const host = findStar(stars, claim.star);
  if (!host) return false;
  const c = claim.conditions ?? {};

  if (c.brightness && c.brightness.length > 0) {
    if (!host.brightness || !c.brightness.includes(host.brightness)) return false;
  }
  if (!allPresent(stars, c.coStars)) return false;
  if (!allPresent(stars, c.supportStars)) return false;
  if (!allPresent(stars, c.pressureStars)) return false;

  if (c.transformations && c.transformations.length > 0) {
    const mutagens = new Set(
      stars
        .map((star) => star.mutagen)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    );
    if (!c.transformations.every((value) => mutagens.has(value))) return false;
  }

  return true;
}

function claimDirections(claim: V13DoctrineClaim): V13DoctrineDirection[] {
  const directions: V13DoctrineDirection[] = [];
  if (claim.tendency.support === "up") directions.push("support");
  if (claim.tendency.pressure === "up") directions.push("pressure");
  if (directions.length === 0) directions.push("context");
  return directions;
}

function ordinalPoints(
  ordinal: V13MagnitudeOrdinal,
  knowledge: AnnualAxesKnowledgeV13,
): number | null {
  return knowledge.ordinalPoints[ordinal] ?? null;
}

/**
 * Collect sourced qualitative claims as a research-only numeric fallback.
 *
 * Rules:
 * - only claims already validated by V0.13 knowledge loader are considered;
 * - conditions fail closed;
 * - a more-specific matched claim overrides a general claim for the same
 *   star+direction;
 * - V0.12 numeric evidence wins. The doctrine bridge only fills a missing
 *   physical-star direction and never double-counts it;
 * - unspecified ordinal and activation/stability-only claims remain context.
 */
export function collectDoctrineFallbackEvidence(input: {
  chart: ChartData;
  palaceIndex: number;
  palaceName: string;
  knowledge: AnnualAxesKnowledgeV13;
  alreadyScoredStars: ReadonlySet<string>;
}): V13DoctrineEvidence[] {
  const palace = input.chart.palaces.find((p) => p.index === input.palaceIndex);
  const stars = palace?.stars ?? [];
  const candidates = input.knowledge.bridge.claims
    .filter((claim) => claim.palace === input.palaceName)
    .filter((claim) => findStar(stars, claim.star))
    .filter((claim) => conditionsSatisfied(claim, stars));

  const expanded: Array<{
    claim: V13DoctrineClaim;
    direction: V13DoctrineDirection;
    specificity: number;
  }> = [];

  for (const claim of candidates) {
    const specificity = conditionSpecificity(claim);
    for (const direction of claimDirections(claim)) {
      expanded.push({ claim, direction, specificity });
    }
  }

  const selected = new Map<string, (typeof expanded)[number]>();
  for (const item of expanded) {
    const key = `${canonical(item.claim.star)}|${item.direction}`;
    const previous = selected.get(key);
    if (
      !previous ||
      item.specificity > previous.specificity ||
      (item.specificity === previous.specificity &&
        item.claim.claimId.localeCompare(previous.claim.claimId) < 0)
    ) {
      selected.set(key, item);
    }
  }

  return [...selected.values()]
    .sort(
      (a, b) =>
        canonical(a.claim.star).localeCompare(canonical(b.claim.star), "vi") ||
        a.direction.localeCompare(b.direction) ||
        a.claim.claimId.localeCompare(b.claim.claimId),
    )
    .map(({ claim, direction, specificity }) => {
      const mappedPoints = ordinalPoints(claim.magnitudeOrdinal, input.knowledge);
      const duplicate = input.alreadyScoredStars.has(canonical(claim.star));
      const directional = direction === "support" || direction === "pressure";
      const admittedForNumeric = directional && mappedPoints != null && !duplicate;

      let reason = "admitted-doctrine-fallback";
      if (!directional) reason = "context-only-tendency";
      else if (mappedPoints == null) reason = "unspecified-ordinal-context-only";
      else if (duplicate) reason = "v012-physical-star-already-scored";

      return {
        claimId: claim.claimId,
        starName: canonical(claim.star),
        palaceName: claim.palace,
        direction,
        points: admittedForNumeric ? mappedPoints ?? 0 : 0,
        magnitudeOrdinal: claim.magnitudeOrdinal,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
        specificity,
        admittedForNumeric,
        reason,
      };
    });
}
