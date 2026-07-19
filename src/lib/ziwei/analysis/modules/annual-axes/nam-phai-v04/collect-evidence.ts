import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { canonicalStarName } from "../../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import mutagenImpactCatalog from "../../../knowledge/annual-axes/annual-mutagen-impact.v0.json";
import type { AnnualFocusFrame } from "../build-annual-focus-frame";
import type {
  AnnualAxisEvidence,
  AnnualAxisEvidenceLayer,
  AnnualAxisFrameRole,
  AnnualAxisRawAxes,
  AnnualAxesDiagnostics,
  AnnualEvidenceActivationPath,
  AnnualEvidenceChannel,
} from "../types";
import { resolveDomainAffinity } from "./affinity";
import {
  buildNamePalaceIndex,
  domainFrameCoverage,
  relationRole,
  type DomainRoutingV04,
} from "./routing";

const ARCH_SOURCE_ID = "SRC-AA-ENG-004";
const ANNUAL_STAR_SOURCES = new Set(["annual"]);
const MUTAGEN_MARKER_SOURCES = new Set(["natal-mutagen", "annual-mutagen"]);

const MUTAGEN_IMPACT = mutagenImpactCatalog as {
  records: Array<{
    mutagen: string;
    axes: AnnualAxisRawAxes;
    stackingGroup: string;
    ruleId: string;
  }>;
};

function isNatalPhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  return !ANNUAL_STAR_SOURCES.has(source) && !MUTAGEN_MARKER_SOURCES.has(source);
}

interface StarResolution {
  axes: AnnualAxisRawAxes;
  starClass: "major" | "minor";
  familyId?: string;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
}

function resolveStar(
  canonical: string,
  brightness: string | undefined,
  numeric: PalaceOverviewKnowledgeV1,
): StarResolution | null {
  const major = numeric.majorStars.stars.find((s) => s.name === canonical);
  if (major) {
    const status = numeric.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numeric.majorStars.brightnessModifiers[brightness] ??
        numeric.majorStars.brightnessModifiers.Bình;
      if (modifier) {
        axes = {
          support: axes.support * modifier.supportFactor,
          pressure: axes.pressure * modifier.pressureFactor,
          stability: axes.stability + modifier.stabilityDelta,
          activation: axes.activation * modifier.activationFactor,
        };
      }
    }
    return {
      axes,
      starClass: "major",
      sourceIds: numeric.majorStars.sourceIds,
      knowledgeStatus: status,
    };
  }

  const minor = numeric.minorStars.stars.find((s) => s.canonicalName === canonical);
  if (minor && minor.scoringMode === "direct") {
    const family = numeric.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return null;
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: AnnualAxisRawAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy = numeric.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
      if (policy) {
        axes = {
          support: axes.support * policy.supportFactor,
          pressure: axes.pressure * policy.pressureFactor,
          stability: axes.stability + policy.stabilityDelta,
          activation: axes.activation * policy.activationFactor,
        };
      }
    }
    return {
      axes,
      starClass: "minor",
      familyId: family.id,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
    };
  }

  return null;
}

function isTriggerEnabled(knowledge: AnnualAxesKnowledgeV04NamPhai, triggerId: string): boolean {
  return knowledge.triggerPolicy.enabledTriggers.some((t) => t.triggerId === triggerId && t.enabled);
}

function headFrameIndexes(headFrame: AnnualFocusFrame): Set<number> {
  return new Set(headFrame.nodes.map((n) => n.palaceIndex));
}

function domainLocalIndexes(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  domain: AnnualAxisDomain,
): Set<number> {
  return new Set(domainFrameCoverage(chart, knowledge, domain).physicalPalaceIndexes);
}

function localGeometryWeight(
  chart: ChartData,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
  domain: AnnualAxisDomain,
  targetPalaceIndex: number,
): { weight: number; bestAnchorName: string | null; bestRole: AnnualAxisFrameRole | "outside" } {
  const nameToIndex = buildNamePalaceIndex(chart);
  const domainDefinition = knowledge.axisDefinitions.domains.find((d) => d.domain === domain);
  if (!domainDefinition) return { weight: 0, bestAnchorName: null, bestRole: "outside" };

  // Local role weights mirror head-frame role weights from the channel profile
  // (V0.4 does not ship a separate local weight table).
  const roleWeights = knowledge.channelProfile.routing.headFrameRoleWeights;
  let best = 0;
  let bestName: string | null = null;
  let bestRole: AnnualAxisFrameRole | "outside" = "outside";
  for (const anchor of domainDefinition.anchors) {
    const anchorIndex = nameToIndex.get(anchor.palaceName);
    if (anchorIndex === undefined) continue;
    const role = relationRole(anchorIndex, targetPalaceIndex);
    const weight = anchor.weight * roleWeights[role];
    if (weight > best) {
      best = weight;
      bestName = anchor.palaceName;
      bestRole = role === "outside" ? "outside" : (role as AnnualAxisFrameRole);
    }
  }
  return { weight: best, bestAnchorName: bestName, bestRole };
}

