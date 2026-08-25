import type { ChartData, ChartStar } from "@/types/chart";
import {
  loadDoctrinePack,
  verifiedPrimaryRequiresExactLocator,
} from "../../palace-overview/doctrine/loader";
import type { MajorStarPalaceClaim } from "../../palace-overview/doctrine/types";
import { collectStaticNatalStars } from "../domain-engine/collect-static-facts";

const EXACT_LOCATORS = new Set([
  "EXACT_SECTION",
  "EXACT_LINE_OR_PARAGRAPH",
  "PAGE",
]);
const NAM_PHAI_SCHOOLS = new Set(["classical-shared", "nam-phai"]);

/** Engineering ordinal → mass for Annual Axes only. Doctrine pack stays numericDelta=null. */
export const DOCTRINE_ORDINAL_MASS = {
  weak: 1,
  moderate: 2,
  strong: 3,
} as const;

type DoctrineFallbackStatus =
  | "admitted"
  | "skipped-unspecified"
  | "skipped-already-covered"
  | "rejected-school"
  | "rejected-source"
  | "rejected-condition"
  | "unresolved-condition"
  | "star-absent";

interface ChartPalaceDoctrineContext {
  palaceName: string;
  palaceBranch: string;
  starNames: string[];
  majorByName: Map<string, { brightness: string | null }>;
  transformations: string[];
}

export interface DoctrineFallbackHit {
  claimId: string;
  starName: string;
  palaceName: string;
  status: DoctrineFallbackStatus;
  polarity: "support" | "pressure" | "neutral";
  points: number;
  magnitudeOrdinal: string | null;
  sourceIds: string[];
  locator: string;
}

function starDisplayName(star: ChartStar): string {
  return star.name ?? "";
}

function buildChartPalaceDoctrineContext(
  chart: ChartData,
  palaceIndex: number,
  palaceName: string,
): ChartPalaceDoctrineContext {
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  const staticStars = collectStaticNatalStars(chart, palaceIndex);
  const starNames = staticStars
    .map(starDisplayName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "vi"));

  const majorByName = new Map<string, { brightness: string | null }>();
  for (const star of staticStars) {
    const name = starDisplayName(star);
    if (!name) continue;
    // Any natal static star with a brightness reading is usable for brightness gates.
    majorByName.set(name, {
      brightness: typeof star.brightness === "string" ? star.brightness : null,
    });
  }

  const transformations: string[] = [];
  for (const m of chart.natalMutagens ?? []) {
    if (m.palace?.index === palaceIndex && m.mutagen) {
      transformations.push(m.mutagen);
    }
  }
  transformations.sort((a, b) => a.localeCompare(b, "vi"));

  return {
    palaceName,
    palaceBranch: palace?.branch ?? "",
    starNames,
    majorByName,
    transformations,
  };
}

function gateVerifiedPrimary(claim: MajorStarPalaceClaim): DoctrineFallbackStatus | null {
  if (claim.adjudication !== "VERIFIED_PRIMARY") return "rejected-source";
  if (!NAM_PHAI_SCHOOLS.has(claim.school)) return "rejected-school";
  if (!EXACT_LOCATORS.has(claim.locatorType)) return "rejected-source";
  if (!claim.sourceIds || claim.sourceIds.length === 0) return "rejected-source";
  if (claim.numericDelta !== null) return "rejected-source";

  const packErrors = verifiedPrimaryRequiresExactLocator();
  const touches = packErrors.some(
    (e) =>
      e.includes(claim.claimId) ||
      claim.sourceIds.some((sid) => e.includes(sid)),
  );
  if (touches) return "rejected-source";
  return null;
}

type CondState = "satisfied" | "not-satisfied" | "unresolved";

function resolveList(
  required: string[],
  observed: string[],
  missingMeansUnresolved = false,
): CondState {
  if (required.length === 0) return "satisfied";
  const missing = required.filter((r) => !observed.includes(r));
  if (missing.length === 0) return "satisfied";
  if (missingMeansUnresolved) return "unresolved";
  return "not-satisfied";
}

