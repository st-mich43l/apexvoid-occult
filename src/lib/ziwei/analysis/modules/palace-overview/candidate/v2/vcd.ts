import type { NatalZiweiFact, ZiweiSchool } from "../../../../facts";
import type { StaticFrame } from "../../../../frame";
import type { PalaceOverviewKnowledgeV1 } from "../../../../knowledge";
import type { PalaceEvidence } from "../../types";
import type { V2StrongProfile } from "./types";

function capAxis(value: number, cap: number): number {
  if (value > cap) return cap;
  if (value < -cap) return -cap;
  return value;
}

export function applyStrongVcdContext(input: {
  school: ZiweiSchool;
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  evidence: PalaceEvidence[];
  borrowedFactIds: Set<string>;
  isVoidMajor: boolean;
  profile: V2StrongProfile;
  pack: { beneficMinorFamilyIds: string[]; pressureMinorFamilyIds: string[] };
  enabled: boolean;
}): { evidence: PalaceEvidence[]; added: number } {
  if (!input.enabled || !input.isVoidMajor) {
    return { evidence: input.evidence, added: 0 };
  }
  const opposite = input.frame.nodes.find((n) => n.role === "opposite");
  const focus = input.frame.nodes.find((n) => n.role === "focus");
  if (!opposite || !focus) return { evidence: input.evidence, added: 0 };

  const seen = new Set(input.evidence.flatMap((e) => e.factIds));
  const borrowedNames = new Set(
    input.evidence
      .filter((e) => e.borrowedFromOpposite)
      .map((e) => e.starName)
      .filter((n): n is string => Boolean(n)),
  );
  const added: PalaceEvidence[] = [];
  const cap = input.profile.vcd.maxAxisMagnitude;
  const factor = input.profile.vcd.transformFactor * focus.geometryWeight;

  for (const fact of input.factsByPalace.get(opposite.palaceIndex) ?? []) {
    if (fact.kind !== "transformation" || !fact.targetStar || !fact.transformation) continue;
    if (!borrowedNames.has(fact.targetStar)) continue;
    if (seen.has(fact.id) || input.borrowedFactIds.has(fact.id)) continue;
    const record = input.knowledge.transformations.transformations.find(
      (t) => t.transformation === fact.transformation,
    );
    if (!record) continue;
    seen.add(fact.id);
    added.push({
      id: `ev:v2-vcd-transform:${focus.palaceIndex}:${fact.id}`,
      category: "transformation",
      factIds: [fact.id],
      palaceRole: "focus",
      palaceName: focus.palaceName,
      palaceBranch: focus.palaceBranch,
      axes: {
        support: capAxis(record.axes.support * factor, cap),
        pressure: capAxis(record.axes.pressure * factor, cap),
        stability: capAxis(record.axes.stability * factor, cap),
        activation: capAxis(record.axes.activation * factor, cap),
      },
      label: `Hóa ${fact.transformation}→${fact.targetStar} (VCD context)`,
      explanationKey: "vcd.borrowed-opposite-context",
      sourceIds: ["src-candidate-interaction-v2"],
      knowledgeStatus: "experimental",
      borrowedFromOpposite: true,
      starName: fact.targetStar,
      sourceKind: "borrowed-opposite-context",
      contributionKind: "context",
    });
  }

  const oppMinors = input.evidence
    .filter((e) => e.palaceRole === "opposite" && e.category === "minor-star-family")
    .filter((e) => e.factIds.some((id) => !seen.has(id)));

  const benefic = oppMinors
    .filter(
      (e) => e.familyId && input.pack.beneficMinorFamilyIds.includes(e.familyId) && e.axes.support > 0,
    )
    .sort((a, b) => b.axes.support - a.axes.support)
    .slice(0, input.profile.vcd.maxBeneficContributors);
  const pressure = oppMinors
    .filter(
      (e) => e.familyId && input.pack.pressureMinorFamilyIds.includes(e.familyId) && e.axes.pressure > 0,
    )
    .sort((a, b) => b.axes.pressure - a.axes.pressure)
    .slice(0, input.profile.vcd.maxPressureContributors);

  const mf = input.profile.vcd.minorFamilyFactor;
  for (const src of [...benefic, ...pressure]) {
    const ids = src.factIds.filter((id) => !seen.has(id));
    if (ids.length === 0) continue;
    ids.forEach((id) => seen.add(id));
    added.push({
      ...src,
      id: `ev:v2-vcd-minor:${focus.palaceIndex}:${src.id}`,
      palaceRole: "focus",
      palaceName: focus.palaceName,
      palaceBranch: focus.palaceBranch,
      axes: {
        support: capAxis(src.axes.support * mf, cap),
        pressure: capAxis(src.axes.pressure * mf, cap),
        stability: capAxis(src.axes.stability * mf, cap),
        activation: capAxis(src.axes.activation * mf, cap),
      },
      sourceKind: "borrowed-opposite-context",
      contributionKind: "context",
      borrowedFromOpposite: true,
    });
  }

  return { evidence: [...input.evidence, ...added], added: added.length };
}
