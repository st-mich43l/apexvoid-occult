/**
 * Shared spatial-budget scoring path for production (E) and ablation variants B–E.
 */

import type { ChartData } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../../../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV043NamPhai } from "../../../knowledge/annual-axes/v0.4.3";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { buildAnnualFocusFrame } from "../build-annual-focus-frame";
import { resolveAnnualFocus } from "../resolvers/resolve-annual-focus";
import { emptyAnnualAxesDiagnostics } from "../diagnostics";
import { collectNamPhaiV04TriggeredEvidence } from "../nam-phai-v04/collect-evidence";
import { computeNatalDomainResponse } from "../nam-phai-v04/natal-response";
import { computeDomainRoutingsV04 } from "../nam-phai-v04/routing";
import { classifyEvidencePaths } from "./classify-paths";
import { aggregateSpatialBudget, type DiminishingGroupBy } from "./aggregate-spatial";
import { dedupeSpatialPaths } from "./dedupe";
import { normalizeSpatialBudgetV043 } from "./normalize-spatial";

export interface SpatialVariantDomainMetrics {
  domain: AnnualAxisDomain;
  score: number | null;
  directContribution: number;
  tp4cContribution: number;
  spatialSigned: number;
  activationGate: number;
  retainedSignedFactCount: number;
  retainedActivationFactCount: number;
  directWonCollisionCount: number;
  numericEvidenceCount: number;
}

export interface SpatialVariantOptions {
  /** Variant B — keep every signed path (no physical-fact dedupe). */
  skipDedupe?: boolean;
  /** Variant C uses V0.4 delta floor (0.15); D/E use production floor (0). */
  activationGateFloor?: number;
  /** Variant C/D omit geometryBucket; variant E includes it (production). */
  diminishingGroupBy?: DiminishingGroupBy;
}

const UNAVAILABLE_DOMAIN = (domain: AnnualAxisDomain): SpatialVariantDomainMetrics => ({
  domain,
  score: null,
  directContribution: 0,
  tp4cContribution: 0,
  spatialSigned: 0,
  activationGate: 0,
  retainedSignedFactCount: 0,
  retainedActivationFactCount: 0,
  directWonCollisionCount: 0,
  numericEvidenceCount: 0,
});

/** Score all six domains under a spatial-budget variant (research / ablation). */
export function scoreSpatialVariantDomains(
  chart: ChartData,
  options: SpatialVariantOptions = {},
): SpatialVariantDomainMetrics[] {
  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  const knowledge043 = loadAnnualAxesKnowledgeV043NamPhai();
  const numeric = loadPalaceOverviewKnowledgeV1();
  if (!knowledge04.ok || !knowledge042.ok || !knowledge043.ok || !numeric.ok) {
    throw new Error("knowledge load failed for spatial variant scoring");
  }

  const diagnostics = emptyAnnualAxesDiagnostics();
  const focus = resolveAnnualFocus(chart, "nam-phai");
  const headFrame = focus.focus ? buildAnnualFocusFrame(chart, focus.focus) : null;
  if (!headFrame) {
    return ANNUAL_AXIS_DOMAINS.map(UNAVAILABLE_DOMAIN);
  }

  const routings = computeDomainRoutingsV04(chart, knowledge04.knowledge, headFrame, diagnostics);
  const out: SpatialVariantDomainMetrics[] = [];

  for (const domain of ANNUAL_AXIS_DOMAINS) {
    const routing = routings.get(domain);
    if (!routing) {
      out.push(UNAVAILABLE_DOMAIN(domain));
      continue;
    }

    const { evidence, stats } = collectNamPhaiV04TriggeredEvidence({
      chart,
      domain,
      knowledge: knowledge04.knowledge,
      knowledge042: knowledge042.knowledge,
      numericKnowledge: numeric.knowledge,
      headFrame,
      routing,
      diagnostics,
    });

    const classified = classifyEvidencePaths(
      evidence,
      headFrame.focusPalaceIndex,
      knowledge043.knowledge.spatialBudget.tp4cRelativeRoleWeights,
    );

    const deduped = options.skipDedupe
      ? (() => {
          const signed = classified.filter(
            (c) => c.geometryBucket === "direct" || c.geometryBucket === "tp4c",
          );
          const activation = classified.filter(
            (c) =>
              c.geometryBucket === "direct" ||
              c.geometryBucket === "tp4c" ||
              knowledge043.knowledge.aggregationProfile.contextChannels.mayContributeActivation,
          );
          return {
            signedRetained: signed,
            activationRetained: activation,
            rejected: [] as ReturnType<typeof dedupeSpatialPaths>["rejected"],
            trace: {
              candidateEvidenceCount: evidence.length,
              candidatePathCount: classified.length,
              retainedSignedFactCount: signed.length,
              retainedActivationFactCount: activation.length,
              droppedDuplicatePathCount: 0,
              directWonCollisionCount: 0,
            },
          };
        })()
      : dedupeSpatialPaths(classified, knowledge043.knowledge);

    const aggregated = aggregateSpatialBudget(deduped, knowledge043.knowledge, {
      diminishingGroupBy: options.diminishingGroupBy,
    });
    const natalResponse = computeNatalDomainResponse(
      chart,
      domain,
      knowledge04.knowledge,
      numeric.knowledge,
    );
    const normalized = normalizeSpatialBudgetV043({
      spatialSigned: aggregated.spatialSigned,
      activationNorm: aggregated.activationNorm,
      natalResponse,
      rawAxes: aggregated.rawAxes,
      knowledge043: knowledge043.knowledge,
      knowledge04: knowledge04.knowledge,
      activationGateFloorOverride: options.activationGateFloor,
    });

    out.push({
      domain,
      score: normalized.score,
      directContribution: aggregated.spatialBudgetTrace.directContribution,
      tp4cContribution: aggregated.spatialBudgetTrace.tp4cContribution,
      spatialSigned: aggregated.spatialSigned,
      activationGate: normalized.activationGate,
      retainedSignedFactCount: deduped.trace.retainedSignedFactCount,
      retainedActivationFactCount: deduped.trace.retainedActivationFactCount,
      directWonCollisionCount: deduped.trace.directWonCollisionCount,
      numericEvidenceCount: stats.numericFacts,
    });
  }

  return out;
}

/** Production V0.4.3 (variant E) — dedupe + floor 0 + geometryBucket diminishing. */
export const PRODUCTION_SPATIAL_VARIANT: SpatialVariantOptions = {};

/** Ablation matrix presets (each measures one incremental change). */
export const ABLATION_SPATIAL_VARIANTS = {
  "B-budget-only-no-dedupe": { skipDedupe: true } satisfies SpatialVariantOptions,
  "C-budget-plus-direct-wins": {
    activationGateFloor: 0.15,
    diminishingGroupBy: ["domain", "layer", "stackingGroup"],
  } satisfies SpatialVariantOptions,
  "D-c-plus-activation-floor-0": {
    activationGateFloor: 0,
    diminishingGroupBy: ["domain", "layer", "stackingGroup"],
  } satisfies SpatialVariantOptions,
  "E-d-plus-diminishing-geometryBucket": PRODUCTION_SPATIAL_VARIANT,
} as const;
