/**
 * Shared school-neutral Zi Wei temporal / annual-flow geometry.
 * Does not decide school annualPalace (Tiểu Hạn vs Thái Tuế).
 */
import {
  getAnnualMajorFortuneIndex,
  getFirstFlowMonthIndex,
  getFlowMonthBaseIndex,
  type AnnualViewMode,
} from "../annual-flow";
import type { FlowMonthEntry } from "@/types/chart";
import {
  BRANCHES,
  MONTH_NAMES,
  addStar,
  fix,
  getPalaceStem,
  type ZiweiWorkingPalace,
} from "./shared-primitives";

export interface AnnualFlowResult {
  annualPalaceIndex: number;
  taiTuePalace: ZiweiWorkingPalace;
  dauQuanIndex: number;
  monthStartIndex: number;
  monthStartPalace: ZiweiWorkingPalace;
  months: FlowMonthEntry[];
  adjustedMonth: number;
}

export function adjustedLunarMonth(month: number, day: number, isLeap: number): number {
  return month + (isLeap && day > 15 ? 1 : 0);
}

// Tính cung Lưu Niên Đại Vận để luận vận năm; không dùng làm gốc T1.
export function getLNDVBase(majorFortunePalace: ZiweiWorkingPalace | null, nominalAge: number, directionSign: 1 | -1): number | null {
  if (!majorFortunePalace || !majorFortunePalace.majorFortune) return null;
  return getAnnualMajorFortuneIndex(
    majorFortunePalace.index,
    majorFortunePalace.majorFortune.start,
    nominalAge,
    directionSign
  );
}

export function calculateThang1(flowBase: AnnualViewMode, birthYearBranch: string, gender: "male" | "female", currentYearBranch: string, adjustedMonth: number, hourIndex: number): number {
  const baseCung = getFlowMonthBaseIndex(
    flowBase,
    birthYearBranch,
    gender,
    currentYearBranch
  );
  return getFirstFlowMonthIndex(baseCung, adjustedMonth, hourIndex);
}

export function assignAnnualFlow(palaces: ZiweiWorkingPalace[], annualBranch: string, birthMonth: number, birthDay: number, birthLeap: number, hourIndex: number, monthStartIndex: number, annualStem: string): AnnualFlowResult {
  palaces.forEach(palace => {
    palace.isAnnualPalace = false;
    palace.isTaiTuePalace = false;
    palace.isMonthStart = false;
    palace.flowMonths = [];
  });

  const annualPalaceIndex = BRANCHES.indexOf(annualBranch);
  const adjustedMonth = adjustedLunarMonth(birthMonth, birthDay, birthLeap);

  // Sao Lưu Đẩu Quân: từ cung Thái Tuế đếm nghịch tới tháng sinh, rồi thuận theo giờ sinh
  const dauQuanIndex = fix(annualPalaceIndex - adjustedMonth + hourIndex + 1);
  addStar(palaces, dauQuanIndex, "Lưu Đẩu Quân", "annual", "annual");

  const taiTuePalace = palaces[fix(annualPalaceIndex)]!;
  taiTuePalace.isTaiTuePalace = true;

  const monthStartPalace = palaces[fix(monthStartIndex)]!;
  monthStartPalace.isMonthStart = true;

  const months: FlowMonthEntry[] = Array.from({length:12}, (_, offset) => {
    const focusPalace = palaces[fix(monthStartIndex + offset)]!;
    const month = offset + 1;
    // Legacy compatibility metadata only (FlowMonthEntry.stem/branch):
    // palace-stem cycle + Tiểu Hạn / palace branch — NOT calendar month Can–Chi.
    // Authoritative monthly calendar identity for Lưu Nguyệt Tứ Hóa remains
    // stemBranchForLunarMonth(annualStem, lunarMonth) via ChartEngine/provider.
    const legacyPalaceDerivedStem = getPalaceStem(annualStem, focusPalace.index);
    const legacyPalaceDerivedBranch =
      focusPalace.smallLimitBranch || focusPalace.branch;
    const item: FlowMonthEntry = {
      month,
      label: MONTH_NAMES[offset] ?? "",
      palace: focusPalace,
      stem: legacyPalaceDerivedStem,
      branch: legacyPalaceDerivedBranch,
    };
    focusPalace.flowMonths!.push(item);
    return item;
  });
  return {annualPalaceIndex, taiTuePalace, dauQuanIndex, monthStartIndex, monthStartPalace, months, adjustedMonth};
}

