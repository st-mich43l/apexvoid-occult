import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import { loadAnnualAxesKnowledgeV12 } from "../../../knowledge/annual-axes/v0.12";
import { loadAnnualAxesKnowledgeV13 } from "../../../knowledge/annual-axes/v0.13";
import {
  buildLayerSignal,
  emptyLayerSignal,
} from "../v0.10-layered/layer-contract";
import type {
  AnnualLayerContributor,
  AnnualLayerSignal,
  DomainProjectionTrace,
} from "../v0.10-layered/types";
import { aggregateStaticDomainV13 } from "./aggregate-domain";

export interface NatalFoundationBundleV13 {
  byDomain: Record<
    AnnualAxisDomain,
    {
      signal: AnnualLayerSignal;
      projection: DomainProjectionTrace;
      aggregate: ReturnType<typeof aggregateStaticDomainV13> | null;
      evidenceCoverage: number;
    }
  >;
}

export function adaptNatalFoundationV13(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domains: readonly AnnualAxisDomain[];
  projectionVariant: V10ProjectionVariantId;
}): NatalFoundationBundleV13 {
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  const knowledge12 = loadAnnualAxesKnowledgeV12();
  const knowledge13 = loadAnnualAxesKnowledgeV13();
  const byDomain = {} as NatalFoundationBundleV13["byDomain"];

  if (!knowledge08.ok) {
    for (const domain of input.domains) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "invalid-v08-knowledge",
          "missing-natal-foundation",
        ]),
        projection: {
          variant: input.projectionVariant,
          anchors: [],
          resolvedWeight: 0,
          totalConfiguredWeight: 0,
          coverage: 0,
          renormalized: false,
        },
        aggregate: null,
        evidenceCoverage: 0,
      };
    }
    return { byDomain };
  }

  for (const domain of input.domains) {
    const aggregate = aggregateStaticDomainV13({
      chart: input.chart,
      domain,
      knowledge: input.knowledge,
      knowledge08: knowledge08.knowledge,
      knowledge12,
      knowledge13,
      projectionVariant: input.projectionVariant,
      referenceMass: knowledge13.referenceMass,
    });

    if (aggregate.mappedPalaces.length === 0) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "missing-natal-foundation",
          "no-resolved-structural-anchors",
        ]),
        projection: aggregate.projection.trace,
        aggregate,
        evidenceCoverage: 0,
      };
      continue;
    }

    const evidenceCoverage = aggregate.palaceContexts.reduce(
      (sum, ctx) => sum + (ctx.unresolved ? 0 : ctx.roleWeight),
      0,
    );
    const effectiveCoverage = Math.min(aggregate.coverage, evidenceCoverage);
    const threshold = input.knowledge.coveragePolicy.minResolvedWeightShareForAvailable;
    const availability =
      effectiveCoverage < threshold
        ? "unavailable"
        : effectiveCoverage < 0.999
          ? "partial"
          : "available";

    const contributors: AnnualLayerContributor[] = aggregate.palaceContexts.map(
      (ctx) => ({
        id: `natal-domain-v13:${domain}:${ctx.palaceName}`,
        layer: "natal-foundation" as const,
        palaceName: ctx.palaceName,
        palaceIndex: ctx.palaceIndex,
        physicalFactIds: ctx.evidence
          .filter((e) => e.adjudication === "admitted")
          .flatMap((e) => e.factIds)
          .slice(0, 16),
        sourceIds: Array.from(
          new Set(
            ctx.evidence
              .filter((e) => e.adjudication === "admitted")
              .flatMap((e) => e.sourceIds),
          ),
        ).sort((a, b) => a.localeCompare(b)),
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

    const reasonCodes = ["v013-doctrine-augmented-static"];
    if (aggregate.doctrineAdmittedCount > 0) {
      reasonCodes.push("verified-primary-doctrine-fallback-admitted");
    }
    if (availability === "partial") {
      reasonCodes.push("natal-static-evidence-partial-coverage");
    }
    if (availability === "unavailable") {
      reasonCodes.push("natal-static-evidence-low-coverage");
    }

    byDomain[domain] = {
      signal: buildLayerSignal({
        layer: "natal-foundation",
        domain,
        supportMass: aggregate.supportMass,
        pressureMass: aggregate.pressureMass,
        activation: aggregate.activation,
        coverage: effectiveCoverage,
        availability,
        contributors,
        reasonCodes,
        signedNetOverride: aggregate.signedNet,
      }),
      projection: aggregate.projection.trace,
      aggregate,
      evidenceCoverage,
    };
  }

  return { byDomain };
}
