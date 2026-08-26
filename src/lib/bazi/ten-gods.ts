import { STEM_POLARITY } from "../calendar/sexagenary";
import { assertHeavenlyStem } from "../calendar/domain-tokens";
import {
  getElement,
  getGeneratedByElement,
  getGeneratingElement,
  getOvercomeByElement,
  getOvercomingElement,
  type Element,
} from "./elements";

/**
 * Tính mối quan hệ sinh khắc của Ngũ Hành
 * Trả về:
 * - "same": Cùng hành
 * - "produce": Hành 1 sinh Hành 2
 * - "producedBy": Hành 2 sinh Hành 1
 * - "control": Hành 1 khắc Hành 2
 * - "controlledBy": Hành 2 khắc Hành 1
 */
function getElementRelation(element1: Element, element2: Element): string {
  if (element1 === element2) return "same";
  if (getGeneratingElement(element1) === element2) return "produce";
  if (getGeneratedByElement(element1) === element2) return "producedBy";
  if (getOvercomingElement(element1) === element2) return "control";
  if (getOvercomeByElement(element1) === element2) return "controlledBy";
  return "unknown";
}

/**
 * Tính Thập Thần của một can (targetStem) dựa trên Nhật Chủ (dayMasterStem).
 */
export function getTenGod(dayMasterStem: string, targetStem: string): string {
  assertHeavenlyStem(dayMasterStem);
  assertHeavenlyStem(targetStem);

  const dmElement = getElement(dayMasterStem);
  const targetElement = getElement(targetStem);

  const dmPolarity = STEM_POLARITY[dayMasterStem] ?? 1;
  const targetPolarity = STEM_POLARITY[targetStem] ?? 1;

  const relation = getElementRelation(dmElement, targetElement);
  const samePolarity = dmPolarity === targetPolarity;

  switch (relation) {
    case "same":
      return samePolarity ? "Tỷ Kiên" : "Kiếp Tài";
    case "produce":
      return samePolarity ? "Thực Thần" : "Thương Quan";
    case "control":
      return samePolarity ? "Thiên Tài" : "Chính Tài";
    case "controlledBy":
      return samePolarity ? "Thất Sát" : "Chính Quan";
    case "producedBy":
      return samePolarity ? "Thiên Ấn" : "Chính Ấn";
    default:
      return "Unknown";
  }
}

const TEN_GOD_ABBR: Record<string, string> = {
  "Nhật Chủ": "NC",
  "Tỷ Kiên": "TK",
  "Kiếp Tài": "KT",
  "Thực Thần": "TT",
  "Thương Quan": "TQ",
  "Thiên Tài": "Tt",
  "Chính Tài": "CT",
  "Thất Sát": "TS",
  "Chính Quan": "CQ",
  "Thiên Ấn": "TA",
  "Chính Ấn": "CA",
};

export function tenGodAbbr(tenGod: string): string {
  return TEN_GOD_ABBR[tenGod] ?? tenGod;
}
