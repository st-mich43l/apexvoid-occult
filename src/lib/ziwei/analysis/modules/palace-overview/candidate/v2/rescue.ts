import type { PalaceEvidence } from "../../types";
import type { RescueHit, V2RescueConfig } from "./types";

const BENEFIC_HOA = new Set(["Lộc", "Quyền", "Khoa"]);

function localFocusAxes(evidence: PalaceEvidence[]): {
  support: number;
  pressure: number;
} {
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

export function applyRescueContext(input: {
  evidence: PalaceEvidence[];
  rescue: V2RescueConfig;
  beneficMinorFamilyIds: string[];
  focusHasHam: boolean;
  isVcd: boolean;
  palaceName: string;
  palaceBranch: string;
}): { evidence: PalaceEvidence[]; hit: RescueHit } {
  const { rescue, evidence } = input;
  const none = (reason: string): RescueHit => ({
    fired: false,
    reason,
    strength: 0,
    need: 0,
    supportBoost: 0,
    pressureRelief: 0,
    stabilityBoost: 0,
  });
  if (!rescue.enabled) {
    return { evidence, hit: none("disabled") };
  }

  const local = localFocusAxes(evidence);
  const dominance = local.pressure - local.support;
  const eligible =
    input.focusHasHam ||
    dominance >= rescue.pressureDominanceTrigger ||
    (input.isVcd && local.support + local.pressure > 0);
  if (!eligible) {
    return { evidence, hit: none("not-eligible") };
  }

  const seen = new Set<string>();
  let transformN = 0;
  let minorN = 0;
  let formationN = 0;
  for (const ev of evidence) {
    const key = ev.factIds.slice().sort().join("|") || ev.id;
    if (seen.has(key)) continue;
    if (ev.category === "transformation") {
      const hoa = ev.label.match(/Hóa (Lộc|Quyền|Khoa)/)?.[1];
      if (hoa && BENEFIC_HOA.has(hoa)) {
        seen.add(key);
        transformN += 1;
      }
    } else if (
      ev.category === "minor-star-family" &&
      ev.familyId &&
      input.beneficMinorFamilyIds.includes(ev.familyId) &&
      ev.axes.support > 0
    ) {
      seen.add(key);
      minorN += 1;
    } else if (ev.category === "structural-rule" && ev.axes.support > 0) {
      seen.add(key);
      formationN += 1;
    }
  }

  const rawStrength =
    transformN * rescue.transformWeight +
    minorN * rescue.beneficMinorWeight +
    Math.min(1, formationN) * rescue.formationWeight;
  const strength = Math.min(rescue.strengthCap, rawStrength);
  if (strength <= 0) {
    return { evidence, hit: none("no-rescue-sources") };
  }

  let need = Math.max(0, Math.min(1, dominance / rescue.needScale));
  if (input.focusHasHam) need = Math.max(need, rescue.hamNeedFloor);
  if (local.support > local.pressure) need *= 0.25;

  const supportBoost = Math.min(rescue.maxSupportBoost, strength * rescue.maxSupportBoost * need);
  const pressureRelief = Math.min(
    rescue.maxPressureRelief,
    strength * rescue.maxPressureRelief * need,
  );
  const stabilityBoost = Math.min(
    rescue.maxStabilityBoost,
    strength * rescue.maxStabilityBoost * need,
  );

  if (supportBoost === 0 && pressureRelief === 0) {
    return { evidence, hit: none("need-too-low") };
  }

  const delta: PalaceEvidence = {
    id: `ev:rescue-context:${input.palaceName}`,
    category: "structural-rule",
    factIds: [],
    palaceRole: "focus",
    palaceName: input.palaceName,
    palaceBranch: input.palaceBranch,
    axes: {
      support: supportBoost,
      pressure: -pressureRelief,
      stability: stabilityBoost,
      activation: 0,
    },
    label: "rescue-context (experimental)",
    explanationKey: "candidate.rescue-context",
    sourceIds: ["src-candidate-interaction-v2"],
    knowledgeStatus: "experimental",
    sourceKind: "rule",
    contributionKind: "interaction-delta",
  };

  // Pressure must not go negative via this delta relative to local pressure.
  if (local.pressure + delta.axes.pressure < 0) {
    delta.axes.pressure = -local.pressure;
  }

  return {
    evidence: [...evidence, delta],
    hit: {
      fired: true,
      reason: `ham=${input.focusHasHam};dominance=${dominance.toFixed(2)};nHoa=${transformN};nMinor=${minorN};nForm=${formationN}`,
      strength,
      need,
      supportBoost: delta.axes.support,
      pressureRelief: -delta.axes.pressure,
      stabilityBoost: delta.axes.stability,
    },
  };
}
