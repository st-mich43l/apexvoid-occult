import type { ChartStar } from "@/types/chart";
import type { StarTemporalLayer } from "../../../knowledge/annual-axes/v0.8/schema";

export type { StarTemporalLayer };

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

const SPELLING_ALIASES: ReadonlyMap<string, string> = new Map([
  ["Hoá Kỵ", "Hóa Kỵ"],
  ["Hoá Lộc", "Hóa Lộc"],
  ["Hoá Quyền", "Hóa Quyền"],
  ["Hoá Khoa", "Hóa Khoa"],
  ["Lưu Hoá Kỵ", "Lưu Hóa Kỵ"],
  ["Lưu Hoá Lộc", "Lưu Hóa Lộc"],
  ["Lưu Hoá Quyền", "Lưu Hóa Quyền"],
  ["Lưu Hoá Khoa", "Lưu Hóa Khoa"],
  ["Tả Phụ", "Tả Phù"],
  ["Hỉ Thần", "Hỷ Thần"],
  ["Thiên Khôi (Lưu)", "Lưu Thiên Khôi"],
  ["Thiên Việt (Lưu)", "Lưu Thiên Việt"],
  ["Lưu Khôi", "Lưu Thiên Khôi"],
  ["Lưu Việt", "Lưu Thiên Việt"],
  ["Lưu Thái Tuế", "Lưu Thái Tuế"],
]);

const MUTAGEN_EXACT =
  /^(?:Lưu\s+)?Hóa\s+(Lộc|Quyền|Khoa|Kỵ)$/;

function normalizeSpelling(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return SPELLING_ALIASES.get(trimmed) ?? trimmed;
}

/**
 * Base name for display/grouping only. Preserves "Lưu Hà" as a natal star.
 * Must not be used for annual-rule matching.
 */
export function baseCanonicalNameOf(exactName: string): string {
  if (exactName === "Lưu Hà") return exactName;
  return exactName.replace(/^Lưu\s+/, "");
}

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

  const exact = normalizeSpelling(star.name);
  if (exact === "Lưu Hà") return "natal";
  if (/^Lưu\s+/.test(exact)) return "annual";
  if (source || layer) return "unknown";
  return "natal";
}

export function normalizeStarIdentity(star: ChartStar): NormalizedStarIdentity {
  const exactCanonicalName = normalizeSpelling(star.name);
  return {
    exactCanonicalName,
    baseCanonicalName: baseCanonicalNameOf(exactCanonicalName),
    temporalLayer: resolveTemporalLayer(star),
    source: star.source,
    mutagenType: mutagenTypeFromName(exactCanonicalName),
  };
}

/** Normalize a rule star name to exact canonical form (spelling only). */
export function exactCanonicalStarName(name: string): string {
  return normalizeSpelling(name);
}

export function isAnnualOnlyStarName(exactName: string): boolean {
  if (exactName === "Lưu Hà") return false;
  return /^Lưu\s+/.test(exactName);
}
