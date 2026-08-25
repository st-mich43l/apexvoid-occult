import type { NatalZiweiFact, ZiweiBrightness } from "../../../facts";
import type { StaticFrame } from "../../../frame";
import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge/palace-overview-research-v2/schema";
import type { StructuralRuleRecord } from "../../../knowledge/palace-overview-research-v2/schema";
import {
  type PalaceEvidence,
  type PalaceEvidenceAxes,
  type PalaceOverviewDiagnostics,
} from "../types";

const DEFAULT_GOOD = ["Miếu", "Vượng", "Đắc"];

interface MajorInFrame {
  fact: NatalZiweiFact;
  name: string;
  brightness: ZiweiBrightness | null;
}

function majorsInFrame(
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
): MajorInFrame[] {
  const out: MajorInFrame[] = [];
  for (const node of frame.nodes) {
    for (const fact of factsByPalace.get(node.palaceIndex) ?? []) {
      if (fact.kind !== "star" || fact.starClass !== "major") continue;
      if (!fact.canonicalStarName) continue;
      out.push({
        fact,
        name: fact.canonicalStarName,
        brightness: fact.brightness ?? null,
      });
    }
  }
  return out;
}

function transformsInFrame(
  frame: StaticFrame,
  factsByPalace: Map<number, NatalZiweiFact[]>,
): NatalZiweiFact[] {
  const out: NatalZiweiFact[] = [];
  for (const node of frame.nodes) {
    for (const fact of factsByPalace.get(node.palaceIndex) ?? []) {
      if (fact.kind === "transformation") out.push(fact);
    }
  }
  return out;
}

function findParticipants(
  rule: StructuralRuleRecord,
  majors: MajorInFrame[],
): MajorInFrame[] | null {
  const found: MajorInFrame[] = [];
  for (const name of rule.participants) {
    const hit = majors.find((m) => m.name === name);
    if (!hit) return null;
    found.push(hit);
  }
  return found;
}

function evaluateTuPhu(
  rule: StructuralRuleRecord,
  participants: MajorInFrame[],
): PalaceEvidenceAxes {
  const cond = rule.conditions;
  const good = new Set(
    (cond.goodBrightness as string[] | undefined) ?? DEFAULT_GOOD,
  );
  const minGood = Number(cond.minGoodBrightness ?? 2);
  const goodCount = participants.filter(
    (p) => p.brightness != null && good.has(p.brightness),
  ).length;
  let axes: PalaceEvidenceAxes = { ...rule.baseAxes };
  if (goodCount < minGood) {
    axes = {
      ...axes,
      support: axes.support * Number(cond.weakSupportFactor ?? 0.5),
      stability: axes.stability * Number(cond.weakStabilityFactor ?? 0.5),
    };
  }
  return axes;
}

function evaluateCoNguyet(
  rule: StructuralRuleRecord,
  participants: MajorInFrame[],
): PalaceEvidenceAxes {
  const cond = rule.conditions;
  const hamCount = participants.filter((p) => p.brightness === "Hãm").length;
  let axes: PalaceEvidenceAxes = { ...rule.baseAxes };
  if (hamCount >= Number(cond.hamThreshold ?? 2)) {
    axes = {
      support: axes.support * Number(cond.supportFactorWhenHam ?? 0.5),
      pressure: axes.pressure + Number(cond.pressureDeltaWhenHam ?? 0),
      stability: axes.stability + Number(cond.stabilityDeltaWhenHam ?? 0),
      activation: axes.activation,
    };
  }
  return axes;
}

