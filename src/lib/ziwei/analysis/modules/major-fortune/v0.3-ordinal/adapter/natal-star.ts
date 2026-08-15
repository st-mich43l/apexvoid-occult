import type { ChartStar } from "@/types/chart";

const LUU_SOURCES = new Set(["annual", "annual-mutagen"]);

/** Natal/static + Tứ Hóa overlays. Never Lưu niên stars or Lưu Hóa. */
export function isDecadeStaticStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  if (LUU_SOURCES.has(source)) return false;
  if (star.name.startsWith("Lưu ")) return false;
  return true;
}

export function natalStarsOf(stars: readonly ChartStar[] | undefined): ChartStar[] {
  return (stars ?? []).filter(isDecadeStaticStar);
}
