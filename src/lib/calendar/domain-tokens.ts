/**
 * Canonical domain tokens for deterministic Calculation Core paths.
 *
 * Bát Tự / shared sexagenary authority uses:
 *   EarthlyBranch spelling "Tị" (not Zi Wei "Tỵ")
 *   FiveElement spelling "Hỏa" / "Thủy" (not "Hoả" / "Thuỷ")
 *
 * Zi Wei school engines may continue emitting "Tỵ" as their historical chart
 * vocabulary. Convert at boundaries via normalize* helpers — never fork
 * spelling inside deterministic algorithms.
 */

export const HEAVENLY_STEMS = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
] as const;
export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];

/** Canonical Bát Tự / sexagenary branch order (Tý … Hợi). */
export const EARTHLY_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tị",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export const FIVE_ELEMENTS = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"] as const;
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

export type Polarity = 1 | -1;

const STEM_SET = new Set<string>(HEAVENLY_STEMS);
const BRANCH_SET = new Set<string>(EARTHLY_BRANCHES);

/** Display / Zi Wei aliases → canonical Bát Tự tokens. */
const BRANCH_ALIASES: Record<string, EarthlyBranch> = {
  Tỵ: "Tị",
};

const ELEMENT_ALIASES: Record<string, FiveElement> = {
  Hoả: "Hỏa",
  Thuỷ: "Thủy",
};

export function normalizeEarthlyBranch(raw: string): EarthlyBranch | null {
  if (BRANCH_SET.has(raw)) return raw as EarthlyBranch;
  const aliased = BRANCH_ALIASES[raw];
  return aliased ?? null;
}

export function assertEarthlyBranch(raw: string): EarthlyBranch {
  const n = normalizeEarthlyBranch(raw);
  if (!n) {
    throw new Error(`Invalid earthly branch token: ${JSON.stringify(raw)}`);
  }
  return n;
}

export function normalizeFiveElement(raw: string): FiveElement | null {
  if ((FIVE_ELEMENTS as readonly string[]).includes(raw)) {
    return raw as FiveElement;
  }
  return ELEMENT_ALIASES[raw] ?? null;
}

export function assertFiveElement(raw: string): FiveElement {
  const n = normalizeFiveElement(raw);
  if (!n) {
    throw new Error(`Invalid five-element token: ${JSON.stringify(raw)}`);
  }
  return n;
}

export function normalizeHeavenlyStem(raw: string): HeavenlyStem | null {
  return STEM_SET.has(raw) ? (raw as HeavenlyStem) : null;
}

export function assertHeavenlyStem(raw: string): HeavenlyStem {
  const n = normalizeHeavenlyStem(raw);
  if (!n) {
    throw new Error(`Invalid heavenly stem token: ${JSON.stringify(raw)}`);
  }
  return n;
}

export function isHeavenlyStem(raw: string): raw is HeavenlyStem {
  return STEM_SET.has(raw);
}

export function isEarthlyBranch(raw: string): boolean {
  return normalizeEarthlyBranch(raw) !== null;
}
