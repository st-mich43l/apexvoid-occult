import type { ChartData, ChartPalace, ChartStar } from "@/types/chart";
import { canonicalStarName, isVoidStarName } from "../../facts";
import type { PalaceOverviewKnowledgeV1 } from "../../knowledge";
import type { MajorFortuneFrame, MajorFrameNode } from "./collect-major-frames";
import type { MajorFortuneAxes, MajorFortuneDiagnostics, MajorFortuneEvidence } from "./types";

// "annual" is forbidden by Annual Independence — Major Fortune must never
// read Lưu-prefixed flowing stars. The "*-mutagen" sources are Tứ Hóa
// marker overlays, not real physical star placements.
const NON_PHYSICAL_SOURCES = new Set(["annual", "natal-mutagen", "annual-mutagen", "major-mutagen"]);

function isEligiblePhysicalStar(star: ChartStar): boolean {
  const source = star.source ?? "natal";
  // Tuần/Triệt are annotation-only in V0 (zero numeric delta) — excluded
  // here rather than surfaced as an "unknown star" diagnostic.
  if (isVoidStarName(star.name)) return false;
  return !NON_PHYSICAL_SOURCES.has(source);
}

interface StarKnowledgeMatch {
  axes: MajorFortuneAxes;
  diminishingGroup?: string;
  sourceIds: string[];
  knowledgeStatus: "experimental" | "approved";
  starClass: "major" | "minor";
}

type StarKnowledgeResult =
  | ({ kind: "scored" } & StarKnowledgeMatch)
  /** Found in the catalog but deliberately non-scored (e.g. `scoringMode:
   * "context-only"` like Đẩu Quân/Phàn An/Tức Thần) — not an unknown star,
   * just intentionally excluded from numeric evidence. */
  | { kind: "not-scored" }
  | { kind: "unknown" };

function resolveStarKnowledge(
  canonicalName: string,
  brightness: string | undefined,
  numericKnowledge: PalaceOverviewKnowledgeV1,
): StarKnowledgeResult {
  const major = numericKnowledge.majorStars.stars.find((s) => s.name === canonicalName);
  if (major) {
    const status = numericKnowledge.majorStars.status === "approved" ? "approved" : "experimental";
    let axes: MajorFortuneAxes = { ...major.axes };
    if (brightness) {
      const modifier =
        numericKnowledge.majorStars.brightnessModifiers[brightness] ??
        numericKnowledge.majorStars.brightnessModifiers.Bình;
      if (modifier) {
        axes = {
          support: axes.support * modifier.supportFactor,
          pressure: axes.pressure * modifier.pressureFactor,
          stability: axes.stability + modifier.stabilityDelta,
          activation: axes.activation * modifier.activationFactor,
        };
      }
    }
    return {
      kind: "scored",
      axes,
      sourceIds: numericKnowledge.majorStars.sourceIds,
      knowledgeStatus: status,
      starClass: "major",
    };
  }

  const minor = numericKnowledge.minorStars.stars.find((s) => s.canonicalName === canonicalName);
  if (minor && minor.scoringMode !== "direct") {
    return { kind: "not-scored" };
  }
  if (minor && minor.scoringMode === "direct") {
    const family = numericKnowledge.minorFamilies.families.find((f) => f.id === minor.familyId);
    if (!family) return { kind: "unknown" };
    const status = minor.status === "approved" ? "approved" : "experimental";
    let axes: MajorFortuneAxes = { ...(minor.axesOverride ?? family.axes) };
    if (minor.brightnessPolicy !== "none" && brightness) {
      const policy = numericKnowledge.minorStateModifiers.policies[minor.brightnessPolicy]?.[brightness];
      if (policy) {
        axes = {
          support: axes.support * policy.supportFactor,
          pressure: axes.pressure * policy.pressureFactor,
          stability: axes.stability + policy.stabilityDelta,
          activation: axes.activation * policy.activationFactor,
        };
      }
    }
    return {
      kind: "scored",
      axes,
      diminishingGroup: family.diminishingGroup,
      sourceIds: minor.sourceIds,
      knowledgeStatus: status,
      starClass: "minor",
    };
  }

  return { kind: "unknown" };
}

function physicalStarsAt(chart: ChartData, palaceIndex: number): { palace: ChartPalace; stars: ChartStar[] } | null {
  const palace = chart.palaces.find((p) => p.index === palaceIndex);
  if (!palace) return null;
  return { palace, stars: (palace.stars ?? []).filter(isEligiblePhysicalStar) };
}

function majorStarsOf(stars: ChartStar[], numericKnowledge: PalaceOverviewKnowledgeV1): ChartStar[] {
  return stars.filter((s) => {
    const canonical = canonicalStarName(s.name);
    return numericKnowledge.majorStars.stars.some((m) => m.name === canonical);
  });
}

interface CollectStarEvidenceInput {
  chart: ChartData;
  frame: MajorFortuneFrame;
  numericKnowledge: PalaceOverviewKnowledgeV1;
  diagnostics: MajorFortuneDiagnostics;
}

