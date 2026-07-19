import type { AnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import type {
  AnnualAxisEvidence,
  AnnualAxisRawAxes,
  AnnualChannelSummary,
  AnnualEvidenceChannel,
} from "../types";
import { emptyAnnualAxes } from "../types";

const CHANNEL_MAP: Record<
  AnnualEvidenceChannel,
  keyof {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  }
> = {
  global: "globalAnnualClimate",
  "routed-head": "routedHeadImpact",
  "direct-domain": "directDomainImpact",
  "major-background": "majorFortuneBackground",
};

function emptyChannel(): AnnualChannelSummary {
  return {
    supportRaw: 0,
    pressureRaw: 0,
    activationRaw: 0,
    supportNorm: 0,
    pressureNorm: 0,
    signed: 0,
    evidenceIds: [],
  };
}

function applyDiminishing(
  evidence: AnnualAxisEvidence[],
): AnnualAxisEvidence[] {
  const groups = new Map<string, AnnualAxisEvidence[]>();
  for (const e of evidence) {
    const key = `${e.domain}|${e.layer}|${e.stackingGroup}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const out: AnnualAxisEvidence[] = [];
  for (const list of groups.values()) {
    const ranked = [...list].sort((a, b) => {
      const ae = Math.abs(a.weightedAxes.support) + Math.abs(a.weightedAxes.pressure);
      const be = Math.abs(b.weightedAxes.support) + Math.abs(b.weightedAxes.pressure);
      return be - ae || a.id.localeCompare(b.id);
    });
    ranked.forEach((e, index) => {
      const factor = 1 / Math.sqrt(index + 1);
      out.push({
        ...e,
        weightedAxes: {
          support: e.weightedAxes.support * factor,
          pressure: e.weightedAxes.pressure * factor,
          stability: 0,
          activation: e.weightedAxes.activation * factor,
        },
      });
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function finalizeChannel(
  channel: AnnualChannelSummary,
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): AnnualChannelSummary {
  const supportNorm = 1 - Math.exp(-channel.supportRaw / knowledge.deltaProfile.supportScale);
  const pressureNorm = 1 - Math.exp(-channel.pressureRaw / knowledge.deltaProfile.pressureScale);
  return {
    ...channel,
    supportNorm,
    pressureNorm,
    signed: supportNorm - pressureNorm,
    evidenceIds: [...new Set(channel.evidenceIds)].sort(),
  };
}

export interface AggregatedChannelsV04 {
  evidence: AnnualAxisEvidence[];
  channels: {
    globalAnnualClimate: AnnualChannelSummary;
    routedHeadImpact: AnnualChannelSummary;
    directDomainImpact: AnnualChannelSummary;
    majorFortuneBackground: AnnualChannelSummary;
  };
  rawAxes: AnnualAxisRawAxes;
}

/**
 * Deduplicate is already one-fact-per-domain at collection time.
 * Here we apply diminishing returns, then split each evidence's weighted
 * axes across its activation channels proportional to path weights.
 */
export function aggregateNamPhaiV04Channels(
  candidates: AnnualAxisEvidence[],
  knowledge: AnnualAxesKnowledgeV04NamPhai,
): AggregatedChannelsV04 {
  const evidence = applyDiminishing(candidates);
  const channels = {
    globalAnnualClimate: emptyChannel(),
    routedHeadImpact: emptyChannel(),
    directDomainImpact: emptyChannel(),
    majorFortuneBackground: emptyChannel(),
  };

  const rawAxes = emptyAnnualAxes();

  for (const e of evidence) {
    const paths = e.activationPaths ?? [];
    const pathTotal = paths.reduce((s, p) => s + p.effectivePathWeight, 0);
    if (pathTotal <= 0) continue;

    for (const path of paths) {
      const share = path.effectivePathWeight / pathTotal;
      const key = CHANNEL_MAP[path.channel];
      const ch = channels[key];
      ch.supportRaw += e.weightedAxes.support * share;
      ch.pressureRaw += e.weightedAxes.pressure * share;
      ch.activationRaw += e.weightedAxes.activation * share;
      ch.evidenceIds.push(e.id);
    }

    rawAxes.support += e.weightedAxes.support;
    rawAxes.pressure += e.weightedAxes.pressure;
    rawAxes.activation += e.weightedAxes.activation;
  }

  return {
    evidence,
    channels: {
      globalAnnualClimate: finalizeChannel(channels.globalAnnualClimate, knowledge),
      routedHeadImpact: finalizeChannel(channels.routedHeadImpact, knowledge),
      directDomainImpact: finalizeChannel(channels.directDomainImpact, knowledge),
      majorFortuneBackground: finalizeChannel(channels.majorFortuneBackground, knowledge),
    },
    rawAxes,
  };
}
