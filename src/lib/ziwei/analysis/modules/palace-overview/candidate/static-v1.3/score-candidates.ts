import type { PalaceEvidence } from "../../types";
import {
  STATIC_V13_DEFAULT_CONFIG,
  splitEvidence,
  sumAxes,
  type CandidatePalaceScore,
  type StaticV13Config,
} from "./types";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function logisticScore(net: number, scale: number): number {
  return round1(100 / (1 + Math.exp(-net / scale)));
}

function softsign(x: number, scale: number): number {
  return (scale * x) / (scale + Math.abs(x));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function remoteShare(localNet: number, contextApplied: number): number | null {
  const denom = Math.abs(localNet) + Math.abs(contextApplied);
  if (denom <= 1e-9) return null;
  return Math.abs(contextApplied) / denom;
}

function scaleEvidence(evidence: PalaceEvidence[], factor: number): PalaceEvidence[] {
  return evidence.map((e) => ({
    ...e,
    axes: {
      support: e.axes.support * factor,
      pressure: e.axes.pressure * factor,
      stability: e.axes.stability * factor,
      activation: e.axes.activation * factor,
    },
  }));
}

/**
 * Class-C formation control: if a structural-rule cites ≥2 physical facts
 * already present as major-star components in this evaluation, scale it.
 * Independent interaction effects (few/no overlapping major facts) stay full.
 */
function applyFormationOverlapPolicy(
  allEvidence: PalaceEvidence[],
  scale: number,
): PalaceEvidence[] {
  const majorFacts = new Set(
    allEvidence
      .filter((e) => e.category === "major-star")
      .flatMap((e) => e.factIds),
  );
  return allEvidence.map((e) => {
    if (e.category !== "structural-rule") return e;
    const overlap = e.factIds.filter((id) => majorFacts.has(id)).length;
    if (overlap < 2) return e;
    return scaleEvidence([e], scale)[0]!;
  });
}

/**
 * CONTROL: production additive sum (caller uses original score).
 *
 * Candidates re-aggregate the SAME physical evidence without recursive
 * palace scores. Geometry weights already present on evidence axes.
 */
export function scoreStaticV13Candidates(
  allEvidence: PalaceEvidence[],
  config: StaticV13Config = STATIC_V13_DEFAULT_CONFIG,
): Record<CandidatePalaceScore["candidateId"], CandidatePalaceScore> {
  const adjusted = applyFormationOverlapPolicy(
    allEvidence,
    config.formationOverlapScale,
  );
  const { local, context } = splitEvidence(adjusted);
  const localAxes = sumAxes(local);
  const contextAxes = sumAxes(context);
  const localNet = localAxes.support - localAxes.pressure;
  const contextNet = contextAxes.support - contextAxes.pressure;

  // A — context-normalized: soft-bound remote net before adding to local.
  const contextAppliedNorm = clamp(
    softsign(contextNet, config.contextSoftScale),
    -config.contextNormalizedCap,
    config.contextNormalizedCap,
  );
  const combinedNorm = localNet + contextAppliedNorm;

  // B — context-diminishing: rank remote evidence by |net|, apply diminishing.
  const ranked = [...context].sort(
    (a, b) =>
      Math.abs(b.axes.support - b.axes.pressure) -
      Math.abs(a.axes.support - a.axes.pressure),
  );
  const diminished: PalaceEvidence[] = [];
  for (let i = 0; i < ranked.length; i++) {
    const factor =
      config.remoteDiminishing[Math.min(i, config.remoteDiminishing.length - 1)] ??
      0.05;
    diminished.push(...scaleEvidence([ranked[i]!], factor));
  }
  const diminishedAxes = sumAxes(diminished);
  const contextAppliedDim = diminishedAxes.support - diminishedAxes.pressure;
  const combinedDim = localNet + contextAppliedDim;

  // C — local-context blend: local primacy; context capped vs local magnitude.
  const relCap =
    config.localContextAbsCap *
    (0.35 +
      0.65 *
        (Math.abs(localNet) / (Math.abs(localNet) + config.contextSoftScale)));
  const absCap = Math.min(
    config.localContextAbsCap,
    Math.max(config.localContextRelCap * (Math.abs(localNet) + 1), 1.5),
    relCap,
  );
  const contextAppliedBlend = clamp(contextNet, -absCap, absCap);
  const combinedBlend =
    config.localBlendAlpha * localNet +
    (1 - config.localBlendAlpha) * (localNet + contextAppliedBlend);

  return {
    "context-normalized": {
      candidateId: "context-normalized",
      score: logisticScore(combinedNorm, config.logisticScale),
      localNet,
      contextNet,
      contextApplied: contextAppliedNorm,
      combinedNet: combinedNorm,
      remoteShare: remoteShare(localNet, contextAppliedNorm),
      formulaNotes: [
        "localNet + softsign(contextNet)",
        `cap=±${config.contextNormalizedCap}`,
        `formationOverlapScale=${config.formationOverlapScale}`,
        "no recursive palace scores",
      ],
    },
    "context-diminishing": {
      candidateId: "context-diminishing",
      score: logisticScore(combinedDim, config.logisticScale),
      localNet,
      contextNet,
      contextApplied: contextAppliedDim,
      combinedNet: combinedDim,
      remoteShare: remoteShare(localNet, contextAppliedDim),
      formulaNotes: [
        "localNet + diminishing(remote evidence by |net| rank)",
        `curve=${config.remoteDiminishing.join(",")}`,
        `formationOverlapScale=${config.formationOverlapScale}`,
      ],
    },
    "local-context": {
      candidateId: "local-context",
      score: logisticScore(combinedBlend, config.logisticScale),
      localNet,
      contextNet,
      contextApplied: contextAppliedBlend,
      combinedNet: combinedBlend,
      remoteShare: remoteShare(localNet, contextAppliedBlend),
      formulaNotes: [
        `alpha=${config.localBlendAlpha} local primacy`,
        `context clamp ±${absCap.toFixed(2)}`,
        `formationOverlapScale=${config.formationOverlapScale}`,
      ],
    },
  };
}