function resolveConditionsFailClosed(
  claim: MajorStarPalaceClaim,
  ctx: ChartPalaceDoctrineContext,
): CondState {
  const cond = claim.conditions ?? {};
  const states: CondState[] = [];

  if (cond.brightness && cond.brightness.length > 0) {
    const major = ctx.majorByName.get(claim.star);
    if (!major || major.brightness == null) states.push("unresolved");
    else if (cond.brightness.includes(major.brightness)) states.push("satisfied");
    else states.push("not-satisfied");
  }
  if (cond.branches && cond.branches.length > 0) {
    states.push(
      resolveList([...cond.branches], ctx.palaceBranch ? [ctx.palaceBranch] : [], !ctx.palaceBranch),
    );
  }
  if (cond.coStars && cond.coStars.length > 0) {
    states.push(resolveList([...cond.coStars], ctx.starNames));
  }
  if (cond.supportStars && cond.supportStars.length > 0) {
    states.push(resolveList([...cond.supportStars], ctx.starNames));
  }
  if (cond.pressureStars && cond.pressureStars.length > 0) {
    states.push(resolveList([...cond.pressureStars], ctx.starNames));
  }
  if (cond.transformations && cond.transformations.length > 0) {
    states.push(resolveList([...cond.transformations], ctx.transformations));
  }

  if (states.includes("unresolved")) return "unresolved";
  if (states.includes("not-satisfied")) return "not-satisfied";
  return "satisfied";
}

function tendencyPolarity(
  tendency: MajorStarPalaceClaim["tendency"],
): "support" | "pressure" | "neutral" {
  const supportUp = tendency.support === "up";
  const supportDown = tendency.support === "down";
  const pressureUp = tendency.pressure === "up";
  const pressureDown = tendency.pressure === "down";
  // Prefer explicit pressure/support axes; activation-only stays neutral for mass.
  if (supportUp && !pressureUp) return "support";
  if (pressureUp && !supportUp) return "pressure";
  if (supportDown || pressureDown) {
    if (supportDown && !pressureDown) return "pressure";
    if (pressureDown && !supportDown) return "support";
  }
  if (supportUp && pressureUp) return "pressure"; // conflict → fail toward caution
  return "neutral";
}

/**
 * VERIFIED_PRIMARY fallback for stars physically present but not already
 * covered by V0.12 static-domain registry matches.
 *
 * - exact locator required
 * - conditions fail-closed
 * - unspecified / context-only → no numeric points
 * - never double-counts stars already admitted by V0.12 registry
 */
export function collectDoctrineFallbackHits(input: {
  chart: ChartData;
  palaceIndex: number;
  palaceName: string;
  /** Star names already scored by V0.12 static registry — excluded. */
  coveredStarNames: ReadonlySet<string>;
}): DoctrineFallbackHit[] {
  const ctx = buildChartPalaceDoctrineContext(
    input.chart,
    input.palaceIndex,
    input.palaceName,
  );
  const claims = loadDoctrinePack().conditionalClaims.filter(
    (c) => c.palace === input.palaceName,
  );
  const hits: DoctrineFallbackHit[] = [];

  for (const claim of claims.slice().sort((a, b) => a.claimId.localeCompare(b.claimId))) {
    if (input.coveredStarNames.has(claim.star)) {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: "skipped-already-covered",
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: claim.magnitudeOrdinal ?? null,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }

    if (!ctx.starNames.includes(claim.star) && !ctx.majorByName.has(claim.star)) {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: "star-absent",
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: claim.magnitudeOrdinal ?? null,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }

    const gate = gateVerifiedPrimary(claim);
    if (gate) {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: gate,
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: claim.magnitudeOrdinal ?? null,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }

    const cond = resolveConditionsFailClosed(claim, ctx);
    if (cond === "unresolved") {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: "unresolved-condition",
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: claim.magnitudeOrdinal ?? null,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }
    if (cond === "not-satisfied") {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: "rejected-condition",
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: claim.magnitudeOrdinal ?? null,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }

    const ordinal = claim.magnitudeOrdinal ?? "unspecified";
    if (ordinal === "unspecified") {
      hits.push({
        claimId: claim.claimId,
        starName: claim.star,
        palaceName: claim.palace,
        status: "skipped-unspecified",
        polarity: "neutral",
        points: 0,
        magnitudeOrdinal: ordinal,
        sourceIds: [...claim.sourceIds],
        locator: claim.locator,
      });
      continue;
    }

    const polarity = tendencyPolarity(claim.tendency);
    const points =
      polarity === "neutral"
        ? 0
        : DOCTRINE_ORDINAL_MASS[ordinal as keyof typeof DOCTRINE_ORDINAL_MASS];
    hits.push({
      claimId: claim.claimId,
      starName: claim.star,
      palaceName: claim.palace,
      status: points > 0 ? "admitted" : "skipped-unspecified",
      polarity,
      points,
      magnitudeOrdinal: ordinal,
      sourceIds: [...claim.sourceIds],
      locator: claim.locator,
    });
  }

  return hits;
}
