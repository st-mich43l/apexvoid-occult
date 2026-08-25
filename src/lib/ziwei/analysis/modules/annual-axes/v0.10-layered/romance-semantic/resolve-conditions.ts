import type { PalaceOverviewResult } from "../../../palace-overview/types";
import type { MajorStarPalaceClaim } from "../../../palace-overview/doctrine/types";
import type {
  RomanceConditionKind,
  RomanceConditionResolution,
  RomanceConditionState,
} from "./types";

export interface PalaceFactContext {
  palace: PalaceOverviewResult;
  /** All star names present in this palace (majors + context-only + evidence labels). */
  starNames: string[];
  majorByName: Map<
    string,
    { brightness: string | null; brightnessStatus: string }
  >;
  transformations: string[];
}

export function buildPalaceFactContext(
  palace: PalaceOverviewResult,
): PalaceFactContext {
  const majorByName = new Map<
    string,
    { brightness: string | null; brightnessStatus: string }
  >();
  for (const m of palace.majorStars) {
    majorByName.set(m.name, {
      brightness: m.brightness,
      brightnessStatus: m.brightnessStatus,
    });
  }

  const starNames = new Set<string>();
  for (const m of palace.majorStars) starNames.add(m.name);
  for (const c of palace.contextOnlyStars) starNames.add(c.name);
  for (const e of palace.allEvidence) {
    if (e.starName) starNames.add(e.starName);
  }

  const transformations = new Set<string>();
  for (const e of palace.allEvidence) {
    if (e.transformation) transformations.add(e.transformation);
  }
  for (const a of palace.annotations ?? []) {
    const meta = (a as { metadata?: { transformation?: string } }).metadata;
    if (meta?.transformation) transformations.add(meta.transformation);
  }

  return {
    palace,
    starNames: [...starNames].sort((a, b) => a.localeCompare(b, "vi")),
    majorByName,
    transformations: [...transformations].sort((a, b) => a.localeCompare(b, "vi")),
  };
}

function resolveListCondition(input: {
  kind: RomanceConditionKind;
  required: string[];
  observed: string[];
  missingMeansUnresolved?: boolean;
}): RomanceConditionResolution {
  const { kind, required, observed } = input;
  if (required.length === 0) {
    return {
      kind,
      required,
      observed,
      state: "satisfied",
      detail: "no requirement",
    };
  }
  const missing = required.filter((r) => !observed.includes(r));
  if (missing.length === 0) {
    return {
      kind,
      required,
      observed,
      state: "satisfied",
      detail: `all required present: ${required.join(",")}`,
    };
  }
  if (input.missingMeansUnresolved) {
    return {
      kind,
      required,
      observed,
      state: "unresolved",
      detail: `cannot verify required ${missing.join(",")}`,
    };
  }
  return {
    kind,
    required,
    observed,
    state: "not-satisfied",
    detail: `missing ${missing.join(",")}`,
  };
}

/**
 * Deterministic fail-closed condition resolver.
 * Unresolved required facts → unresolved (never assumed true).
 */
export function resolveClaimConditions(
  claim: MajorStarPalaceClaim,
  ctx: PalaceFactContext,
): RomanceConditionResolution[] {
  const cond = claim.conditions ?? {};
  const out: RomanceConditionResolution[] = [];

  if (cond.brightness && cond.brightness.length > 0) {
    const major = ctx.majorByName.get(claim.star);
    if (!major || major.brightnessStatus === "unavailable" || major.brightness == null) {
      out.push({
        kind: "brightness",
        required: [...cond.brightness],
        observed: [],
        state: "unresolved",
        detail: `brightness unavailable for ${claim.star} at ${ctx.palace.palaceName}`,
      });
    } else if (cond.brightness.includes(major.brightness)) {
      out.push({
        kind: "brightness",
        required: [...cond.brightness],
        observed: [major.brightness],
        state: "satisfied",
        detail: `brightness ${major.brightness}`,
      });
    } else {
      out.push({
        kind: "brightness",
        required: [...cond.brightness],
        observed: [major.brightness],
        state: "not-satisfied",
        detail: `brightness ${major.brightness} not in ${cond.brightness.join("|")}`,
      });
    }
  }

  if (cond.branches && cond.branches.length > 0) {
    const branch = ctx.palace.palaceBranch;
    out.push(
      resolveListCondition({
        kind: "branches",
        required: [...cond.branches],
        observed: branch ? [branch] : [],
        missingMeansUnresolved: !branch,
      }),
    );
  }

  if (cond.coStars && cond.coStars.length > 0) {
    out.push(
      resolveListCondition({
        kind: "coStars",
        required: [...cond.coStars],
        observed: ctx.starNames,
      }),
    );
  }

  if (cond.supportStars && cond.supportStars.length > 0) {
    out.push(
      resolveListCondition({
        kind: "supportStars",
        required: [...cond.supportStars],
        observed: ctx.starNames,
      }),
    );
  }

  if (cond.pressureStars && cond.pressureStars.length > 0) {
    out.push(
      resolveListCondition({
        kind: "pressureStars",
        required: [...cond.pressureStars],
        observed: ctx.starNames,
      }),
    );
  }

  if (cond.transformations && cond.transformations.length > 0) {
    out.push(
      resolveListCondition({
        kind: "transformations",
        required: [...cond.transformations],
        observed: ctx.transformations,
      }),
    );
  }

  return out;
}

export function aggregateConditionState(
  resolutions: RomanceConditionResolution[],
): RomanceConditionState | "empty" {
  if (resolutions.length === 0) return "empty";
  if (resolutions.some((r) => r.state === "unresolved")) return "unresolved";
  if (resolutions.some((r) => r.state === "not-satisfied")) return "not-satisfied";
  return "satisfied";
}
