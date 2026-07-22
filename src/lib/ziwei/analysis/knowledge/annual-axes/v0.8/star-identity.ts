/**
 * Shared V0.8 star-name identity helpers.
 *
 * Source of truth for spelling aliases:
 *   annual-star-aliases.nam-phai.v0.8.json
 *
 * Bootstrap normalization (whitespace / trim only) is intentionally minimal
 * so the alias catalog itself can be parsed before alias resolution runs.
 * Runtime matcher and knowledge validator must both use these helpers —
 * do not maintain a second hardcoded alias map.
 */

import aliasCatalog from "./annual-star-aliases.nam-phai.v0.8.json";

export type NameTemporalLayer = "annual" | "non-annual";

/** Minimal bootstrap: trim + collapse whitespace. Not a spelling dictionary. */
export function bootstrapNormalizeStarName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function buildAliasLookup(): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  const aliases = (aliasCatalog as { aliases?: Array<{ alias: string; canonical: string }> })
    .aliases;
  if (!Array.isArray(aliases)) return map;
  for (const entry of aliases) {
    const alias = bootstrapNormalizeStarName(entry.alias);
    const canonical = bootstrapNormalizeStarName(entry.canonical);
    if (!alias || !canonical) continue;
    map.set(alias, canonical);
  }
  return map;
}

const ALIAS_LOOKUP = buildAliasLookup();

/**
 * Exact canonical star name after bootstrap whitespace + catalog spelling aliases.
 * Does not strip temporal prefixes and does not treat family members as aliases.
 */
export function exactCanonicalStarName(name: string): string {
  const trimmed = bootstrapNormalizeStarName(name);
  return ALIAS_LOOKUP.get(trimmed) ?? trimmed;
}

/**
 * Name-level temporal semantics from the exact canonical name.
 * "Lưu Hà" is a natal star name and must remain non-annual.
 */
export function inferTemporalLayerFromCanonicalName(
  exactCanonicalName: string,
): NameTemporalLayer {
  const exact = exactCanonicalStarName(exactCanonicalName);
  if (exact === "Lưu Hà") return "non-annual";
  if (/^Lưu\s+/.test(exact)) return "annual";
  return "non-annual";
}

export function isAnnualOnlyStarName(exactName: string): boolean {
  return inferTemporalLayerFromCanonicalName(exactName) === "annual";
}

/**
 * Base name for display/grouping only. Preserves "Lưu Hà".
 * Must not be used for annual-rule matching.
 */
export function baseCanonicalNameOf(exactName: string): string {
  const exact = exactCanonicalStarName(exactName);
  if (exact === "Lưu Hà") return exact;
  return exact.replace(/^Lưu\s+/, "");
}
