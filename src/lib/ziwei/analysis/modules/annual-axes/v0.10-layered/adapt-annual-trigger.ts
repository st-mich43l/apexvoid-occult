import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import {
  loadAnnualAxesKnowledgeV08NamPhai,
  type AnnualAxesKnowledgeV08NamPhai,
} from "../../../knowledge/annual-axes/v0.8";
import { scoreV08Domain } from "../nam-phai-v08/score-domain";
import {
  buildLayerSignal,
  emptyLayerSignal,
  clampSignedNet,
} from "./layer-contract";
import type { AnnualLayerContributor, AnnualLayerSignal } from "./types";

export function adaptAnnualTrigger(input: {
  chart: ChartData;
  domains: readonly AnnualAxisDomain[];
  knowledge08?: AnnualAxesKnowledgeV08NamPhai;
}): {
  byDomain: Record<AnnualAxisDomain, AnnualLayerSignal>;
  knowledge08: AnnualAxesKnowledgeV08NamPhai | null;
} {
  const loaded = input.knowledge08
    ? { ok: true as const, knowledge: input.knowledge08 }
    : loadAnnualAxesKnowledgeV08NamPhai();

  const byDomain = {} as Record<AnnualAxisDomain, AnnualLayerSignal>;

  if (!loaded.ok) {
    for (const domain of input.domains) {
      byDomain[domain] = emptyLayerSignal("annual-trigger", domain, "unavailable", [
        "invalid-v08-knowledge",
      ]);
    }
    return { byDomain, knowledge08: null };
  }

  const knowledge08 = loaded.knowledge;
  const rawClampMax = knowledge08.pointClasses.axisRawClamp.maximum;

  for (const domain of input.domains) {
    const scored = scoreV08Domain({
      chart: input.chart,
      domain,
      knowledge: knowledge08,
    });

    if (scored.availability === "unavailable" || scored.score == null) {
      byDomain[domain] = emptyLayerSignal(
        "annual-trigger",
        domain,
        "unavailable",
        scored.missingReasonCodes.length
          ? scored.missingReasonCodes
          : ["annual-trigger-unavailable"],
      );
      continue;
    }

    const signedNet = clampSignedNet(
      scored.trace.prominenceAdjustedRaw / rawClampMax,
    );

    const contributors: AnnualLayerContributor[] = scored.matchedFacts.map((f) => ({
      id: `annual:${domain}:${f.ruleId}:${f.exactMatchedStarName}`,
      layer: "annual-trigger" as const,
      palaceName: f.annualPalaceName,
      palaceIndex: f.palaceIndex,
      physicalFactIds: [f.exactMatchedStarName],
      sourceIds: ["SRC-AA-V08-CONTROL"],
      direction:
        f.polarity === "positive"
          ? ("support" as const)
          : f.polarity === "negative"
            ? ("pressure" as const)
            : ("neutral" as const),
      magnitude: Math.abs(f.weightedContribution),
      sourceModule: "annual-axes-v08" as const,
    }));

    byDomain[domain] = buildLayerSignal({
      layer: "annual-trigger",
      domain,
      supportMass: Math.max(0, scored.trace.prominenceAdjustedRaw),
      pressureMass: Math.max(0, -scored.trace.prominenceAdjustedRaw),
      activation: Math.min(1, Math.abs(scored.trace.prominenceAdjustedRaw) / rawClampMax),
      coverage:
        scored.coverage.totalWeight > 0
          ? scored.coverage.resolvedWeight / scored.coverage.totalWeight
          : 0,
      availability:
        scored.availability === "partial-data" ? "partial" : "available",
      contributors,
      reasonCodes:
        scored.availability === "partial-data" ? scored.missingReasonCodes : [],
      signedNetOverride: signedNet,
    });
  }

  return { byDomain, knowledge08 };
}
