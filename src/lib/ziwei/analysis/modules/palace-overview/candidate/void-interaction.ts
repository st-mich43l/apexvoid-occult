import type { NatalZiweiFact } from "../../../facts";
import type { StaticFrame } from "../../../frame";
import { emptyAxes, type PalaceEvidence } from "../types";
import type {
  CandidateVoidBandPolicy,
  InteractionCandidateProfile,
  VoidInteractionHit,
} from "./types";

function voidCount(facts: NatalZiweiFact[]): number {
  return facts.filter((f) => f.kind === "void-marker").length;
}

function sumFocus(evidence: PalaceEvidence[]): { support: number; pressure: number } {
  return evidence
    .filter((e) => e.palaceRole === "focus" && e.category !== "void-environment")
    .reduce(
      (acc, e) => ({
        support: acc.support + e.axes.support,
        pressure: acc.pressure + e.axes.pressure,
      }),
      { support: 0, pressure: 0 },
    );
}

function scaleFocusPressure(evidence: PalaceEvidence[], factor: number): PalaceEvidence[] {
  return evidence.map((ev) => {
    if (ev.palaceRole !== "focus" || ev.category === "void-environment") return ev;
    return { ...ev, axes: { ...ev.axes, pressure: ev.axes.pressure * factor } };
  });
}

export function applyCandidateVoidInteraction(
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
  evidence: PalaceEvidence[],
  profile: InteractionCandidateProfile,
): { evidence: PalaceEvidence[]; hit: VoidInteractionHit } {
  const none = (): VoidInteractionHit => ({
    voidInteractionMode: "none",
    supportBefore: 0,
    supportAfter: 0,
    pressureBefore: 0,
    pressureAfter: 0,
    reliefApplied: false,
    reliefReason: "no-void",
  });
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!focus) return { evidence, hit: none() };

  const nVoid = voidCount(factsByPalace.get(focus.palaceIndex) ?? []);
  if (nVoid === 0) return { evidence, hit: none() };

  const band: CandidateVoidBandPolicy =
    nVoid >= 2
      ? profile.voidInteraction.doubleVoid
      : profile.voidInteraction.singleVoid;

  const before = sumFocus(evidence);
  const dominance = before.pressure - before.support;
  const reliefOk =
    band.pressureRelief.enabled &&
    dominance >= band.pressureRelief.trigger.minLocalPressureDominance;

  let next = evidence.map((ev) => {
    const onFocus = ev.palaceRole === "focus";
    if (!onFocus || ev.category === "void-environment") return ev;
    if (
      ev.category !== "major-star" &&
      ev.category !== "transformation" &&
      ev.category !== "minor-star-family" &&
      ev.category !== "chang-sheng"
    ) {
      return ev;
    }
    return {
      ...ev,
      axes: {
        ...ev.axes,
        support: ev.axes.support * band.supportAttenuation,
        pressure: ev.axes.pressure * band.pressureAttenuation,
        activation: ev.axes.activation * band.activationFactor,
      },
    };
  });

  if (reliefOk) {
    const afterBase = sumFocus(next).pressure;
    const desired = afterBase * band.pressureRelief.extraPressureAttenuation;
    const uncappedCut = afterBase - desired;
    const cut = Math.min(uncappedCut, band.pressureRelief.maxRelief);
    if (afterBase > 0 && cut > 0) {
      next = scaleFocusPressure(next, (afterBase - cut) / afterBase);
    }
  }

  next = [
    ...next,
    {
      id: `ev:void-candidate:${focus.palaceIndex}`,
      category: "void-environment",
      factIds: (factsByPalace.get(focus.palaceIndex) ?? [])
        .filter((f) => f.kind === "void-marker")
        .map((f) => f.id),
      palaceRole: "focus",
      palaceName: focus.palaceName,
      palaceBranch: focus.palaceBranch,
      axes: { ...emptyAxes(), stability: band.stabilityDelta },
      label: nVoid >= 2 ? "Tuần+Triệt" : "Tuần/Triệt",
      explanationKey: "void.candidate-interaction",
      sourceIds: ["src-candidate-interaction-v1"],
      knowledgeStatus: "experimental",
      sourceKind: "context",
    },
  ];

  const after = sumFocus(next);
  return {
    evidence: next,
    hit: {
      voidInteractionMode: nVoid >= 2 ? "double" : "single",
      supportBefore: before.support,
      supportAfter: after.support,
      pressureBefore: before.pressure,
      pressureAfter: after.pressure,
      reliefApplied: reliefOk,
      reliefReason: reliefOk
        ? `localPressureDominance=${dominance.toFixed(3)}`
        : `dominance-below-trigger:${dominance.toFixed(3)}`,
    },
  };
}
