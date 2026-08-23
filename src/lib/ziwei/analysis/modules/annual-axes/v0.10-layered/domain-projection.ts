import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10LayerApplicability,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import { resolveProjectionVariant } from "../../../knowledge/annual-axes/v0.10";
import type { DomainProjectionTrace } from "./types";

interface ResolvedDomainAnchor {
  palace: string;
  originalWeight: number;
  effectiveLayerWeight: number;
  temporalOnly: boolean;
}

export interface DomainProjectionResolution {
  trace: DomainProjectionTrace;
  resolved: ResolvedDomainAnchor[];
  coverage: number;
}

export function projectDomainAnchors(input: {
  knowledge: AnnualAxesKnowledgeV10;
  domain: AnnualAxisDomain;
  variant: V10ProjectionVariantId;
  layer: V10LayerApplicability;
  resolvePalace: (palace: string) => boolean;
}): DomainProjectionResolution {
  const { knowledge, domain, variant, layer, resolvePalace } = input;
  const mapping = resolveProjectionVariant(knowledge, variant)[domain];
  const anchors = mapping.anchors;

  const totalConfiguredWeight = anchors.reduce((s, a) => s + a.weight, 0);
  const resolvedRaw: Array<{
    palace: string;
    originalWeight: number;
    temporalOnly: boolean;
    resolved: boolean;
    unavailableForLayer: boolean;
  }> = [];

  let resolvedWeight = 0;
  for (const a of anchors) {
    const applicable = a.layerApplicability.includes(layer);
    const temporalOnly = Boolean(a.temporalOnly);
    if (!applicable) {
      resolvedRaw.push({
        palace: a.palace,
        originalWeight: a.weight,
        temporalOnly,
        resolved: false,
        unavailableForLayer: true,
      });
      continue;
    }
    if (temporalOnly && layer !== "annual") {
      resolvedRaw.push({
        palace: a.palace,
        originalWeight: a.weight,
        temporalOnly: true,
        resolved: false,
        unavailableForLayer: true,
      });
      continue;
    }
    const ok = resolvePalace(a.palace);
    if (ok) resolvedWeight += a.weight;
    resolvedRaw.push({
      palace: a.palace,
      originalWeight: a.weight,
      temporalOnly,
      resolved: ok,
      unavailableForLayer: false,
    });
  }

  const renormalize = knowledge.coveragePolicy.renormalizeResolvedStructuralAnchors;
  const coverage =
    totalConfiguredWeight > 0 ? resolvedWeight / totalConfiguredWeight : 0;

  const resolved: ResolvedDomainAnchor[] = [];
  for (const row of resolvedRaw) {
    if (!row.resolved || row.unavailableForLayer) continue;
    const effective =
      renormalize && resolvedWeight > 0
        ? row.originalWeight / resolvedWeight
        : row.originalWeight;
    resolved.push({
      palace: row.palace,
      originalWeight: row.originalWeight,
      effectiveLayerWeight: effective,
      temporalOnly: row.temporalOnly,
    });
  }

  const trace: DomainProjectionTrace = {
    variant,
    anchors: resolvedRaw.map((r) => ({
      palace: r.palace,
      originalWeight: r.originalWeight,
      effectiveLayerWeight:
        resolved.find((x) => x.palace === r.palace)?.effectiveLayerWeight ?? null,
      resolved: r.resolved,
      temporalOnly: r.temporalOnly,
      unavailableForLayer: r.unavailableForLayer,
    })),
    resolvedWeight,
    totalConfiguredWeight,
    coverage,
    renormalized: renormalize && resolvedWeight > 0 && resolvedWeight < totalConfiguredWeight,
  };

  return { trace, resolved, coverage };
}
