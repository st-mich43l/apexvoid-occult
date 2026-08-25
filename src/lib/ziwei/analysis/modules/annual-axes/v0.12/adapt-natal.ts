import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import {
  loadAnnualAxesKnowledgeV12,
  type V12ReferenceMass,
} from "../../../knowledge/annual-axes/v0.12";
import {
  buildLayerSignal,
  emptyLayerSignal,
} from "../v0.10-layered/layer-contract";
import type {
  AnnualLayerContributor,
  AnnualLayerSignal,
  DomainProjectionTrace,
} from "../v0.10-layered/types";
import { aggregateStaticDomainV12 } from "./aggregate-domain";

export interface NatalFoundationBundleV12 {
  byDomain: Record<
    AnnualAxisDomain,
    {
      signal: AnnualLayerSignal;
      projection: DomainProjectionTrace;
      aggregate: ReturnType<typeof aggregateStaticDomainV12> | null;
    }
  >;
}

export function adaptNatalFoundationV12(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domains: readonly AnnualAxisDomain[];
  projectionVariant: V10ProjectionVariantId;
  referenceMass?: V12ReferenceMass;
}): NatalFoundationBundleV12 {
  const { chart, knowledge, domains, projectionVariant } = input;
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const referenceMass =
    input.referenceMass ?? knowledge12.selectedReferenceMass;
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  const byDomain = {} as NatalFoundationBundleV12["byDomain"];

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
        aggregate: null,
      };
    }
    return { byDomain };
  }

  for (const domain of domains) {
    const agg = aggregateStaticDomainV12({
      chart,
      domain,
      knowledge,
      knowledge08: knowledge08.knowledge,
      knowledge12,
      projectionVariant,
      referenceMass,
    });

    if (agg.mappedPalaces.length === 0) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "missing-natal-foundation",
          "no-resolved-structural-anchors",
        ]),
        projection: agg.projection.trace,
        aggregate: agg,
      };
      continue;
    }

    const contributors: AnnualLayerContributor[] = agg.palaceContexts.map(
      (ctx) => ({
        id: `natal-domain-v12:${domain}:${ctx.palaceName}`,
        layer: "natal-foundation" as const,
        palaceName: ctx.palaceName,
        palaceIndex: ctx.palaceIndex,
        physicalFactIds: ctx.evidence
          .filter((e) => e.adjudication === "admitted")
          .flatMap((e) => e.factIds)
          .slice(0, 12),
        sourceIds: ["SRC-AA-V012-STATIC-REGISTRY"],
        direction:
          ctx.palaceSignedNet > 0
            ? ("support" as const)
            : ctx.palaceSignedNet < 0
              ? ("pressure" as const)
              : ("neutral" as const),
        magnitude: Math.abs(ctx.palaceSignedNet),
        sourceModule: "annual-axes-domain-engine" as const,
        originalWeight: ctx.roleWeight,
        effectiveLayerWeight: ctx.roleWeight,
      }),
    );

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
            ? ["v012-static-direction-activation"]
            : availability === "partial"
              ? [
                  "v012-static-direction-activation",
                  "natal-projection-partial-coverage",
                ]
              : ["natal-foundation-low-coverage"],
        signedNetOverride: agg.signedNet,
      }),
      projection: agg.projection.trace,
      aggregate: agg,
    };
  }

  return { byDomain };
}
