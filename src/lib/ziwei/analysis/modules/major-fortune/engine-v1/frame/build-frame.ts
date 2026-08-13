import type { ChartData } from "@/types/chart";
import type { MajorFortuneV1Context, MajorFortuneV1Frame } from "../types";

export function buildMajorFortuneV1Frame(
  chart: ChartData,
  context: MajorFortuneV1Context
): MajorFortuneV1Frame {
  const palace = context.activePalace;
  
  // Minimal placeholder logic to ensure independence from V0.3
  const elementRelation = {
    menh: chart.menhElement,
    palace: "Thổ", // Placeholder, requires true branch-element mapping
    type: "same" as const,
  };

  return {
    context,
    principalStars: chart.annualStars?.filter(s => s.palace.index === palace.index) || [],
    auxiliaryStars: chart.annualStars?.filter(s => s.palace.index !== palace.index) || [],
    elementRelation,
    transformations: [],
  };
}
