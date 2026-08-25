import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxesKnowledgeV12 } from "../../../knowledge/annual-axes/v0.12";
import {
  clampPalaceRaw,
  matchPalaceStars,
} from "../nam-phai-v08/match-stars";
import { collectStaticNatalStars } from "../domain-engine/collect-static-facts";
import type {
  AnnualDomainStaticEvidence,
  ResolvedDomainPalace,
} from "../domain-engine/types";
import { palaceSignedNet } from "./static-signal";

const ANNUAL_FLOW_NAME =
  /^(Lưu Thái Tuế|Lưu Văn Xương|Lưu Văn Khúc|Lưu Khôi|Lưu Việt|Lưu Lộc Tồn|Lưu Kình|Lưu Đà|Lưu Hóa)/;

export interface StaticPalaceV12Score {
  palaceName: string;
  palaceIndex: number;
  role: string;
  roleWeight: number;
  positivePoints: number;
  negativePoints: number;
  evidenceMass: number;
  directionalNet: number;
  activation: number;
  palaceSignedNet: number;
  /** Computed for audit only — V0.12 does not use this in signedNet. */
  clampedPalaceRaw: number;
  evidence: AnnualDomainStaticEvidence[];
  unresolved: boolean;
}

/**
 * Build a V0.8-shaped knowledge view whose starRegistry axes are the V0.12
 * static-domain registry (natal-only extraction). No invented point classes.
 */
function knowledge08WithStaticRegistry(
  knowledge08: AnnualAxesKnowledgeV08NamPhai,
  knowledge12: AnnualAxesKnowledgeV12,
): AnnualAxesKnowledgeV08NamPhai {
  return {
    ...knowledge08,
    starRegistry: {
      ...knowledge08.starRegistry,
      schemaVersion: knowledge08.starRegistry.schemaVersion,
      catalogId: "static-domain-registry-nam-phai-v0-12-view",
      axes: knowledge12.staticRegistry.axes as typeof knowledge08.starRegistry.axes,
    },
  };
}

export function scoreStaticPalaceV12(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  palace: ResolvedDomainPalace;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
  knowledge12: AnnualAxesKnowledgeV12;
  referenceMass: number;
}): StaticPalaceV12Score {
  const { chart, domain, palace, knowledge08, knowledge12, referenceMass } =
    input;
  const staticStars = collectStaticNatalStars(chart, palace.palaceIndex);
  const natalOnlyChart: ChartData = {
    ...chart,
    palaces: chart.palaces.map((p) =>
      p.index === palace.palaceIndex ? { ...p, stars: staticStars } : p,
    ),
  };

  const matched = matchPalaceStars({
    chart: natalOnlyChart,
    palaceIndex: palace.palaceIndex,
    annualPalaceName: palace.palaceName,
    domain,
    knowledge: knowledge08WithStaticRegistry(knowledge08, knowledge12),
    palaceRole: "primary",
    palaceWeight: 1,
  });

  const natalFacts = matched.matchedFacts.filter(
    (f) =>
      f.temporalLayer === "natal" &&
      !ANNUAL_FLOW_NAME.test(f.exactMatchedStarName),
  );

  let positivePoints = 0;
  let negativePoints = 0;
  const evidence: AnnualDomainStaticEvidence[] = [];
  for (const fact of natalFacts) {
    if (fact.polarity === "positive") positivePoints += Math.abs(fact.points);
    else negativePoints += Math.abs(fact.points);
    evidence.push({
      domain,
      palaceName: palace.palaceName,
      palaceRole: palace.role,
      palaceIndex: palace.palaceIndex,
      factIds: [`aa-static-v12:${fact.ruleId}:${fact.exactMatchedStarName}`],
      starName: fact.exactMatchedStarName,
      system: "annual-axes-v012-static-registry",
      polarity: fact.polarity === "positive" ? "support" : "pressure",
      magnitudeOrdinal: Math.abs(fact.points),
      sourceIds: [fact.sourceId],
      adjudication: "admitted",
      temporalLayer: "natal",
    });
  }

  const unresolved = natalFacts.length === 0;
  if (unresolved) {
    evidence.push({
      domain,
      palaceName: palace.palaceName,
      palaceRole: palace.role,
      palaceIndex: palace.palaceIndex,
      factIds: [`aa-static-v12:unresolved:${palace.palaceName}`],
      starName: "",
      system: "annual-axes-v012-domain-engine",
      polarity: "neutral",
      magnitudeOrdinal: 0,
      sourceIds: ["SRC-AA-V012-STATIC-REGISTRY"],
      adjudication: "unresolved",
      temporalLayer: "natal",
    });
  }

  const clampedPalaceRaw = clampPalaceRaw(
    positivePoints,
    negativePoints,
    knowledge08,
  );
  const signal = palaceSignedNet({
    positive: positivePoints,
    negative: negativePoints,
    epsilon: knowledge12.epsilon,
    referenceMass,
  });

  return {
    palaceName: palace.palaceName,
    palaceIndex: palace.palaceIndex,
    role: palace.role,
    roleWeight: palace.originalWeight,
    positivePoints,
    negativePoints,
    evidenceMass: signal.evidenceMass,
    directionalNet: signal.directionalNet,
    activation: signal.activation,
    palaceSignedNet: signal.signedNet,
    clampedPalaceRaw,
    evidence,
    unresolved,
  };
}
