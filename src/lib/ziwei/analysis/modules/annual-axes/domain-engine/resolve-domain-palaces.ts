import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { projectDomainAnchors } from "../v0.10-layered/domain-projection";
import type { ResolvedDomainPalace } from "./types";

/**
 * Resolve AnnualDomainProjection anchors against natal palace names on ChartData.
 * Does not use PalaceOverviewResult.
 */
export function resolveDomainPalaces(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domain: AnnualAxisDomain;
  projectionVariant: V10ProjectionVariantId;
}): {
  mappedPalaces: ResolvedDomainPalace[];
  coverage: number;
  projection: ReturnType<typeof projectDomainAnchors>;
} {
  const { chart, knowledge, domain, projectionVariant } = input;

  const projection = projectDomainAnchors({
    knowledge,
    domain,
    variant: projectionVariant,
    layer: "natal",
    resolvePalace: (palaceName) =>
      chart.palaces.some((p) => p.name === palaceName),
  });

  const mappedPalaces: ResolvedDomainPalace[] = [];
  for (const anchor of projection.resolved) {
    const palace = chart.palaces.find((p) => p.name === anchor.palace);
    if (!palace) continue;
    mappedPalaces.push({
      palaceName: palace.name,
      palaceIndex: palace.index,
      branch: palace.branch,
      role: `domain-anchor:${anchor.palace}`,
      originalWeight: anchor.originalWeight,
      effectiveLayerWeight: anchor.effectiveLayerWeight,
    });
  }

  return {
    mappedPalaces,
    coverage: projection.coverage,
    projection,
  };
}
