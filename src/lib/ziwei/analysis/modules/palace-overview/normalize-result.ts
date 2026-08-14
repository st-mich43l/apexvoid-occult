import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type {
  PalaceEvidenceAxes,
  PalaceOverviewBand,
} from "./types";

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
): number {
  const qn = knowledge.profile.qualityNormalization;
  if (qn.method !== "logistic") {
    throw new Error(`unsupported qualityNormalization.method: ${qn.method}`);
  }
  if (qn.midpoint !== 50) {
    throw new Error(
      "logistic maps (support−pressure−offset)=0 to 50; midpoint must be 50",
    );
  }
  const qualityRaw = raw.support - raw.pressure - qn.offset;
  const mapped = logisticQuality(qualityRaw, qn.scale);
  if (qualityRaw === 0 && mapped !== qn.midpoint) {
    throw new Error(
      "logistic identity at (support−pressure−offset)=0 does not match midpoint",
    );
  }
  return round1(mapped);
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