function combinePathWeights(
  paths: AnnualEvidenceActivationPath[],
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): number {
  if (paths.length === 0) return 0;
  const sorted = [...paths].sort((a, b) => b.effectivePathWeight - a.effectivePathWeight);
  const maxCounted = knowledge.channelProfile.pathCombination.maxPathsCounted;
  const discount = knowledge.channelProfile.pathCombination.restDiscount;
  const limited = sorted.slice(0, maxCounted);
  let total = limited[0]?.effectivePathWeight ?? 0;
  for (let i = 1; i < limited.length; i += 1) {
    total += (limited[i]?.effectivePathWeight ?? 0) * discount;
  }
  return total;
}

interface CandidateFact {
  physicalFactId: string;
  category: AnnualAxisEvidence["category"];
  layer: AnnualAxisEvidenceLayer;
  ruleId: string;
  targetPalace: ChartPalace;
  rawAxes: AnnualAxisRawAxes;
  stackingGroup: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  origin: "natal-star" | "annual-star" | "annual-mutagen" | "major-mutagen" | "natal-mutagen";
  canonicalStarName?: string;
  familyId?: string;
  mutagen?: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
}

interface CollectInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  knowledge: AnnualAxesKnowledgeV04NamPhai;
  numericKnowledge: PalaceOverviewKnowledgeV1;
  headFrame: AnnualFocusFrame;
  routing: DomainRoutingV04;
  diagnostics: AnnualAxesDiagnostics;
}

/**
 * Collect V0.4 triggered annual evidence. Natal physical stars contribute
 * numeric support/pressure only when at least one enabled annual trigger
 * applies. Affinity is applied per domain; multiple activation paths are
 * combined via the versioned path-combination policy.
 */
