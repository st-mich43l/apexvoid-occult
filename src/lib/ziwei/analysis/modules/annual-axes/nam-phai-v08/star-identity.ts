import type { ChartStar } from "@/types/chart";
import type { StarTemporalLayer } from "../../../knowledge/annual-axes/v0.8/schema";
import {
  exactCanonicalStarName,
  baseCanonicalNameOf,
  isAnnualOnlyStarName,
  inferTemporalLayerFromCanonicalName,
  type NameTemporalLayer,
} from "../../../knowledge/annual-axes/v0.8/star-identity";

export type { StarTemporalLayer, NameTemporalLayer };
export {
  exactCanonicalStarName,
  baseCanonicalNameOf,
  isAnnualOnlyStarName,
  inferTemporalLayerFromCanonicalName,
};

export type MutagenType = "loc" | "quyen" | "khoa" | "ky";

export interface NormalizedStarIdentity {
  /** Exact name with temporal meaning preserved (e.g. "Lưu Hóa Kỵ"). */
  exactCanonicalName: string;
  /** Base name without temporal prefix — display/diagnostics only. */
  baseCanonicalName: string;
  temporalLayer: StarTemporalLayer;
  source?: string;
  mutagenType?: MutagenType;
}

const MUTAGEN_EXACT =
  /^(?:Lưu\s+)?Hóa\s+(Lộc|Quyền|Khoa|Kỵ)$/;

function mutagenTypeFromName(exactName: string): MutagenType | undefined {
  const match = exactName.match(MUTAGEN_EXACT);
  const raw = match?.[1];
  if (raw === "Lộc") return "loc";
  if (raw === "Quyền") return "quyen";
  if (raw === "Khoa") return "khoa";
  if (raw === "Kỵ") return "ky";
  return undefined;
}

/**
 * Prefer structured `source` / `layer` metadata; fall back to name prefix.
 */
export function resolveTemporalLayer(star: ChartStar): StarTemporalLayer {
  const source = (star.source ?? "").toLowerCase();
  if (source === "annual" || source === "annual-mutagen" || source.startsWith("annual")) {
    return "annual";
  }
  if (source === "natal" || source === "natal-mutagen" || source.startsWith("natal")) {
    return "natal";
  }
  if (
    source === "major" ||
    source === "major-mutagen" ||
    source === "decadal" ||
    source.startsWith("major")
  ) {
    return "decadal";
  }
  if (source === "monthly" || source.startsWith("month")) return "monthly";
  if (source === "daily" || source.startsWith("day")) return "daily";

  const layer = (star.layer ?? "").toLowerCase();
  if (layer === "annual" || layer === "luu" || layer === "lưu") return "annual";
  if (layer === "natal" || layer === "origin") return "natal";

  const exact = exactCanonicalStarName(star.name);
  if (inferTemporalLayerFromCanonicalName(exact) === "annual") return "annual";
  if (source || layer) return "unknown";
  return "natal";
}

export function normalizeStarIdentity(star: ChartStar): NormalizedStarIdentity {
  const exactCanonicalName = exactCanonicalStarName(star.name);
  return {
    exactCanonicalName,
    baseCanonicalName: baseCanonicalNameOf(exactCanonicalName),
    temporalLayer: resolveTemporalLayer(star),
    source: star.source,
    mutagenType: mutagenTypeFromName(exactCanonicalName),
  };
}
