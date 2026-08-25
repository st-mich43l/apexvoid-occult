import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxesKnowledgeV12 } from "../../../knowledge/annual-axes/v0.12";
import type { AnnualAxesKnowledgeV13 } from "../../../knowledge/annual-axes/v0.13";
import { resolveDomainPalaces } from "../domain-engine/resolve-domain-palaces";
import {
  scoreStaticPalaceV13,
  type StaticPalaceV13Score,
} from "./score-static-palace";

export interface StaticDomainAggregateV13 {
  domain: AnnualAxisDomain;
  supportMass: number;
  pressureMass: number;
  activation: number;
  signedNet: number;
  coverage: number;
  mappedPalaces: ReturnType<typeof resolveDomainPalaces>["mappedPalaces"];
  palaceContexts: StaticPalaceV13Score[];
  physicalPalaceDedupCount: number;
  referenceMass: number;
  projection: ReturnType<typeof resolveDomainPalaces>["projection"];
  doctrineAdmittedCount: number;
  doctrineCoveredPalaceCount: number;
  unresolvedPalaceCount: number;
}

export function aggregateStaticDomainV13(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV10;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
  knowledge12: AnnualAxesKnowledgeV12;
  knowledge13: AnnualAxesKnowledgeV13;
  projectionVariant: V10ProjectionVariantId;
  referenceMass: number;
}): StaticDomainAggregateV13 {
  const resolved = resolveDomainPalaces({
    chart: input.chart,
    knowledge: input.knowledge,
    domain: input.domain,
    projectionVariant: input.projectionVariant,
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

  const weightSum = [...byPhysical.values()].reduce((sum, entry) => sum + entry.weight, 0);
  const palaceContexts: StaticPalaceV13Score[] = [];
  let signedNet = 0;
  let supportMass = 0;
  let pressureMass = 0;
  let activation = 0;

  for (const [palaceIndex, entry] of byPhysical) {
    const scored = scoreStaticPalaceV13({
      chart: input.chart,
      domain: input.domain,
      palace: {
        palaceName: entry.palaceName,
        palaceIndex,
        branch: entry.branch,
        role: entry.roles.join("+"),
        originalWeight: entry.originalWeight,
        effectiveLayerWeight: entry.weight,
      },
      knowledge08: input.knowledge08,
      knowledge12: input.knowledge12,
      knowledge13: input.knowledge13,
      referenceMass: input.referenceMass,
    });
    const normalizedWeight = weightSum > 0 ? entry.weight / weightSum : 0;
    palaceContexts.push({ ...scored, roleWeight: normalizedWeight });
    signedNet += normalizedWeight * scored.palaceSignedNet;
    supportMass += normalizedWeight * scored.positivePoints;
    pressureMass += normalizedWeight * scored.negativePoints;
    activation += normalizedWeight * scored.activation;
  }

  return {
    domain: input.domain,
    supportMass,
    pressureMass,
    activation,
    signedNet,
    coverage: resolved.coverage,
    mappedPalaces: resolved.mappedPalaces,
    palaceContexts,
    physicalPalaceDedupCount: byPhysical.size,
    referenceMass: input.referenceMass,
    projection: resolved.projection,
    doctrineAdmittedCount: palaceContexts.reduce(
      (sum, ctx) => sum + ctx.doctrineAdmittedCount,
      0,
    ),
    doctrineCoveredPalaceCount: palaceContexts.filter(
      (ctx) => ctx.doctrineAdmittedCount > 0,
    ).length,
    unresolvedPalaceCount: palaceContexts.filter((ctx) => ctx.unresolved).length,
  };
}