function evaluateSatPhaTham(
  rule: StructuralRuleRecord,
  participants: MajorInFrame[],
  transforms: NatalZiweiFact[],
): PalaceEvidenceAxes {
  const cond = rule.conditions;
  let axes: PalaceEvidenceAxes = { ...rule.baseAxes };
  const hamCount = participants.filter((p) => p.brightness === "Hãm").length;
  if (hamCount >= Number(cond.hamThreshold ?? 2)) {
    axes = {
      ...axes,
      pressure: axes.pressure + Number(cond.pressureDeltaWhenHam ?? 0),
      stability: axes.stability + Number(cond.stabilityDeltaWhenHam ?? 0),
    };
  }

  const good = new Set(
    (cond.goodBrightness as string[] | undefined) ?? DEFAULT_GOOD,
  );
  const goodCount = participants.filter(
    (p) => p.brightness != null && good.has(p.brightness),
  ).length;
  const participantNames = new Set(participants.map((p) => p.name));
  const benefic = new Set(
    (cond.beneficTransforms as string[] | undefined) ?? ["Lộc", "Quyền", "Khoa"],
  );

  const hasBeneficOnParticipant = transforms.some(
    (t) =>
      t.targetStar &&
      participantNames.has(t.targetStar) &&
      t.transformation &&
      benefic.has(t.transformation),
  );
  if (
    goodCount >= Number(cond.goodThreshold ?? 2) &&
    hasBeneficOnParticipant
  ) {
    axes = {
      ...axes,
      support: axes.support + Number(cond.supportDeltaWhenGoodTransform ?? 0),
      activation:
        axes.activation + Number(cond.activationDeltaWhenGoodTransform ?? 0),
    };
  }

  const hasKyOnParticipant = transforms.some(
    (t) =>
      t.transformation === "Kỵ" &&
      t.targetStar &&
      participantNames.has(t.targetStar),
  );
  if (hasKyOnParticipant) {
    axes = {
      ...axes,
      pressure: axes.pressure + Number(cond.pressureDeltaWhenKy ?? 0),
      activation: axes.activation + Number(cond.activationDeltaWhenKy ?? 0),
    };
  }

  return axes;
}

