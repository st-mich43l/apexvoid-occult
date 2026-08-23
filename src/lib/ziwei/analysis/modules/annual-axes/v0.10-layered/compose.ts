import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";
import type { V10LayerWeights } from "../../../knowledge/annual-axes/v0.10";
import { clampSignedNet } from "./layer-contract";
import type { AnnualLayerSignal } from "./types";

export function composeLayerNets(input: {
  natal: AnnualLayerSignal;
  decade: AnnualLayerSignal;
  annual: AnnualLayerSignal;
  resonance: AnnualLayerSignal;
  weights: V10LayerWeights;
  ablation?: {
    disableNatal?: boolean;
    disableDecade?: boolean;
    disableResonance?: boolean;
  };
}): { compositeNet: number; effectiveWeights: V10LayerWeights } {
  const ablation = input.ablation ?? {};
  let wN = ablation.disableNatal ? 0 : input.weights.natalFoundation;
  let wD = ablation.disableDecade ? 0 : input.weights.majorFortune;
  let wA = input.weights.annualTrigger;
  let wR = ablation.disableResonance ? 0 : input.weights.resonance;

  // Drop weight for unavailable optional decade rather than fabricating 0 as signal.
  if (input.decade.availability === "unavailable") {
    wD = 0;
  }
  if (input.resonance.availability === "unavailable") {
    wR = 0;
  }

  const sum = wN + wD + wA + wR;
  if (sum <= 0) {
    return {
      compositeNet: 0,
      effectiveWeights: {
        natalFoundation: 0,
        majorFortune: 0,
        annualTrigger: 0,
        resonance: 0,
      },
    };
  }

  const effectiveWeights: V10LayerWeights = {
    natalFoundation: wN / sum,
    majorFortune: wD / sum,
    annualTrigger: wA / sum,
    resonance: wR / sum,
  };

  const natalNet = input.natal.availability === "unavailable" ? 0 : input.natal.signedNet;
  const decadeNet = input.decade.availability === "unavailable" ? 0 : input.decade.signedNet;
  const annualNet = input.annual.availability === "unavailable" ? 0 : input.annual.signedNet;
  const resonanceNet =
    input.resonance.availability === "unavailable" ? 0 : input.resonance.signedNet;

  const compositeNet = clampSignedNet(
    effectiveWeights.natalFoundation * natalNet +
      effectiveWeights.majorFortune * decadeNet +
      effectiveWeights.annualTrigger * annualNet +
      effectiveWeights.resonance * resonanceNet,
  );

  return { compositeNet, effectiveWeights };
}

/** Map compositeNet into V0.8 raw space using configured axis clamp. */
export function compositeNetToRaw(
  compositeNet: number,
  knowledge08: AnnualAxesKnowledgeV08NamPhai,
): number {
  const max = knowledge08.pointClasses.axisRawClamp.maximum;
  const min = knowledge08.pointClasses.axisRawClamp.minimum;
  const raw = compositeNet * max;
  return Math.min(max, Math.max(min, raw));
}
