import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxesKnowledgeV12 } from "../../../knowledge/annual-axes/v0.12";
import { resolveDomainPalaces } from "../domain-engine/resolve-domain-palaces";
import {
  scoreStaticPalaceV12,
  type StaticPalaceV12Score,
} from "./score-static-palace";

export interface StaticDomainAggregateV12 {
  domain: AnnualAxisDomain;
  supportMass: number;
  pressureMass: number;
  activation: number;
  signedNet: number;
  coverage: number;
  mappedPalaces: ReturnType<typeof resolveDomainPalaces>["mappedPalaces"];
  palaceContexts: StaticPalaceV12Score[];
  physicalPalaceDedupCount: number;
  referenceMass: number;
  projection: ReturnType<typeof resolveDomainPalaces>["projection"];
}

/**
 * Score each physical palace independently, then combine by normalized role
 * weights. Physical-palace dedup: score facts once; sum role weights.
 */
export function aggregateStaticDomainV12(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV10;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
  knowledge12: AnnualAxesKnowledgeV12;
  projectionVariant: V10ProjectionVariantId;
  referenceMass: number;
}): StaticDomainAggregateV12 {
  const {
    chart,
    domain,
    knowledge,
    knowledge08,
    knowledge12,
    projectionVariant,
    referenceMass,
  } = input;
  const resolved = resolveDomainPalaces({
    chart,
    knowledge,
    domain,
    projectionVariant,
  });

  const byPhysical = new Map<
    number,
    {
      weight: number;
      roles: string[];
      palaceName: string;
      branch: string;
      originalWeight: number;
    }
  >();

  for (const p of resolved.mappedPalaces) {
    const existing = byPhysical.get(p.palaceIndex);
    if (existing) {
      existing.weight += p.effectiveLayerWeight;
      existing.originalWeight += p.originalWeight;
      existing.roles.push(p.role);
    } else {
      byPhysical.set(p.palaceIndex, {
        weight: p.effectiveLayerWeight,
        roles: [p.role],
        palaceName: p.palaceName,
        branch: p.branch,
        originalWeight: p.originalWeight,
      });
    }
  }

  const weightSum = [...byPhysical.values()].reduce((a, e) => a + e.weight, 0);
  const palaceContexts: StaticPalaceV12Score[] = [];
  let signedNet = 0;
  let supportMass = 0;
  let pressureMass = 0;
  let activationAcc = 0;

  for (const [palaceIndex, entry] of byPhysical) {
    const scored = scoreStaticPalaceV12({
      chart,
      domain,
      palace: {
        palaceName: entry.palaceName,
        palaceIndex,
        branch: entry.branch,
        role: entry.roles.join("+"),
        originalWeight: entry.originalWeight,
        effectiveLayerWeight: entry.weight,
      },
      knowledge08,
      knowledge12,
      referenceMass,
    });
    const normW = weightSum > 0 ? entry.weight / weightSum : 0;
    palaceContexts.push({ ...scored, roleWeight: normW });
    signedNet += normW * scored.palaceSignedNet;
    supportMass += scored.positivePoints * normW;
    pressureMass += scored.negativePoints * normW;
    activationAcc += scored.activation * normW;
  }

  return {
    domain,
    supportMass,
    pressureMass,
    activation: activationAcc,
    signedNet,
    coverage: resolved.coverage,
    mappedPalaces: resolved.mappedPalaces,
    palaceContexts,
    physicalPalaceDedupCount: byPhysical.size,
    referenceMass,
    projection: resolved.projection,
  };
}