function pushStarEvidence(
  out: MajorFortuneEvidence[],
  params: {
    star: ChartStar;
    physicalPalaceIndex: number;
    targetNode: MajorFrameNode;
    frame: MajorFortuneFrame;
    borrowFactor?: number;
    ruleIdSuffix?: string;
    numericKnowledge: PalaceOverviewKnowledgeV1;
    diagnostics: MajorFortuneDiagnostics;
  },
) {
  const { star, physicalPalaceIndex, targetNode, frame, borrowFactor, numericKnowledge, diagnostics } = params;
  const canonical = canonicalStarName(star.name);
  const result = resolveStarKnowledge(canonical, star.brightness, numericKnowledge);
  if (result.kind === "not-scored") return;
  if (result.kind === "unknown") {
    diagnostics.unknownStars.push(canonical);
    return;
  }
  const match = result;

  const axes = borrowFactor !== undefined ? scaleAxes(match.axes, borrowFactor) : match.axes;
  const physicalFactId = `star:${physicalPalaceIndex}:${canonical}`;
  const ruleId =
    borrowFactor !== undefined
      ? "RULE-MFS-STAR-MAJOR-BORROWED-V0"
      : match.starClass === "major"
        ? "RULE-MFS-STAR-MAJOR-CANONICAL-V0"
        : "RULE-MFS-STAR-MINOR-CANONICAL-V0";
  const stackingGroup = match.diminishingGroup ?? "major-star";

  out.push({
    id: `mfs:${frame.scope}:${frame.domainId ?? "overall"}:star:${physicalFactId}:${targetNode.role}`,
    scope: frame.scope,
    domainId: frame.domainId,
    category: "star",
    physicalFactId,
    ruleId,
    targetPalaceIndex: targetNode.palaceIndex,
    targetNatalPalaceName: targetNode.natalPalaceName,
    targetMajorPalaceName: targetNode.majorPalaceName,
    frameRole: targetNode.role,
    stackingGroup,
    rawAxes: axes,
    effectiveWeight: frame.frameWeight,
    weightedAxes: axes,
    factIds: [physicalFactId],
    sourceIds: match.sourceIds,
    knowledgeStatus: match.knowledgeStatus,
  });
}

function scaleAxes(axes: MajorFortuneAxes, factor: number): MajorFortuneAxes {
  return {
    support: axes.support * factor,
    pressure: axes.pressure * factor,
    stability: axes.stability * factor,
    activation: axes.activation * factor,
  };
}

/**
 * Star evidence for one Major Fortune frame (overall or one domain).
 * Reuses Palace Overview's canonical star knowledge and its VCD borrowing
 * coefficient (`voidEnvironment.voidMajorBorrowFactor`) — no new borrow
 * coefficient, no new star table. A borrowed star is counted once only
 * (at focus, via the borrow factor), never a second time at its own
 * natural opposite-role position.
 */
export function collectStarEvidence(input: CollectStarEvidenceInput): MajorFortuneEvidence[] {
  const { chart, frame, numericKnowledge, diagnostics } = input;
  const out: MajorFortuneEvidence[] = [];
  const borrowedKeys = new Set<string>();

  const focusNode = frame.nodes.find((n) => n.role === "focus");
  if (focusNode) {
    const focusPhysical = physicalStarsAt(chart, focusNode.palaceIndex);
    const focusMajors = focusPhysical ? majorStarsOf(focusPhysical.stars, numericKnowledge) : [];

    if (focusMajors.length === 0) {
      const oppositeNode = frame.nodes.find((n) => n.role === "opposite");
      const oppositePhysical = oppositeNode ? physicalStarsAt(chart, oppositeNode.palaceIndex) : null;
      const oppositeMajors = oppositePhysical ? majorStarsOf(oppositePhysical.stars, numericKnowledge) : [];

      if (oppositeNode && oppositePhysical && oppositeMajors.length > 0) {
        const borrow = numericKnowledge.voidEnvironment.voidMajorBorrowFactor;
        for (const star of oppositeMajors) {
          pushStarEvidence(out, {
            star,
            physicalPalaceIndex: oppositePhysical.palace.index,
            targetNode: focusNode,
            frame,
            borrowFactor: borrow,
            numericKnowledge,
            diagnostics,
          });
          borrowedKeys.add(`${oppositePhysical.palace.index}:${canonicalStarName(star.name)}`);
        }
      }
    }
  }

  for (const node of frame.nodes) {
    const physical = physicalStarsAt(chart, node.palaceIndex);
    if (!physical) continue;
    for (const star of physical.stars) {
      const canonical = canonicalStarName(star.name);
      if (borrowedKeys.has(`${physical.palace.index}:${canonical}`)) continue;
      pushStarEvidence(out, {
        star,
        physicalPalaceIndex: physical.palace.index,
        targetNode: node,
        frame,
        numericKnowledge,
        diagnostics,
      });
    }
  }

  return out;
}