export function evaluateStructuralRulesV2(input: {
  frame: StaticFrame;
  factsByPalace: Map<number, NatalZiweiFact[]>;
  knowledge: PalaceOverviewKnowledgeV1;
  diagnostics: PalaceOverviewDiagnostics;
  focusPalaceName: string;
  focusPalaceBranch: string;
}): PalaceEvidence[] {
  const { frame, factsByPalace, knowledge, diagnostics } = input;
  const majors = majorsInFrame(frame, factsByPalace);
  const transforms = transformsInFrame(frame, factsByPalace);
  const focus = frame.nodes.find((n) => n.role === "focus");
  if (!focus) return [];
  const focusNode = focus;

  const status =
    knowledge.profile.status === "approved" ? "approved" : "experimental";
  const out: PalaceEvidence[] = [];

  const frameFacts = frame.nodes.flatMap((node) =>
    (factsByPalace.get(node.palaceIndex) ?? []).map((fact) => ({ node, fact })),
  );

  function emit(rule: (typeof knowledge.structuralRules.rules)[number], axes: PalaceEvidenceAxes, factIds: string[]) {
    diagnostics.ruleHits.push({
      palaceName: input.focusPalaceName,
      ruleId: rule.id,
      factIds,
    });
    out.push({
      id: `ev:rule:${rule.id}:${focusNode.palaceIndex}`,
      category: "structural-rule",
      factIds,
      ruleId: rule.id,
      palaceRole: "focus",
      palaceName: focusNode.palaceName,
      palaceBranch: focusNode.palaceBranch,
      axes,
      label: rule.label,
      explanationKey: `rule.${rule.id}`,
      sourceIds: knowledge.structuralRules.sourceIds,
      knowledgeStatus: status,
      sourceKind: "rule",
      contributionKind: "interaction-delta",
    });
  }

  for (const rule of knowledge.structuralRules.rules) {
    if (rule.id === "rule-tu-phu-vu-tuong") {
      const participants = findParticipants(rule, majors);
      if (!participants) continue;
      emit(rule, evaluateTuPhu(rule, participants), participants.map((p) => p.fact.id));
      continue;
    }
    if (rule.id === "rule-co-nguyet-dong-luong") {
      const participants = findParticipants(rule, majors);
      if (!participants) continue;
      emit(rule, evaluateCoNguyet(rule, participants), participants.map((p) => p.fact.id));
      continue;
    }
    if (rule.id === "rule-sat-pha-tham") {
      const participants = findParticipants(rule, majors);
      if (!participants) continue;
      emit(
        rule,
        evaluateSatPhaTham(rule, participants, transforms),
        participants.map((p) => p.fact.id),
      );
      continue;
    }
    if (rule.id === "rule-cu-nhat") {
      const cu = majors.find((m) => m.name === "Cự Môn");
      const duong = majors.find((m) => m.name === "Thái Dương");
      if (!cu || !duong) continue;
      const cond = rule.conditions;
      const good = new Set((cond.goodBrightness as string[] | undefined) ?? ["Miếu", "Vượng"]);
      let axes: PalaceEvidenceAxes = { ...rule.baseAxes };
      if (duong.brightness === "Hãm") {
        axes = {
          support: axes.support * Number(cond.supportFactorWhenHam ?? 0.2),
          pressure: axes.pressure + Number(cond.pressureDeltaWhenHam ?? 0),
          stability: axes.stability + Number(cond.stabilityDeltaWhenHam ?? 0),
          activation: axes.activation,
        };
      } else if (!duong.brightness || !good.has(duong.brightness)) {
        axes = {
          ...axes,
          support: axes.support * Number(cond.weakSupportFactor ?? 0.4),
        };
      }
      emit(rule, axes, [cu.fact.id, duong.fact.id]);
      continue;
    }
    if (rule.id === "rule-song-loc") {
      const locTon = frameFacts.find(
        (x) => x.fact.kind === "star" && x.fact.canonicalStarName === "Lộc Tồn",
      );
      const hoaLoc = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Lộc",
      );
      if (!locTon || !hoaLoc) continue;
      emit(rule, { ...rule.baseAxes }, [locTon.fact.id, hoaLoc.fact.id]);
      continue;
    }
    if (rule.id === "rule-loc-quyen-hoi") {
      const loc = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Lộc",
      );
      const quyen = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Quyền",
      );
      if (!loc || !quyen) continue;
      emit(rule, { ...rule.baseAxes }, [loc.fact.id, quyen.fact.id]);
      continue;
    }
    if (rule.id === "rule-khoa-quyen-loc") {
      const loc = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Lộc",
      );
      const quyen = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Quyền",
      );
      const khoa = frameFacts.find(
        (x) => x.fact.kind === "transformation" && x.fact.transformation === "Khoa",
      );
      if (!loc || !quyen || !khoa) continue;
      emit(rule, { ...rule.baseAxes }, [loc.fact.id, quyen.fact.id, khoa.fact.id]);
      continue;
    }
    if (rule.id === "rule-kinh-da-giap-ky") {
      const left = (focusNode.palaceIndex + 11) % 12;
      const right = (focusNode.palaceIndex + 1) % 12;
      const kyOnFocus = (factsByPalace.get(focusNode.palaceIndex) ?? []).find(
        (f) => f.kind === "transformation" && f.transformation === "Kỵ",
      );
      const neighbors = [
        ...(factsByPalace.get(left) ?? []),
        ...(factsByPalace.get(right) ?? []),
      ];
      const kinh = neighbors.find((f) => f.kind === "star" && f.canonicalStarName === "Kình Dương");
      const da = neighbors.find((f) => f.kind === "star" && f.canonicalStarName === "Đà La");
      if (!kyOnFocus || !kinh || !da) continue;
      emit(rule, { ...rule.baseAxes }, [kyOnFocus.id, kinh.id, da.id]);
    }
  }

  return out;
}
