import packJson from "../../../../knowledge/palace-overview/candidates/four-axis-v1/profile.json";
import type { PalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2/schema";
import type { PalaceEvidenceAxes } from "../../types";

export interface FourAxisCandidatePack {
  id: string;
  status: string;
  enabledByDefault: boolean;
  stabilityWeight: number;
}

export function loadFourAxisCandidatePack(): FourAxisCandidatePack {
  return packJson as FourAxisCandidatePack;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Research-only. Production computeRadarScore does not call this. */
export function computeFourAxisCandidateScore(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewResearchKnowledgeV2,
  stabilityWeight = loadFourAxisCandidatePack().stabilityWeight,
): number {
  const qn = knowledge.profile.qualityNormalization;
  const cat =
    Math.max(0, raw.support) + stabilityWeight * Math.max(0, raw.stability);
  const hung =
    Math.max(0, raw.pressure) + stabilityWeight * Math.max(0, -raw.stability);
  if (cat + hung === 0) return round1(qn.midpoint);
  const ceiling = qn.ceiling ?? 100;
  return round1(ceiling * (cat / (cat + hung)));
}
