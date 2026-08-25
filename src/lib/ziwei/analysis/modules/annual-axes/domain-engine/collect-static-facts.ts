import type { ChartData, ChartStar } from "@/types/chart";
import { isAnnualStar } from "@/lib/ziwei/star-classification";
import { normalizeStarIdentity } from "../nam-phai-v08/star-identity";

const FORBIDDEN_SOURCES = new Set([
  "annual",
  "annual-mutagen",
  "major-mutagen",
  "major",
  "monthly-flow",
  "monthly",
  "daily",
]);

/** Annual/flow identities only — natal 「Lưu Hà」 remains admissible. */
const ANNUAL_FLOW_NAME =
  /^(Lưu Thái Tuế|Lưu Văn Xương|Lưu Văn Khúc|Lưu Khôi|Lưu Việt|Lưu Lộc Tồn|Lưu Kình|Lưu Đà|Lưu Hóa)/;

/**
 * Natal/static stars physically present in a palace.
 * Rejects temporal sources and annual/flow identities.
 */
export function collectStaticNatalStars(
  chart: ChartData,
  palaceIndex: number,
): ChartStar[] {
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  if (!palace) return [];
  return (palace.stars ?? []).filter((star) => {
    if (isAnnualStar(star)) return false;
    const identity = normalizeStarIdentity(star);
    if (identity.temporalLayer !== "natal") return false;
    const source = (star.source ?? "").toLowerCase();
    if (FORBIDDEN_SOURCES.has(source)) return false;
    if (source.startsWith("annual") || source.startsWith("major") || source.startsWith("month")) {
      return false;
    }
    if (ANNUAL_FLOW_NAME.test(identity.exactCanonicalName)) return false;
    return true;
  });
}
