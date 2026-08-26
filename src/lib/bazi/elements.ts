import {
  assertEarthlyBranch,
  assertHeavenlyStem,
  normalizeEarthlyBranch,
  normalizeFiveElement,
  type FiveElement,
} from "../calendar/domain-tokens";
import { BRANCHES, STEMS } from "../calendar/sexagenary";

export type Element = FiveElement;

export const ELEMENTS: Element[] = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];

const STEM_OR_BRANCH_ELEMENT: Record<string, Element> = {
  Giáp: "Mộc",
  Ất: "Mộc",
  Dần: "Mộc",
  Mão: "Mộc",
  Bính: "Hỏa",
  Đinh: "Hỏa",
  Tị: "Hỏa",
  Ngọ: "Hỏa",
  Mậu: "Thổ",
  Kỷ: "Thổ",
  Thìn: "Thổ",
  Tuất: "Thổ",
  Sửu: "Thổ",
  Mùi: "Thổ",
  Canh: "Kim",
  Tân: "Kim",
  Thân: "Kim",
  Dậu: "Kim",
  Nhâm: "Thủy",
  Quý: "Thủy",
  Hợi: "Thủy",
  Tý: "Thủy",
};

/**
 * Strict element lookup for trusted deterministic paths.
 * Throws on unknown / un-normalizable tokens — never invents Thổ.
 */
export function getElement(char: string): Element {
  const branch = normalizeEarthlyBranch(char);
  const key = branch ?? char;
  const direct = STEM_OR_BRANCH_ELEMENT[key];
  if (direct) return direct;
  throw new Error(`Invalid stem/branch for element lookup: ${JSON.stringify(char)}`);
}

/** Untrusted/parse boundary — returns null instead of inventing an element. */
export function tryGetElement(char: string): Element | null {
  try {
    return getElement(char);
  } catch {
    return null;
  }
}

/**
 * Neutral UI presentation only — never feed this into scoring.
 */
export function elementForDisplay(char: string): Element | null {
  return tryGetElement(char);
}

export function getGeneratingElement(element: Element): Element {
  switch (element) {
    case "Mộc":
      return "Hỏa";
    case "Hỏa":
      return "Thổ";
    case "Thổ":
      return "Kim";
    case "Kim":
      return "Thủy";
    case "Thủy":
      return "Mộc";
  }
}

export function getGeneratedByElement(element: Element): Element {
  switch (element) {
    case "Mộc":
      return "Thủy";
    case "Hỏa":
      return "Mộc";
    case "Thổ":
      return "Hỏa";
    case "Kim":
      return "Thổ";
    case "Thủy":
      return "Kim";
  }
}

export function getOvercomingElement(element: Element): Element {
  switch (element) {
    case "Mộc":
      return "Thổ";
    case "Hỏa":
      return "Kim";
    case "Thổ":
      return "Thủy";
    case "Kim":
      return "Mộc";
    case "Thủy":
      return "Hỏa";
  }
}

export function getOvercomeByElement(element: Element): Element {
  switch (element) {
    case "Mộc":
      return "Kim";
    case "Hỏa":
      return "Thủy";
    case "Thổ":
      return "Mộc";
    case "Kim":
      return "Hỏa";
    case "Thủy":
      return "Thổ";
  }
}

/** Exhaustive sanity for tables (used by tests). */
export function assertCanonicalStemBranchTables(): void {
  for (const s of STEMS) assertHeavenlyStem(s);
  for (const b of BRANCHES) assertEarthlyBranch(b);
  for (const s of STEMS) getElement(s);
  for (const b of BRANCHES) getElement(b);
  for (const el of ELEMENTS) {
    normalizeFiveElement(el);
    getGeneratingElement(el);
    getOvercomingElement(el);
  }
}
