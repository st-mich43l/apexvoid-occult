import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  PalaceEvidence,
  PalaceEvidenceAxes,
  PalaceOverviewBand,
} from "./types";
import { computeStructureParts } from "./structure-quality";

export { xungChieuNet } from "./structure-quality";

function saturating(raw: number, scale: number): number {
  return 100 * (1 - Math.exp(-Math.max(raw, 0) / scale));
}

function logisticStability(raw: number, scale: number): number {
  return 100 / (1 + Math.exp(-raw / scale));
}

/**
 * Logistic net-quality map. When qualityRaw = 0 the value is exactly 50,
 * which is why profile.qualityNormalization.midpoint must be 50.
 * qualityRaw is (support − pressure − offset).
 */
function logisticQuality(raw: number, scale: number): number {
  return 100 / (1 + Math.exp(-raw / scale));
}

export function normalizeAxes(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceEvidenceAxes {
  const scales = knowledge.profile.axisNormalization;
  return {
    support: round1(saturating(raw.support, scales.supportScale)),
    pressure: round1(saturating(raw.pressure, scales.pressureScale)),
    activation: round1(saturating(raw.activation, scales.activationScale)),
    stability: round1(logisticStability(raw.stability, scales.stabilityScale)),
  };
}

export function computeRadarScore(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
  scaleOverride?: number,
): number {
  const qn = knowledge.profile.qualityNormalization;
  const ceiling = qn.ceiling ?? 100;
  const floor = qn.floor ?? 0;
  const scale = scaleOverride ?? qn.scale;
  if (qn.method === "linear-net") {
    return round1(linearNet(raw.support, raw.pressure, scale, qn.midpoint, ceiling, floor));
  }
  if (qn.method === "cat-share") {
    return round1(catShare(raw.support, raw.pressure, qn.midpoint, ceiling, floor));
  }
  if (qn.method !== "logistic") {
    throw new Error(`unsupported qualityNormalization.method: ${qn.method}`);
  }
  const qualityRaw = raw.support - raw.pressure - qn.offset;
  return round1(logisticQuality(qualityRaw, qn.scale));
}

function catShare(
  support: number,
  pressure: number,
  midpoint: number,
  ceiling: number,
  floor: number,
): number {
  const cat = Math.max(0, support);
  const hung = Math.max(0, pressure);
  if (cat + hung === 0) return midpoint;
  return Math.max(floor, Math.min(ceiling, ceiling * (cat / (cat + hung))));
}

/**
 * Affine map in Miếu-tọa units. scale is the denom for this palace
 * (one Miếu, or n chính tọa × Miếu). Equal cát/hung is 50.
 */
function linearNet(
  support: number,
  pressure: number,
  scale: number,
  midpoint: number,
  ceiling: number,
  floor: number,
): number {
  const cat = Math.max(0, support);
  const hung = Math.max(0, pressure);
  const net = cat - hung;
  const t = Math.max(-1, Math.min(1, net / scale));
  const half = (ceiling - floor) / 2;
  return Math.max(floor, Math.min(ceiling, midpoint + half * t));
}

/**
 * Nam Phái net in Miếu-tọa units (thể + dụng). Not a 0–100 score.
 */
export function computePalaceNet(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const { body, yong } = computeStructureParts(evidence, knowledge);
  return body + yong;
}

/**
 * Isolated palace map. tanh: ℝ → (0, 100), 50 at net 0.
 * tanhScale = Miếu × √2 (formula.display). Palaces are independent — not z-scored.
 */
export function computePalaceScore(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const net = computePalaceNet(evidence, knowledge);
  const scale = knowledge.formula.display.tanhScale;
  return tanhScore(net / scale);
}

function tanhScore(t: number): number {
  return round1(50 + 50 * Math.tanh(t));
}

export function computeIntensity(
  raw: PalaceEvidenceAxes,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const intensityRaw =
    raw.support + raw.pressure + Math.max(raw.activation, 0);
  const scale = knowledge.profile.intensityNormalization.scale;
  return round1(saturating(intensityRaw, scale));
}

export function bandForScore(
  score: number,
  knowledge: PalaceOverviewKnowledgeV1,
): PalaceOverviewBand {
  const t = knowledge.profile.bandThresholds;
  if (score <= t.lowMaxInclusive) return "low";
  if (score < t.guardedMaxExclusive) return "guarded";
  if (score < t.balancedMaxExclusive) return "balanced";
  if (score < t.supportiveMaxExclusive) return "supportive";
  return "strong";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp01to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export interface CompletenessInput {
  missingBrightnessCount: number;
  unmappedTransformationCount: number;
  unknownStarCount: number;
  frameNodeCount: number;
  duplicateFactCount: number;
}

export function computeEvidenceCompleteness(input: CompletenessInput): number {
  let score = 100;
  score -= 10 * input.missingBrightnessCount;
  score -= 10 * input.unmappedTransformationCount;
  score -= Math.min(20, 2 * input.unknownStarCount);
  if (input.frameNodeCount < 4) score -= 20;
  if (input.duplicateFactCount > 0) score -= 5;
  return clamp01to100(score);
}
