/**
 * Hệ Can Chi (Sexagenary cycle) dùng chung cho Tử Vi và Bát Tự.
 *
 * Canonical five-element spellings: Hỏa / Thủy (see domain-tokens.ts).
 * Canonical earthly branch for shared sexagenary: Tị (Zi Wei engines may use Tỵ).
 */

import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  type FiveElement,
  type Polarity,
} from "./domain-tokens";

export const STEMS: readonly string[] = HEAVENLY_STEMS;
export const BRANCHES: readonly string[] = [...EARTHLY_BRANCHES];

export const STEM_ELEMENTS: Record<string, FiveElement> = {
  Giáp: "Mộc",
  Ất: "Mộc",
  Bính: "Hỏa",
  Đinh: "Hỏa",
  Mậu: "Thổ",
  Kỷ: "Thổ",
  Canh: "Kim",
  Tân: "Kim",
  Nhâm: "Thủy",
  Quý: "Thủy",
};

/**
 * Âm dương của Can/Chi. Dương = 1, Âm = -1
 */
export const STEM_POLARITY: Record<string, Polarity> = {
  Giáp: 1,
  Ất: -1,
  Bính: 1,
  Đinh: -1,
  Mậu: 1,
  Kỷ: -1,
  Canh: 1,
  Tân: -1,
  Nhâm: 1,
  Quý: -1,
};

export interface Pillar {
  stem: string;
  branch: string;
}

/**
 * Ngũ Hổ Độn - Tìm can tháng từ can năm.
 * Tháng Dần luôn là tháng khởi đầu của năm (Bát Tự).
 */
export function getMonthStem(yearStemIndex: number, monthBranchIndex: number): number {
  const offset = [2, 4, 6, 8, 0][yearStemIndex % 5] ?? 0;
  const diff = (monthBranchIndex - 2 + 12) % 12;
  return (offset + diff) % 10;
}

/**
 * Ngũ Thử Độn - Tìm can giờ từ can ngày.
 * Giờ Tý luôn là giờ khởi đầu của ngày.
 */
export function getHourStem(dayStemIndex: number, hourBranchIndex: number): number {
  const offset = [0, 2, 4, 6, 8][dayStemIndex % 5] ?? 0;
  return (offset + hourBranchIndex) % 10;
}

/**
 * Lấy can chi của ngày từ số Julian Day Number (JDN lúc 12h trưa).
 * Mốc: 1/1/1900 là JD 2415021, ngày Giáp Tuất (Can 0, Chi 10).
 */
export function getDayPillar(jd: number): Pillar {
  const diff = Math.floor(jd) - 2415021;
  let stemIndex = diff % 10;
  if (stemIndex < 0) stemIndex += 10;

  let branchIndex = (10 + diff) % 12;
  if (branchIndex < 0) branchIndex += 12;

  return {
    stem: STEMS[stemIndex] ?? "",
    branch: BRANCHES[branchIndex] ?? "",
  };
}
