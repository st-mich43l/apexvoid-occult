import type { ChartData, ChartStar } from "@/types/chart";
import type {
  AnnualAxesKnowledgeV08NamPhai,
  V08PointClass,
  V08StarRule,
} from "../../../knowledge/annual-axes/v0.8";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import {
  exactCanonicalStarName,
  normalizeStarIdentity,
  type StarTemporalLayer,
} from "./star-identity";

export interface MatchedStarFact {
  starName: string;
  exactMatchedStarName: string;
  canonicalStarName: string;
  temporalLayer: StarTemporalLayer;
  ruleId: string;
  polarity: "positive" | "negative";
  points: number;
  palaceIndex: number;
  annualPalaceName: string;
  palaceRole: "primary" | "cooperating" | "small-limit";
  palaceWeight: number;
  weightedContribution: number;
  thaiTueProminenceApplied: boolean;
  sourceId: string;
}

function buildExactAliasLookup(
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of knowledge.starAliases.aliases) {
    const alias = exactCanonicalStarName(entry.alias);
    const canonical = exactCanonicalStarName(entry.canonical);
    map.set(alias, canonical);
    map.set(entry.alias.trim(), canonical);
  }
  return map;
}

function resolveExactName(
  name: string,
  aliasLookup: Map<string, string>,
): string {
  const exact = exactCanonicalStarName(name);
  return aliasLookup.get(exact) ?? aliasLookup.get(name.trim()) ?? exact;
}

function ruleMatchesStar(
  rule: V08StarRule,
  star: ChartStar,
  aliasLookup: Map<string, string>,
): boolean {
  const identity = normalizeStarIdentity(star);
  const starExact = resolveExactName(identity.exactCanonicalName, aliasLookup);
  const ruleExact = resolveExactName(rule.starName, aliasLookup);

  if (starExact !== ruleExact) return false;

  if (!rule.allowedTemporalLayers.includes(identity.temporalLayer)) {
    return false;
  }

  if (rule.allowedSources && rule.allowedSources.length > 0) {
    const source = star.source ?? "";
    if (!rule.allowedSources.includes(source)) return false;
  }

  return true;
}

function dignityOk(rule: V08StarRule, star: ChartStar): boolean {
  if (!rule.requiresDignity || rule.requiresDignity.length === 0) return true;
  const brightness = star.brightness ?? "";
  return rule.requiresDignity.includes(brightness);
}

function pointsFor(
  pointClass: V08PointClass,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): number {
  return knowledge.pointClasses.classes[pointClass];
}

/**
 * Match configured axis star rules against stars physically present in a palace.
 * Exact temporal identity is required — natal never satisfies annual-only rules.
 * Tứ Hóa rules take precedence; one physical star occurrence matches one rule.
 */
export function matchPalaceStars(input: {
  chart: ChartData;
  palaceIndex: number;
  annualPalaceName: string;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV08NamPhai;
  palaceRole?: "primary" | "cooperating" | "small-limit";
  palaceWeight?: number;
}): {
  positivePoints: number;
  negativePoints: number;
  matchedFacts: MatchedStarFact[];
} {
  const {
    chart,
    palaceIndex,
    annualPalaceName,
    domain,
    knowledge,
    palaceRole = "cooperating",
    palaceWeight = 0,
  } = input;
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  const stars = palace?.stars ?? [];
  const axis = knowledge.starRegistry.axes[domain];
  const aliasLookup = buildExactAliasLookup(knowledge);

  const positiveRules = [...axis.positive].sort((a, b) => {
    const tu = Number(Boolean(b.isTuHoa)) - Number(Boolean(a.isTuHoa));
    if (tu !== 0) return tu;
    return a.ruleId.localeCompare(b.ruleId);
  });
  const negativeRules = [...axis.negative].sort((a, b) => {
    const tu = Number(Boolean(b.isTuHoa)) - Number(Boolean(a.isTuHoa));
    if (tu !== 0) return tu;
    return a.ruleId.localeCompare(b.ruleId);
  });

  const usedStarKeys = new Set<string>();
  const matchedFacts: MatchedStarFact[] = [];
  let positivePoints = 0;
  let negativePoints = 0;

  const tryMatch = (rules: V08StarRule[], polarity: "positive" | "negative") => {
    for (const star of stars) {
      const identity = normalizeStarIdentity(star);
      const physicalKey = `${palaceIndex}|${identity.exactCanonicalName}|${star.source ?? ""}|${star.mutagen ?? ""}`;
      if (usedStarKeys.has(physicalKey)) continue;

      for (const rule of rules) {
        if (rule.polarity && rule.polarity !== polarity) continue;
        if (!ruleMatchesStar(rule, star, aliasLookup)) continue;
        if (!dignityOk(rule, star)) continue;

        const pts = pointsFor(rule.pointClass, knowledge);
        if (pts === 0) continue;

        usedStarKeys.add(physicalKey);
        const signedPoints = polarity === "positive" ? Math.abs(pts) : -Math.abs(pts);
        const fact: MatchedStarFact = {
          starName: star.name,
          exactMatchedStarName: resolveExactName(identity.exactCanonicalName, aliasLookup),
          canonicalStarName: identity.baseCanonicalName,
          temporalLayer: identity.temporalLayer,
          ruleId: rule.ruleId,
          polarity,
          points: signedPoints,
          palaceIndex,
          annualPalaceName,
          palaceRole,
          palaceWeight,
          weightedContribution: signedPoints * palaceWeight,
          thaiTueProminenceApplied: false,
          sourceId: rule.provenance?.sourceIds[0] ?? "SRC-AA-ENG-008",
        };
        matchedFacts.push(fact);
        if (polarity === "positive") positivePoints += Math.abs(pts);
        else negativePoints += Math.abs(pts);
        break;
      }
    }
  };

  tryMatch(positiveRules, "positive");
  tryMatch(negativeRules, "negative");

  matchedFacts.sort(
    (a, b) =>
      Math.abs(b.weightedContribution) - Math.abs(a.weightedContribution) ||
      Math.abs(b.points) - Math.abs(a.points) ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.starName.localeCompare(b.starName),
  );

  return { positivePoints, negativePoints, matchedFacts };
}

export function clampPalaceRaw(
  positivePoints: number,
  negativePoints: number,
  knowledge: AnnualAxesKnowledgeV08NamPhai,
): number {
  const raw = positivePoints - negativePoints;
  const { minimum, maximum } = knowledge.pointClasses.palaceRawClamp;
  return Math.min(maximum, Math.max(minimum, raw));
}
