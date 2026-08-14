import type { NatalZiweiFact } from "../../../../facts";
import type { StaticFrame } from "../../../../frame";
import type { PalaceEvidence } from "../../types";
import type { V2StrongProfile } from "./types";

function clampMag(value: number, cap: number): number {
  if (value > cap) return cap;
  if (value < -cap) return -cap;
  return value;
}

export function scaleAndBoundFormations(
  rules: PalaceEvidence[],
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
  profile: V2StrongProfile,
  amplify: boolean,
): PalaceEvidence[] {
  const scale = amplify ? profile.formation.interactionScale : 1;
  const voidCount = frame.nodes.reduce(
    (n, node) =>
      n +
      (factsByPalace.get(node.palaceIndex) ?? []).filter((f) => f.kind === "void-marker")
        .length,
    0,
  );
  return rules.map((ev) => {
    let support = clampMag(
      ev.axes.support * scale,
      profile.formation.maxSupportContribution,
    );
    let pressure = clampMag(
      ev.axes.pressure * scale,
      profile.formation.maxPressureContribution,
    );
    const stability = clampMag(
      ev.axes.stability * scale,
      profile.formation.maxStabilityMagnitude,
    );
    const activation = clampMag(
      ev.axes.activation * scale,
      profile.formation.maxActivationMagnitude,
    );
    if (voidCount > 0) {
      if (pressure > 0) {
        pressure = Math.max(0, pressure - profile.formation.voidOnPressureFormationExtraRelief);
      }
      if (support > 0) {
        support *= profile.formation.voidOnPositiveFormationSupportAttenuation;
      }
    }
    return {
      ...ev,
      axes: { support, pressure, stability, activation },
    };
  });
}
