import packJson from "../../../../knowledge/palace-overview/candidates/four-axis-v1/profile.json";
import type { PalaceOverviewKnowledgeV1 } from "../../../../knowledge";
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
  knowledge: PalaceOverviewKnowledgeV1,
  stabilityWeight = loadFourAxisCandidatePack().stabilityWeight,
): number {
  const qn = knowledge.profile.qualityNormalization;
  const qualityRaw =
    raw.support - raw.pressure - qn.offset + stabilityWeight * raw.stability;
  return round1(100 / (1 + Math.exp(-qualityRaw / qn.scale)));
}
