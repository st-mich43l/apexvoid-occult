import type { AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { V10ResonanceConfig } from "../../../knowledge/annual-axes/v0.10";
import {
  buildLayerSignal,
  clampSignedNet,
  emptyLayerSignal,
} from "./layer-contract";
import type { AnnualLayerSignal } from "./types";

function sameDirection(
  a: number,
  b: number,
  threshold: number,
): "support" | "pressure" | null {
  if (a >= threshold && b >= threshold) return "support";
  if (a <= -threshold && b <= -threshold) return "pressure";
  return null;
}

/**
 * State-based cross-layer resonance. Operates on signed layer nets only.
 * Does not clone physical star facts.
 */
export function computeResonance(input: {
  domain: AnnualAxisDomain;
  natal: AnnualLayerSignal;
  decade: AnnualLayerSignal;
  annual: AnnualLayerSignal;
  config: V10ResonanceConfig;
}): AnnualLayerSignal {
  const { domain, natal, decade, annual, config } = input;

  if (
    natal.availability === "unavailable" ||
    annual.availability === "unavailable"
  ) {
    return emptyLayerSignal("resonance", domain, "unavailable", [
      "resonance-requires-natal-and-annual",
    ]);
  }

  const n = natal.signedNet;
  const d =
    decade.availability === "unavailable" ? 0 : decade.signedNet;
  const a = annual.signedNet;
  const thr = config.sameDirectionThreshold;

  let raw = 0;
  const reasons: string[] = [];

  const fa = sameDirection(n, a, thr);
  if (fa === "pressure") {
    raw -= config.foundationAnnualAlignment * Math.min(Math.abs(n), Math.abs(a));
    reasons.push("foundation-annual-pressure-alignment");
  } else if (fa === "support") {
    raw += config.foundationAnnualAlignment * Math.min(Math.abs(n), Math.abs(a));
    reasons.push("foundation-annual-support-alignment");
  }

  if (decade.availability !== "unavailable") {
    const da = sameDirection(d, a, thr);
    if (da === "pressure") {
      raw -= config.decadeAnnualAlignment * Math.min(Math.abs(d), Math.abs(a));
      reasons.push("decade-annual-pressure-alignment");
    } else if (da === "support") {
      raw += config.decadeAnnualAlignment * Math.min(Math.abs(d), Math.abs(a));
      reasons.push("decade-annual-support-alignment");
    }
  }

  if (
    n <= -thr &&
    (decade.availability === "unavailable" || d <= -thr) &&
    a <= -thr
  ) {
    const mag = Math.min(
      Math.abs(n),
      decade.availability === "unavailable" ? Math.abs(a) : Math.abs(d),
      Math.abs(a),
    );
    raw -= config.tripleAlignmentBonus * mag;
    reasons.push("triple-pressure");
  }

  if (
    n >= thr &&
    (decade.availability === "unavailable" || d >= thr) &&
    a >= thr
  ) {
    const mag = Math.min(
      Math.abs(n),
      decade.availability === "unavailable" ? Math.abs(a) : Math.abs(d),
      Math.abs(a),
    );
    raw += config.tripleAlignmentBonus * mag;
    reasons.push("triple-support");
  }

  // Temporary rescue: negative foundation + positive annual → partial relief
  if (n <= -thr && a >= thr) {
    const relief = config.oppositionRelief * Math.min(Math.abs(n), Math.abs(a));
    // Cap so annual cannot fully reverse deep foundation+decade adversity
    const deepAdverse =
      n <= -thr && decade.availability !== "unavailable" && d <= -thr;
    const capped = deepAdverse ? relief * 0.5 : relief;
    raw += capped;
    reasons.push(
      deepAdverse ? "temporary-rescue-capped" : "temporary-rescue",
    );
  }

  // Temporary setback: strong foundation + adverse annual
  if (n >= thr && a <= -thr) {
    raw -= config.temporarySetback * Math.min(Math.abs(n), Math.abs(a));
    reasons.push("temporary-setback");
  }

  const signedNet = clampSignedNet(
    Math.min(config.maxMagnitude, Math.max(-config.maxMagnitude, raw)),
  );

  return buildLayerSignal({
    layer: "resonance",
    domain,
    supportMass: Math.max(0, signedNet),
    pressureMass: Math.max(0, -signedNet),
    activation: Math.min(1, Math.abs(signedNet) / Math.max(config.maxMagnitude, 1e-9)),
    coverage: 1,
    availability: reasons.length ? "available" : "partial",
    contributors: [
      {
        id: `resonance:${domain}`,
        layer: "resonance",
        physicalFactIds: [],
        sourceIds: ["SRC-AA-V10-ENG-001"],
        direction:
          signedNet > 0 ? "support" : signedNet < 0 ? "pressure" : "neutral",
        magnitude: Math.abs(signedNet),
        sourceModule: "v010-resonance",
      },
    ],
    reasonCodes: reasons.length ? reasons : ["resonance-inactive"],
    signedNetOverride: signedNet,
  });
}
