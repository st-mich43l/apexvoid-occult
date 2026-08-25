import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import { aggregateStaticDomain } from "../domain-engine";
import {
  buildLayerSignal,
  emptyLayerSignal,
} from "./layer-contract";
import type { AnnualLayerContributor, AnnualLayerSignal, DomainProjectionTrace } from "./types";

export interface NatalFoundationBundle {
  byDomain: Record<
    AnnualAxisDomain,
    {
      signal: AnnualLayerSignal;
      projection: DomainProjectionTrace;
    }
  >;
}

/**
 * Static Domain Foundation for Annual Axes.
 *
 * Consumes ChartData + AnnualDomainProjection + V0.8 natal star policies.
 * Does NOT call analyzeAllPalaces / PalaceOverviewResult / PO rawAxes.
 */
export function adaptNatalFoundation(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domains: readonly AnnualAxisDomain[];
  projectionVariant: V10ProjectionVariantId;
}): NatalFoundationBundle {
  const { chart, knowledge, domains, projectionVariant } = input;
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  const byDomain = {} as NatalFoundationBundle["byDomain"];

  if (!knowledge08.ok) {
    for (const domain of domains) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "invalid-v08-knowledge",
          "missing-natal-foundation",
        ]),
        projection: {
          variant: projectionVariant,
          anchors: [],
          resolvedWeight: 0,
          totalConfiguredWeight: 0,
          coverage: 0,
          renormalized: false,
        },
      };
    }
    return { byDomain };
  }

  for (const domain of domains) {
    const agg = aggregateStaticDomain({
      chart,
      domain,
      knowledge,
      knowledge08: knowledge08.knowledge,
      projectionVariant,
    });

    if (agg.mappedPalaces.length === 0) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "missing-natal-foundation",
          "no-resolved-structural-anchors",
        ]),
        projection: agg.projection.trace,
      };
      continue;
    }

    const contributors: AnnualLayerContributor[] = agg.palaceContexts.map((ctx) => {
      const net = ctx.supportMass - ctx.pressureMass;
      return {
        id: `natal-domain:${domain}:${ctx.palaceName}`,
        layer: "natal-foundation" as const,
        palaceName: ctx.palaceName,
        palaceIndex: ctx.palaceIndex,
        physicalFactIds: ctx.evidence
          .filter((e) => e.adjudication === "admitted")
          .flatMap((e) => e.factIds)
          .slice(0, 12),
        sourceIds: ["SRC-AA-DOMAIN-STATIC"],
        direction: net > 0 ? ("support" as const) : net < 0 ? ("pressure" as const) : ("neutral" as const),
        magnitude: Math.abs(net),
        sourceModule: "annual-axes-domain-engine" as const,
        originalWeight: ctx.effectiveLayerWeight,
        effectiveLayerWeight: ctx.effectiveLayerWeight,
      };
    });

    const share = agg.coverage;
    const availability =
      share >= knowledge.coveragePolicy.minResolvedWeightShareForAvailable
        ? share < 0.999
          ? "partial"
          : "available"
        : "unavailable";

    byDomain[domain] = {
      signal: buildLayerSignal({
        layer: "natal-foundation",
        domain,
        supportMass: agg.supportMass,
        pressureMass: agg.pressureMass,
        activation: agg.activation,
        coverage: share,
        availability:
          availability === "unavailable" ? "unavailable" : availability,
        contributors,
        reasonCodes:
          availability === "available"
            ? []
            : availability === "partial"
              ? ["natal-projection-partial-coverage"]
              : ["natal-foundation-low-coverage"],
        signedNetOverride: agg.signedNet,
      }),
      projection: agg.projection.trace,
    };
  }

  return { byDomain };
}
