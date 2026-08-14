import type { PalaceEvidence } from "../types";
import type { BrightnessSaturationHit, InteractionCandidateProfile } from "./types";

export function saturateSigned(value: number, cap: number): number {
  if (cap <= 0) return value;
  return cap * Math.tanh(value / cap);
}

/** Bound major-star support/pressure; preserve sign; leave other categories alone. */
export function applyBrightnessDominance(
  evidence: PalaceEvidence[],
  profile: InteractionCandidateProfile,
): { evidence: PalaceEvidence[]; hits: BrightnessSaturationHit[] } {
  const cfg = profile.brightnessDominance;
  if (!cfg.enabled) return { evidence, hits: [] };
  const hits: BrightnessSaturationHit[] = [];
  const next = evidence.map((ev) => {
    if (ev.category !== "major-star") return ev;
    const original = { support: ev.axes.support, pressure: ev.axes.pressure };
    const support = saturateSigned(ev.axes.support, cfg.supportCap);
    const pressure = saturateSigned(ev.axes.pressure, cfg.pressureCap);
    const applied =
      support !== original.support || pressure !== original.pressure;
    if (applied) {
      hits.push({
        brightnessSaturationApplied: true,
        originalContribution: original,
        boundedContribution: { support, pressure },
        star: ev.starName ?? ev.label,
        palace: ev.palaceName,
        axis:
          support !== original.support && pressure !== original.pressure
            ? "both"
            : support !== original.support
              ? "support"
              : "pressure",
      });
    }
    return { ...ev, axes: { ...ev.axes, support, pressure } };
  });
  return { evidence: next, hits };
}
