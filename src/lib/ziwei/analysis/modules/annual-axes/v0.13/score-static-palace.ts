import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxesKnowledgeV12 } from "../../../knowledge/annual-axes/v0.12";
import type { AnnualAxesKnowledgeV13 } from "../../../knowledge/annual-axes/v0.13";
import type {
  AnnualDomainStaticEvidence,
  ResolvedDomainPalace,
} from "../domain-engine/types";
import { exactCanonicalStarName } from "../nam-phai-v08/star-identity";
import {
  scoreStaticPalaceV12,
  type StaticPalaceV12Score,
} from "../v0.12/score-static-palace";
import { palaceSignedNet } from "../v0.12/static-signal";
import {
  collectDoctrineFallbackEvidence,
  type V13DoctrineEvidence,
} from "./doctrine-bridge";

export interface StaticPalaceV13Score extends StaticPalaceV12Score {
  doctrineEvidence: V13DoctrineEvidence[];
  doctrineAdmittedCount: number;
  v12EvidenceMass: number;
}

export function scoreStaticPalaceV13(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  palace: ResolvedDomainPalace;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
  knowledge12: AnnualAxesKnowledgeV12;
  knowledge13: AnnualAxesKnowledgeV13;
  referenceMass: number;
}): StaticPalaceV13Score {
  const base = scoreStaticPalaceV12({
    chart: input.chart,
    domain: input.domain,
    palace: input.palace,
    knowledge08: input.knowledge08,
    knowledge12: input.knowledge12,
    referenceMass: input.referenceMass,
  });

  const alreadyScoredStars = new Set(
    base.evidence
      .filter((e) => e.adjudication === "admitted" && e.starName.length > 0)
      .map((e) => exactCanonicalStarName(e.starName)),
  );

  const doctrineEvidence = collectDoctrineFallbackEvidence({
    chart: input.chart,
    palaceIndex: input.palace.palaceIndex,
    palaceName: input.palace.palaceName,
    knowledge: input.knowledge13,
    alreadyScoredStars,
  });

  let doctrinePositive = 0;
  let doctrineNegative = 0;
  const mappedDoctrineEvidence: AnnualDomainStaticEvidence[] = [];

  for (const item of doctrineEvidence) {
    if (item.admittedForNumeric && item.direction === "support") {
      doctrinePositive += item.points;
    }
    if (item.admittedForNumeric && item.direction === "pressure") {
      doctrineNegative += item.points;
    }

    mappedDoctrineEvidence.push({
      domain: input.domain,
      palaceName: input.palace.palaceName,
      palaceRole: input.palace.role,
      palaceIndex: input.palace.palaceIndex,
      factIds: [`aa-static-v13-doctrine:${item.claimId}`],
      starName: item.starName,
      system: "annual-axes-v013-doctrine-bridge",
      polarity:
        item.direction === "support"
          ? "support"
          : item.direction === "pressure"
            ? "pressure"
            : "neutral",
      magnitudeOrdinal: item.points,
      sourceIds: [...item.sourceIds, "SRC-AA-V013-DOCTRINE-BRIDGE"],
      adjudication: item.admittedForNumeric ? "admitted" : "context-only",
      temporalLayer: "natal",
    });
  }

  const positivePoints = base.positivePoints + doctrinePositive;
  const negativePoints = base.negativePoints + doctrineNegative;
  const signal = palaceSignedNet({
    positive: positivePoints,
    negative: negativePoints,
    epsilon: input.knowledge13.epsilon,
    referenceMass: input.referenceMass,
  });

  const doctrineAdmittedCount = doctrineEvidence.filter(
    (e) => e.admittedForNumeric,
  ).length;

  return {
    ...base,
    positivePoints,
    negativePoints,
    evidenceMass: signal.evidenceMass,
    directionalNet: signal.directionalNet,
    activation: signal.activation,
    palaceSignedNet: signal.signedNet,
    evidence: [...base.evidence, ...mappedDoctrineEvidence],
    unresolved: base.unresolved && doctrineAdmittedCount === 0,
    doctrineEvidence,
    doctrineAdmittedCount,
    v12EvidenceMass: base.evidenceMass,
  };
}
