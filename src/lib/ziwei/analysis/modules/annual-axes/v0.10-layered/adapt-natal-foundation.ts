import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import type { PalaceOverviewResult } from "../../palace-overview/types";
import { analyzeAllPalaces } from "../../palace-overview";
import {
  buildLayerSignal,
  emptyLayerSignal,
} from "./layer-contract";
import { projectDomainAnchors } from "./domain-projection";
import type { AnnualLayerContributor, AnnualLayerSignal, DomainProjectionTrace } from "./types";

export interface NatalFoundationBundle {
  byDomain: Record<
    AnnualAxisDomain,
    {
      signal: AnnualLayerSignal;
      projection: DomainProjectionTrace;
    }
  >;
  palaceResults: PalaceOverviewResult[];
}

function palaceByName(
  results: PalaceOverviewResult[],
  name: string,
): PalaceOverviewResult | undefined {
  return results.find((r) => r.palaceName === name);
}

export function adaptNatalFoundation(input: {
  chart: ChartData;
  knowledge: AnnualAxesKnowledgeV10;
  domains: readonly AnnualAxisDomain[];
  projectionVariant: V10ProjectionVariantId;
  palaceResults?: PalaceOverviewResult[];
}): NatalFoundationBundle {
  const { chart, knowledge, domains, projectionVariant } = input;
  const palaceResults =
    input.palaceResults ??
    analyzeAllPalaces(chart, { school: "nam-phai" }).results;

  const byDomain = {} as NatalFoundationBundle["byDomain"];

  for (const domain of domains) {
    const projection = projectDomainAnchors({
      knowledge,
      domain,
      variant: projectionVariant,
      layer: "natal",
      resolvePalace: (palace) => Boolean(palaceByName(palaceResults, palace)),
    });

    if (projection.resolved.length === 0) {
      byDomain[domain] = {
        signal: emptyLayerSignal("natal-foundation", domain, "unavailable", [
          "missing-natal-foundation",
          "no-resolved-structural-anchors",
        ]),
        projection: projection.trace,
      };
      continue;
    }

    let supportMass = 0;
    let pressureMass = 0;
    let activationAcc = 0;
    let weightAcc = 0;
    const contributors: AnnualLayerContributor[] = [];

    for (const anchor of projection.resolved) {
      const palace = palaceByName(palaceResults, anchor.palace)!;
      const w = anchor.effectiveLayerWeight;
      supportMass += palace.rawAxes.support * w;
      pressureMass += palace.rawAxes.pressure * w;
      activationAcc += palace.rawAxes.activation * w;
      weightAcc += w;

      const net = palace.rawAxes.support - palace.rawAxes.pressure;
      contributors.push({
        id: `natal:${domain}:${palace.palaceName}`,
        layer: "natal-foundation",
        palaceName: palace.palaceName,
        palaceIndex: palace.palaceIndex,
        physicalFactIds: palace.allEvidence.flatMap((e) => e.factIds).slice(0, 12),
        sourceIds: ["SRC-PO-UPSTREAM"],
        direction: net > 0 ? "support" : net < 0 ? "pressure" : "neutral",
        magnitude: Math.abs(net) * w,
        sourceModule: "palace-overview",
        originalWeight: anchor.originalWeight,
        effectiveLayerWeight: anchor.effectiveLayerWeight,
      });
    }

    const share = projection.coverage;
    const availability =
      share >= knowledge.coveragePolicy.minResolvedWeightShareForAvailable
        ? share < 0.999
          ? "partial"
          : "available"
        : "unavailable";

    const signedNet = (() => {
      const eps = knowledge.natalConversion.epsilon;
      const denom = Math.max(supportMass + pressureMass, eps);
      return (supportMass - pressureMass) / denom;
    })();

    byDomain[domain] = {
      signal: buildLayerSignal({
        layer: "natal-foundation",
        domain,
        supportMass,
        pressureMass,
        activation: weightAcc > 0 ? activationAcc / weightAcc : 0,
        coverage: share,
        availability:
          availability === "unavailable"
            ? "unavailable"
            : availability,
        contributors,
        reasonCodes:
          availability === "available"
            ? []
            : availability === "partial"
              ? ["natal-projection-partial-coverage"]
              : ["natal-foundation-low-coverage"],
        signedNetOverride: signedNet,
      }),
      projection: projection.trace,
    };
  }

  return { byDomain, palaceResults };
}