export function collectNamPhaiV04TriggeredEvidence(input: CollectInput): AnnualAxisEvidence[] {
  const { chart, domain, knowledge, numericKnowledge, headFrame, routing, diagnostics } = input;

  const coverage = domainFrameCoverage(chart, knowledge, domain);
  if (coverage.uniquePhysicalPalaceCount >= 11) {
    diagnostics.domainFrameOvercoverage.push(
      `${domain}:palaces=${coverage.uniquePhysicalPalaceCount}`,
    );
  }

  const headIndexes = headFrameIndexes(headFrame);
  const localIndexes = domainLocalIndexes(chart, knowledge, domain);
  const annualStarPalaceIndexes = new Set(
    (chart.annualStars ?? []).map((s) => s.palace.index),
  );
  const annualMutagenTargets = new Set(
    (chart.annualMutagens ?? [])
      .filter((m) => m.palace)
      .map((m) => `${m.palace!.index}:${canonicalStarName(m.starName)}`),
  );

  const factsByKey = new Map<string, CandidateFact>();
  const pushFact = (fact: CandidateFact) => {
    if (factsByKey.has(fact.physicalFactId)) {
      diagnostics.duplicatePhysicalFacts.push(`${domain}:${fact.physicalFactId}`);
      return;
    }
    factsByKey.set(fact.physicalFactId, fact);
  };

  for (const palace of chart.palaces) {
    for (const star of palace.stars ?? []) {
      if (!isNatalPhysicalStar(star)) continue;
      const canonical = canonicalStarName(star.name);
      const res = resolveStar(canonical, star.brightness, numericKnowledge);
      if (!res) continue;
      const inMajor =
        chart.majorFortunePalace != null && chart.majorFortunePalace.index === palace.index;
      pushFact({
        physicalFactId: `natal-star:${palace.index}:${canonical}`,
        category: "star",
        layer: inMajor ? "major-fortune" : "natal-activated",
        ruleId:
          res.starClass === "major"
            ? "RULE-AA-STAR-MAJOR-CANONICAL-V0"
            : "RULE-AA-STAR-MINOR-CANONICAL-V0",
        targetPalace: palace,
        rawAxes: res.axes,
        stackingGroup: res.diminishingGroup ?? "major-star",
        sourceIds: res.sourceIds,
        knowledgeStatus: res.knowledgeStatus,
        origin: "natal-star",
        canonicalStarName: canonical,
        familyId: res.familyId,
      });
    }
  }

  for (const annualStar of chart.annualStars ?? []) {
    const canonical = canonicalStarName(annualStar.name);
    const res = resolveStar(canonical, annualStar.brightness, numericKnowledge);
    if (!res) continue;
    pushFact({
      physicalFactId: `annual-star:${annualStar.palace.index}:${canonical}`,
      category: "star",
      layer: "annual",
      ruleId: "RULE-AA-STAR-ANNUAL-MOVING-V04",
      targetPalace: annualStar.palace,
      rawAxes: res.axes,
      stackingGroup: res.diminishingGroup ?? "annual-moving-star",
      sourceIds: res.sourceIds,
      knowledgeStatus: res.knowledgeStatus,
      origin: "annual-star",
      canonicalStarName: canonical,
      familyId: res.familyId,
    });
  }

  const pushMutagens = (
    records: MutagenRecord[] | undefined,
    layer: AnnualAxisEvidenceLayer,
    origin: CandidateFact["origin"],
  ) => {
    if (!records) return;
    for (const record of records) {
      if (!record.palace) continue;
      const impact = MUTAGEN_IMPACT.records.find((r) => r.mutagen === record.mutagen);
      if (!impact) {
        diagnostics.unknownMutagens.push(record.mutagen);
        continue;
      }
      const mutagen = record.mutagen as "Lộc" | "Quyền" | "Khoa" | "Kỵ";
      const canonical = canonicalStarName(record.starName);
      pushFact({
        physicalFactId: `mutagen:${record.palace.index}:${record.mutagen}:${canonical}`,
        category: "mutagen",
        layer,
        ruleId: impact.ruleId,
        targetPalace: record.palace,
        rawAxes: { ...impact.axes },
        stackingGroup: impact.stackingGroup,
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
        origin,
        canonicalStarName: canonical,
        mutagen,
      });
    }
  };

  pushMutagens(chart.annualMutagens, "annual", "annual-mutagen");
  pushMutagens(chart.natalMutagens, "natal-activated", "natal-mutagen");
  pushMutagens(chart.majorMutagens, "major-fortune", "major-mutagen");

  const out: AnnualAxisEvidence[] = [];

  for (const fact of factsByKey.values()) {
    const triggerIds: string[] = [];
    const idx = fact.targetPalace.index;
    const inHead = headIndexes.has(idx);
    const inLocal = localIndexes.has(idx);
    const inMajor =
      chart.majorFortunePalace != null && chart.majorFortunePalace.index === idx;

    if (fact.origin === "natal-star" || fact.origin === "natal-mutagen") {
      if (isTriggerEnabled(knowledge, "annual-head-tp4c") && inHead) {
        triggerIds.push("annual-head-tp4c");
      }
      if (
        isTriggerEnabled(knowledge, "annual-transformation-exact-target") &&
        fact.canonicalStarName &&
        annualMutagenTargets.has(`${idx}:${fact.canonicalStarName}`)
      ) {
        triggerIds.push("annual-transformation-exact-target");
      }
      if (
        isTriggerEnabled(knowledge, "annual-moving-star-palace") &&
        annualStarPalaceIndexes.has(idx)
      ) {
        triggerIds.push("annual-moving-star-palace");
      }
      if (
        isTriggerEnabled(knowledge, "head-domain-frame-intersection") &&
        inHead &&
        inLocal
      ) {
        triggerIds.push("head-domain-frame-intersection");
      }

      if (triggerIds.length === 0) {
        // Natal without trigger: sensitivity-only — skip numeric evidence.
        continue;
      }
    } else if (fact.origin === "annual-star") {
      if (isTriggerEnabled(knowledge, "annual-moving-star-palace")) {
        triggerIds.push("annual-moving-star-palace");
      }
    } else if (fact.origin === "annual-mutagen") {
      if (isTriggerEnabled(knowledge, "annual-transformation-exact-target")) {
        triggerIds.push("annual-transformation-exact-target");
      }
    } else if (fact.origin === "major-mutagen") {
      // Major-fortune mutagen is always major-background when present.
      triggerIds.push("major-fortune-context");
    }

    if (triggerIds.length === 0) continue;

    const affinity =
      fact.category === "mutagen" && fact.mutagen
        ? resolveDomainAffinity(knowledge, domain, {
            kind: "transformation",
            transformation: fact.mutagen,
          })
        : resolveDomainAffinity(knowledge, domain, {
            kind: "star",
            canonicalStarName: fact.canonicalStarName ?? "",
            familyId: fact.familyId,
          });

    if (affinity == null || affinity <= 0) continue;

    const headRole = relationRole(headFrame.focusPalaceIndex, idx);
    const headGeometry =
      knowledge.channelProfile.routing.headFrameRoleWeights[headRole];
    const local = localGeometryWeight(chart, knowledge, domain, idx);

    const pathCandidates: Array<{
      triggerId: string;
      channel: AnnualEvidenceChannel;
      geometryWeight: number;
    }> = [];

    for (const triggerId of triggerIds) {
      if (triggerId === "annual-head-tp4c" || triggerId === "head-domain-frame-intersection") {
        if (headGeometry > 0) {
          pathCandidates.push({
            triggerId,
            channel: "routed-head",
            geometryWeight: headGeometry,
          });
        }
      }
      if (
        triggerId === "annual-transformation-exact-target" ||
        triggerId === "annual-moving-star-palace" ||
        triggerId === "head-domain-frame-intersection"
      ) {
        if (local.weight > 0 || fact.origin === "annual-star" || fact.origin === "annual-mutagen") {
          pathCandidates.push({
            triggerId,
            channel: "direct-domain",
            geometryWeight: Math.max(local.weight, fact.origin.startsWith("annual") ? 1 : 0),
          });
        }
      }
      if (triggerId === "major-fortune-context" || (inMajor && fact.layer === "major-fortune")) {
        pathCandidates.push({
          triggerId: triggerId === "major-fortune-context" ? triggerId : "major-fortune-context",
          channel: "major-background",
          geometryWeight: 0.55,
        });
      }
    }

    // Deduplicate paths by channel — keep strongest geometry per channel.
    const byChannel = new Map<AnnualEvidenceChannel, (typeof pathCandidates)[number]>();
    for (const path of pathCandidates) {
      const existing = byChannel.get(path.channel);
      if (!existing || path.geometryWeight > existing.geometryWeight) {
        byChannel.set(path.channel, path);
      }
    }

    const activationPaths: AnnualEvidenceActivationPath[] = [...byChannel.values()].map((p) => ({
      triggerId: p.triggerId,
      channel: p.channel,
      geometryWeight: p.geometryWeight,
      affinityWeight: affinity,
      effectivePathWeight: p.geometryWeight * affinity,
    }));

    if (activationPaths.length === 0) continue;

    if (
      (fact.origin === "natal-star" || fact.origin === "natal-mutagen") &&
      triggerIds.length === 0
    ) {
      diagnostics.natalEvidenceMissingTriggers.push(`${domain}:${fact.physicalFactId}`);
      continue;
    }

    const confidence = knowledge.deltaProfile.confidenceWeights[fact.knowledgeStatus];
    const combinedPathWeight = combinePathWeights(activationPaths, knowledge);
    const effectiveWeight = combinedPathWeight * confidence;

    // Stability never feeds signed quality in V0.4 — zero it in weighted axes
    // while retaining activation for the gate.
    const weightedAxes: AnnualAxisRawAxes = {
      support: fact.rawAxes.support * effectiveWeight,
      pressure: fact.rawAxes.pressure * effectiveWeight,
      stability: 0,
      activation: fact.rawAxes.activation * effectiveWeight,
    };

    const frameRole: AnnualAxisFrameRole =
      local.bestRole !== "outside"
        ? (local.bestRole as AnnualAxisFrameRole)
        : headRole === "outside"
          ? "focus"
          : (headRole as AnnualAxisFrameRole);

    out.push({
      id: `ann-axis:${domain}:${fact.layer}:${fact.category}:${fact.physicalFactId}`,
      domain,
      layer: fact.layer,
      category: fact.category,
      physicalFactId: fact.physicalFactId,
      ruleId: fact.ruleId,
      targetPalaceIndex: fact.targetPalace.index,
      targetPalaceName: fact.targetPalace.name,
      targetAnnualPalaceName: fact.targetPalace.annualPalaceName ?? null,
      frameRole,
      anchorPalaceName: local.bestAnchorName ?? "annual-head",
      stackingGroup: fact.stackingGroup,
      rawAxes: fact.rawAxes,
      effectiveWeight,
      weightedAxes,
      factIds: [fact.physicalFactId],
      sourceIds: fact.sourceIds.length > 0 ? fact.sourceIds : [ARCH_SOURCE_ID],
      knowledgeStatus: fact.knowledgeStatus,
      routing: routing.routing,
      headShare: routing.headShare,
      localShare: routing.localShare,
      annualTriggerIds: [...new Set(triggerIds)],
      affinityWeight: affinity,
      activationPaths,
    });
  }

  return out;
}
