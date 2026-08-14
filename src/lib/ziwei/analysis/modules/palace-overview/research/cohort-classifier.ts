import type { BenchmarkCaseFingerprint } from "./case-fingerprint";

export function classifyCohorts(fp: BenchmarkCaseFingerprint): string[] {
  const tags = new Set<string>();
  if (fp.vcdPalaces.length > 0) tags.add("vcd");
  else tags.add("non-vcd");

  const hasTuan = fp.void.tuanPalaces.length > 0;
  const hasTriet = fp.void.trietPalaces.length > 0;
  if (hasTuan) tags.add("tuan");
  if (hasTriet) tags.add("triet");
  if (!hasTuan && !hasTriet) tags.add("no-void");

  if (fp.structuralSystems.length > 0) {
    tags.add("structural-system");
    for (const id of fp.structuralSystems) tags.add(id);
  }

  const strong = fp.brightnessDistribution.mieu + fp.brightnessDistribution.vuong;
  const ham = fp.brightnessDistribution.ham;
  const majors = fp.majorStars.length || 1;
  if (strong / majors >= 0.45) tags.add("brightness-strong");
  if (ham / majors >= 0.35) tags.add("brightness-ham-heavy");
  if (strong > 0 && ham > 0) tags.add("brightness-mixed");

  if (fp.natalTransformations.length >= 4) tags.add("transformation-dense");
  else tags.add("transformation-balanced");

  if (fp.minorStarSummary.totalMapped >= 24) tags.add("minor-dense");
  else tags.add("minor-sparse");

  return [...tags].sort();
}
