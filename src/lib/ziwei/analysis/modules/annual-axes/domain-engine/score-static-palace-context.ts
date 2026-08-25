import type { ChartData } from "@/types/chart";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import {
  clampPalaceRaw,
  matchPalaceStars,
} from "../nam-phai-v08/match-stars";
import { collectStaticNatalStars } from "./collect-static-facts";
import type {
  AnnualDomainStaticEvidence,
  ResolvedDomainPalace,
  StaticPalaceContextScore,
} from "./types";

const ACTIVATION_REFERENCE = 8;

const ANNUAL_FLOW_NAME =
  /^(Lưu Thái Tuế|Lưu Văn Xương|Lưu Văn Khúc|Lưu Khôi|Lưu Việt|Lưu Lộc Tồn|Lưu Kình|Lưu Đà|Lưu Hóa)/;

/**
 * Score one mapped natal palace for a life domain using Annual-Axes V0.8
 * star policies restricted to natal/static facts only.
 */
export function scoreStaticPalaceContext(input: {
  chart: ChartData;
  domain: AnnualAxisDomain;
  palace: ResolvedDomainPalace;
  knowledge08: AnnualAxesKnowledgeV08NamPhai;
}): StaticPalaceContextScore {
  const { chart, domain, palace, knowledge08 } = input;
  const staticStars = collectStaticNatalStars(chart, palace.palaceIndex);

  // Temporarily score against a view that only exposes natal static stars so
  // annual/major facts never enter the static domain foundation.
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
    knowledge: knowledge08,
    palaceRole: "primary",
    palaceWeight: palace.effectiveLayerWeight,
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
      factIds: [`aa-static:${fact.ruleId}:${fact.exactMatchedStarName}`],
      starName: fact.exactMatchedStarName,
      system: "annual-axes-v08-star-registry",
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
      factIds: [`aa-static:unresolved:${palace.palaceName}`],
      starName: "",
      system: "annual-axes-domain-engine",
      polarity: "neutral",
      magnitudeOrdinal: 0,
      sourceIds: ["SRC-AA-DOMAIN-STATIC-UNRESOLVED"],
      adjudication: "unresolved",
      temporalLayer: "natal",
    });
  }

  const palaceRaw = clampPalaceRaw(positivePoints, negativePoints, knowledge08);
  const w = palace.effectiveLayerWeight;
  const supportMass = positivePoints * w;
  const pressureMass = negativePoints * w;
  const activation =
    Math.min(1, (positivePoints + negativePoints) / ACTIVATION_REFERENCE) * w;

  void palaceRaw;

  return {
    palaceName: palace.palaceName,
    palaceIndex: palace.palaceIndex,
    role: palace.role,
    effectiveLayerWeight: w,
    supportMass,
    pressureMass,
    activation,
    evidence,
    unresolved,
  };
}
