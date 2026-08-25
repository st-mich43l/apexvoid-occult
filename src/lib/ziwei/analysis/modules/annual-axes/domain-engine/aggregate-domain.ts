import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type {
  AnnualAxesKnowledgeV10,
  V10ProjectionVariantId,
} from "../../../knowledge/annual-axes/v0.10";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import { resolveDomainPalaces } from "./resolve-domain-palaces";
import { scoreStaticPalaceContext } from "./score-static-palace-context";
import type { StaticDomainAggregate, StaticPalaceContextScore } from "./types";

/**
 * Aggregate static domain signal from ChartData + AnnualDomainProjection.
 * Same physical palace reached via multiple roles is scored once; weights combine.
 */
export function aggregateStaticDomain(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV10;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
  projectionVariant: V10ProjectionVariantId;
}): StaticDomainAggregate & {
  projection: ReturnType<typeof resolveDomainPalaces>["projection"];
} {
  const { chart, domain, knowledge, knowledge08, projectionVariant } = input;
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

  const palaceContexts: StaticPalaceContextScore[] = [];
  let supportMass = 0;
  let pressureMass = 0;
  let activationAcc = 0;
  let weightAcc = 0;

  for (const [palaceIndex, entry] of byPhysical) {
    const scored = scoreStaticPalaceContext({
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
    });
    palaceContexts.push(scored);
    supportMass += scored.supportMass;
    pressureMass += scored.pressureMass;
    activationAcc += scored.activation;
    weightAcc += entry.weight;
  }

  const eps = knowledge.natalConversion.epsilon;
  const denom = Math.max(supportMass + pressureMass, eps);
  const signedNet = (supportMass - pressureMass) / denom;

  return {
    domain,
    supportMass,
    pressureMass,
    activation: weightAcc > 0 ? activationAcc / weightAcc : 0,
    signedNet,
    coverage: resolved.coverage,
    mappedPalaces: resolved.mappedPalaces,
    palaceContexts,
    evidence: palaceContexts.flatMap((c) => c.evidence),
    physicalPalaceDedupCount: byPhysical.size,
    projection: resolved.projection,
  };
}
