import {
  getSmallLimitBranchRing,
} from "./annual-flow";
import {
  parseZiweiCalculationInput,
  withAnnualYear,
  type ZiweiCalculationInput,
} from "./calculation-input";

import {
  BRANCHES,
  CYCLE_BRANCHES,
  DOCTOR_CYCLE,
  LUU_HA_BY_STEM,
  LUU_VAN_KHUC,
  LUU_VAN_XUONG,
  MAIN_OFFSETS,
  PALACE_HAN,
  PALACES_BY_FORWARD_BRANCH,
  STEM_POLARITY,
  STEM_SUPPORT,
  STEM_THIEN_TRU,
  TAI_TUE_CYCLE,
  TIANFU_OFFSETS,
  addCycle,
  addStar,
  addStarAtBranch,
  cycleBranchToIndex,
  fix,
  getLuIndex,
  getPalaceStem,
  locTonIndex as sharedLocTonIndex,
  stemBranchForLunarMonth as sharedStemBranchForLunarMonth,
  stemBranchForSolarDay,
  stemBranchForYear,
  stemForHour,
  type ZiweiWorkingPalace,
} from "./calculation/shared-primitives";
import {
  addChangSheng,
  addFixedPalaceStars,
  addVoidStars,
  assignMajorFortunes,
  findStar,
  getCoQua,
  getCuc,
  getDaoHoaIndex,
  getElementRelation,
  getHoaCaiIndex,
  getKiepSatIndex,
  getLongTriIndex,
  getNapAmElement,
  getPhaToaiIndex,
  getPhuongCacIndex,
  getSoulBody,
  getThienKhongIndex,
  getTianMaIndex,
  getVoidMarkers,
  getZiweiStart,
} from "./calculation/shared-chart-geometry";
import {
  adjustedLunarMonth,
  assignAnnualFlow,
  calculateThang1,
  getLNDVBase,
} from "./calculation/shared-temporal";
import { NAM_PHAI_TU_HOA as TU_HOA, NAM_PHAI_KHOI_VIET as STEM_KHOI_VIET } from "./schools/nam-phai-policy";
import { khoiVietPair, tuHoaRow } from "./schools/policy-types";
import {
  solarToLunar,
} from "../calendar/lunar-vn";
import type {
  BirthInput,
  ChartData,
  ChartPhiFlow,
  MutagenRecord,
} from "@/types/chart";

// Bản làm việc nội bộ: stars always present during placement.
type Palace = ZiweiWorkingPalace;

const STAR_ELEMENTS: Record<string, string> = {
  "Tử Vi":"Thổ","Thiên Cơ":"Mộc","Thái Dương":"Hỏa","Vũ Khúc":"Kim","Thiên Đồng":"Thủy","Liêm Trinh":"Hỏa",
  "Thiên Phủ":"Thổ","Thái Âm":"Thủy","Tham Lang":"Mộc","Cự Môn":"Thủy","Thiên Tướng":"Thủy","Thiên Lương":"Thổ","Thất Sát":"Kim","Phá Quân":"Thủy",
  "Tả Phụ":"Thổ","Tả Phù":"Thổ","Hữu Bật":"Thủy","Văn Xương":"Kim","Văn Khúc":"Thủy","Lộc Tồn":"Thổ","Kình Dương":"Kim","Đà La":"Kim",
  "Hóa Lộc":"Mộc","Hóa Quyền":"Mộc","Hóa Khoa":"Thủy","Hóa Kỵ":"Thủy",
  "Thiên Khôi":"Hỏa","Thiên Việt":"Hỏa","Thiên Quan":"Hỏa","Thiên Phúc":"Hỏa","Quốc Ấn":"Thổ","Đường Phù":"Mộc","Thiên Trù":"Thổ",
  "Thiên Mã":"Hỏa","Hoa Cái":"Kim","Đào Hoa":"Mộc","Hồng Loan":"Thủy","Thiên Hỷ":"Thủy","Thiên Khốc":"Kim","Thiên Hư":"Thủy",
  "Cô Thần":"Thổ","Quả Tú":"Thổ","Thiên Đức":"Thổ","Nguyệt Đức":"Thủy","Long Trì":"Thủy","Phượng Các":"Mộc","Phá Toái":"Hỏa",
  "Thiên Hình":"Hỏa","Thiên Riêu":"Thủy","Thiên Y":"Thủy","Thiên Giải":"Hỏa","Địa Giải":"Thổ","Giải Thần":"Mộc",
  "Hỏa Tinh":"Hỏa","Linh Tinh":"Hỏa",
  "Thiên Tài":"Thổ","Thiên Thọ":"Thổ","Thai Phụ":"Kim","Phong Cáo":"Thổ","Địa Không":"Hỏa","Địa Kiếp":"Hỏa","Thiên Không":"Hỏa",
  "Thiên La":"Thổ","Địa Võng":"Thổ","Thiên Sứ":"Thủy","Thiên Thương":"Thủy","Lưu Hà":"Thủy",
  "Tam Thai":"Thủy","Bát Tọa":"Mộc","Ân Quang":"Hỏa","Thiên Quý":"Thổ","Thiên Vu":"Mộc",
  "Bác Sĩ":"Thủy","Lực Sĩ":"Hỏa","Thanh Long":"Thủy","Tiểu Hao":"Hỏa","Tướng Quân":"Mộc","Tấu Thư":"Kim","Phi Liêm":"Hỏa","Hỷ Thần":"Hỏa","Bệnh Phù":"Mộc","Đại Hao":"Hỏa","Phục Binh":"Hỏa","Quan Phủ":"Hỏa",
  "Thái Tuế":"Hỏa","Thiếu Dương":"Hỏa","Tang Môn":"Mộc","Thiếu Âm":"Thủy","Quan Phù":"Hỏa","Tử Phù":"Kim","Tuế Phá":"Hỏa","Long Đức":"Thủy","Bạch Hổ":"Kim","Phúc Đức":"Thổ","Điếu Khách":"Hỏa","Trực Phù":"Kim",
  "Đẩu Quân":"Hỏa","Âm Sát":"Thủy","Tuần":"Hỏa","Triệt":"Kim","Tuần Không":"Hỏa","Triệt Không":"Kim",
  "Kiếp Sát":"Hỏa",
  "Tràng Sinh":"Thủy","Mộc Dục":"Thủy","Quan Đới":"Kim","Lâm Quan":"Kim","Đế Vượng":"Kim","Suy":"Thủy","Bệnh":"Hỏa","Tử":"Hỏa","Mộ":"Thổ","Tuyệt":"Thổ","Thai":"Thổ","Dưỡng":"Mộc"
};
const YANG_STEMS = ["Giáp","Bính","Mậu","Canh","Nhâm"];
const MONTH_STARS: Array<[string, string, number, string]> = [
  ["Thiên Hình","Dậu",1,"harm"], ["Thiên Riêu","Sửu",1,"romance"], ["Thiên Y","Sửu",1,"helper"],
  ["Thiên Giải","Thân",1,"helper"], ["Địa Giải","Mùi",1,"helper"], ["Giải Thần","Sửu",1,"helper"]
];
const HOUR_STARS: Array<[string, string, number, string]> = [
  ["Địa Không","Hợi",-1,"harm"], ["Địa Kiếp","Hợi",1,"harm"], ["Thai Phụ","Ngọ",1,"helper"],
  ["Phong Cáo","Dần",1,"helper"]
];

/** @public Required by the ChartEngine boundary — shared calendar ownership. */
export { solarToLunar };

export function stemBranchForLunarMonth(yearStem: string, lunarMonth: number): { stem: string; branch: string } {
  return sharedStemBranchForLunarMonth(yearStem, lunarMonth);
}

/** @public */
export function locTonIndex(stem: string): number {
  return sharedLocTonIndex(stem);
}

export function tuHoaTargets(stem: string): Array<{ mutagen: string; starName: string }> {
  const table = tuHoaRow(TU_HOA, stem);
  if (!table) return [];
  return Object.entries(table).map(([mutagen, starName]) => ({ mutagen, starName }));
}

function addStemStars(palaces: Palace[], stem: string, source = "natal"): void {
  if(source === "annual"){
    // Quý nhân & văn tinh lưu niên (an theo CAN lưu niên)
    const [lKhoi, lViet] = khoiVietPair(STEM_KHOI_VIET, stem) ?? ["", ""];
    addStarAtBranch(palaces, lKhoi ?? "", "Lưu Thiên Khôi", "annual", "annual");
    addStarAtBranch(palaces, lViet ?? "", "Lưu Thiên Việt", "annual", "annual");
    addStarAtBranch(palaces, LUU_VAN_XUONG[stem] ?? "", "Lưu Văn Xương", "annual", "annual");
    addStarAtBranch(palaces, LUU_VAN_KHUC[stem] ?? "", "Lưu Văn Khúc", "annual", "annual");
    // Lưu Hỷ Thần: từ Lưu Lộc Tồn theo vòng Bác Sĩ (dương can thuận, âm can nghịch)
    const luIdx = getLuIndex(stem);
    const step = YANG_STEMS.includes(stem) ? 7 : -7;
    addStar(palaces, luIdx + step, "Lưu Hỷ Thần", "annual", "annual");
    return;
  }
  const [khoi, viet] = khoiVietPair(STEM_KHOI_VIET, stem) ?? ["", ""];
  addStarAtBranch(palaces, khoi ?? "", "Thiên Khôi", "helper");
  addStarAtBranch(palaces, viet ?? "", "Thiên Việt", "helper");
  const support = STEM_SUPPORT[stem] ?? { ThiênQuan: "", ThiênPhúc: "" };
  const luIndex = getLuIndex(stem);
  addStarAtBranch(palaces, support.ThiênQuan, "Thiên Quan", "helper");
  addStarAtBranch(palaces, support.ThiênPhúc, "Thiên Phúc", "helper");
  addStarAtBranch(palaces, STEM_THIEN_TRU[stem] ?? "", "Thiên Trù", "helper");
  addStar(palaces, luIndex + 8, "Quốc Ấn", "helper");
  addStar(palaces, luIndex + 5, "Đường Phù", "helper");
  addStarAtBranch(palaces, LUU_HA_BY_STEM[stem] ?? "", "Lưu Hà", "harm");
}

function addYearBranchStars(palaces: Palace[], yearBranch: string, source = "natal"): void {
  if(source === "annual"){
    // Sao lưu niên an theo CHI lưu niên (giữ các sao quan trọng, khớp lá số mẫu)
    const base = cycleBranchToIndex(yearBranch);
    const branchOffset = CYCLE_BRANCHES.indexOf(yearBranch);
    // Vòng Thái Tuế: Thái Tuế, Tang Môn, Long Đức, Bạch Hổ, Phúc Đức
    [0, 2, 7, 8, 9].forEach(i =>
      addStar(palaces, fix(base + i), `Lưu ${TAI_TUE_CYCLE[i]}`, "annual", "annual")
    );
    addStar(palaces, getTianMaIndex(yearBranch), "Lưu Thiên Mã", "annual", "annual");
    addStar(palaces, getDaoHoaIndex(yearBranch), "Lưu Đào Hoa", "annual", "annual");
    addStar(palaces, getKiepSatIndex(yearBranch), "Lưu Kiếp Sát", "annual", "annual");
    addStar(palaces, BRANCHES.indexOf("Mão") - branchOffset, "Lưu Hồng Loan", "annual", "annual");
    addStar(palaces, BRANCHES.indexOf("Dậu") - branchOffset, "Lưu Thiên Hỷ", "annual", "annual");
    addStar(palaces, BRANCHES.indexOf("Ngọ") - branchOffset, "Lưu Thiên Khốc", "annual", "annual");
    addStar(palaces, BRANCHES.indexOf("Ngọ") + branchOffset, "Lưu Thiên Hư", "annual", "annual");
    addStar(palaces, base + 9, "Lưu Thiên Đức", "annual", "annual");
    addStar(palaces, base + 5, "Lưu Nguyệt Đức", "annual", "annual");
    return;
  }
  // Natal
  addCycle(palaces, cycleBranchToIndex(yearBranch), TAI_TUE_CYCLE, 1, "cycle");
  addStar(palaces, getTianMaIndex(yearBranch), "Thiên Mã", "move");
  addStar(palaces, getHoaCaiIndex(yearBranch), "Hoa Cái", "cycle");
  addStar(palaces, getDaoHoaIndex(yearBranch), "Đào Hoa", "romance");
  addStar(palaces, getThienKhongIndex(yearBranch), "Thiên Không", "void");
  addStar(palaces, getKiepSatIndex(yearBranch), "Kiếp Sát", "harm");
  const branchOffset = CYCLE_BRANCHES.indexOf(yearBranch);
  addStar(palaces, BRANCHES.indexOf("Mão") - branchOffset, "Hồng Loan", "romance");
  addStar(palaces, BRANCHES.indexOf("Dậu") - branchOffset, "Thiên Hỷ", "romance");
  addStar(palaces, BRANCHES.indexOf("Ngọ") - branchOffset, "Thiên Khốc", "harm");
  addStar(palaces, BRANCHES.indexOf("Ngọ") + branchOffset, "Thiên Hư", "harm");
  const coQua = getCoQua(yearBranch);
  addStarAtBranch(palaces, coQua.co, "Cô Thần", "harm");
  addStarAtBranch(palaces, coQua.qua, "Quả Tú", "harm");
  addStar(palaces, cycleBranchToIndex(yearBranch) + 9, "Thiên Đức", "helper");
  addStar(palaces, cycleBranchToIndex(yearBranch) + 5, "Nguyệt Đức", "helper");
  addStar(palaces, getLongTriIndex(yearBranch), "Long Trì", "helper");
  addStar(palaces, getPhuongCacIndex(yearBranch), "Phượng Các", "helper");
  addStar(palaces, getPhaToaiIndex(yearBranch), "Phá Toái", "harm");
}

// An Hỏa Tinh / Linh Tinh theo năm sinh và giờ sinh (Nam Phái)
function addHoaLinhStars(palaces: Palace[], yearBranch: string, hourIndex: number): void {
  const hoaStart = (["Dần","Ngọ","Tuất"].includes(yearBranch)) ? BRANCHES.indexOf("Sửu")
                 : (["Thân","Tý","Thìn"].includes(yearBranch)) ? BRANCHES.indexOf("Dần")
                 : (["Tỵ","Dậu","Sửu"].includes(yearBranch)) ? BRANCHES.indexOf("Mão")
                 : BRANCHES.indexOf("Dậu"); // Hợi/Mão/Mùi
  // Linh Tinh: Dần-Ngọ-Tuất khởi Mão; ba nhóm còn lại đều khởi Tuất
  const linhStart = (["Dần","Ngọ","Tuất"].includes(yearBranch)) ? BRANCHES.indexOf("Mão")
                  : BRANCHES.indexOf("Tuất");
  addStar(palaces, hoaStart + hourIndex, "Hỏa Tinh", "harm");
  addStar(palaces, linhStart - hourIndex, "Linh Tinh", "harm"); // Linh đi nghịch giờ
}

function addMonthDayHourStars(palaces: Palace[], month: number, day: number, hourIndex: number): void {
  addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1, "Tả Phụ", "helper");
  addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1), "Hữu Bật", "helper");
  addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex, "Văn Xương", "helper");
  addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex, "Văn Khúc", "helper");
  MONTH_STARS.forEach(([name, start, direction, layer]) => addStar(palaces, BRANCHES.indexOf(start ?? "") + (month - 1) * (direction ?? 1), name ?? "", layer ?? ""));
  HOUR_STARS.forEach(([name, start, direction, layer]) => addStar(palaces, BRANCHES.indexOf(start ?? "") + hourIndex * (direction ?? 1), name ?? "", layer ?? ""));
  addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1 + day - 1, "Tam Thai", "helper");
  addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1) - (day - 1), "Bát Tọa", "helper");
  addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex + day - 2, "Ân Quang", "helper");
  addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex - day + 2, "Thiên Quý", "helper");
}

function addLuGroup(palaces: Palace[], stem: string, source = "natal"): void {
  const lu = getLuIndex(stem);
  const prefix = source === "annual" ? "Lưu " : "";
  addStar(palaces, lu, `${prefix}Lộc Tồn`, source === "annual" ? "annual" : "wealth", source);
  addStar(palaces, lu + 1, `${prefix}Kình Dương`, source === "annual" ? "annual" : "tough", source);
  addStar(palaces, lu - 1, `${prefix}Đà La`, source === "annual" ? "annual" : "tough", source);
  // Vòng Bác Sĩ (Nam Phái) luôn an thuận theo Lộc Tồn
  if(source === "natal") addCycle(palaces, lu, DOCTOR_CYCLE, 1, "cycle");
}

function getSmallLimitStartIndex(yearBranch: string): number {
  if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Thìn");
  if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tuất");
  if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Mùi");
  return BRANCHES.indexOf("Sửu");
}

interface SmallLimitResult {
  palace: Palace;
  startPalace: Palace;
  direction: string;
  directionSign: number;
}

function assignSmallLimits(palaces: Palace[], yearBranch: string, gender: "male" | "female", age: number): SmallLimitResult {
  const startIndex = getSmallLimitStartIndex(yearBranch);
  const directionSign = gender === "male" ? 1 : -1;
  const branchRing = getSmallLimitBranchRing(yearBranch, gender);
  palaces.forEach(palace => {
    palace.isSmallLimitPalace = false;
    palace.smallLimitAges = [];
    palace.smallLimitBranch = branchRing[palace.index];
  });
  for(let offset = 0; offset < 12; offset++){
    const palace = palaces[fix(startIndex + offset * directionSign)];
    if (!palace) continue;
    palace.smallLimitAges = Array.from({length:10}, (_, cycle) => offset + 1 + cycle * 12);
  }
  const activeIndex = fix(startIndex + ((age - 1) % 12) * directionSign);
  // startIndex/activeIndex luôn nằm trong [0,12) do fix(), nên palaces[...] luôn tồn tại.
  const activePalace = palaces[activeIndex]!;
  activePalace.isSmallLimitPalace = true;
  return {
    palace: activePalace,
    startPalace: palaces[startIndex]!,
    direction: directionSign === 1 ? "thuận" : "nghịch",
    directionSign
  };
}

// Router khởi T1 theo lựa chọn xem vận năm.

function addLifeStars(palaces: Palace[], menhIndex: number, thanIndex: number, yearBranch: string, month: number, hourIndex: number): void {
  const cyc = CYCLE_BRANCHES.indexOf(yearBranch);
  // Thiên Tài khởi từ Mệnh, Thiên Thọ khởi từ Thân, kể là Tý đếm thuận đến chi năm
  addStar(palaces, menhIndex + cyc, "Thiên Tài", "cycle");
  addStar(palaces, thanIndex + cyc, "Thiên Thọ", "cycle");
  // Đẩu Quân: từ cung Thái Tuế (chi năm) đếm nghịch tới tháng sinh, rồi thuận theo giờ sinh
  addStar(palaces, BRANCHES.indexOf(yearBranch) - (month - 1) + hourIndex, "Đẩu Quân", "harm");
}

function addMutagenStars(_palaces: Palace[], records: MutagenRecord[], source: string): void {
  records.forEach(record => {
    if(!record.palace) return;
    const layer = record.mutagen === "Kỵ" ? "harm" : "mutagen";
    const isAnnual = source === "annual-mutagen";
    const name = `${isAnnual ? "Lưu " : ""}Hóa ${record.mutagen}`;
    const palace = record.palace as Palace;
    const exists = palace.stars.some(star => star.name === name && star.source === source);
    if(!exists){
      palace.stars.push({
        name,
        layer,
        source,
        mutagen: record.mutagen,
        targetStar: record.starName
      });
    }
  });
}

function buildChartData(input: ZiweiCalculationInput): ChartData {
  const solar = input.solar;
  const timeZone = input.timezone;
  const lunar = solarToLunar(solar.day, solar.month, solar.year, timeZone);
  const birthHourBranch = input.birthHourBranch;
  const {stem:yearStem, branch:yearBranch} = stemBranchForYear(lunar.year);
  const birthMonthPillar = stemBranchForLunarMonth(yearStem, lunar.month);
  const birthDayPillar = stemBranchForSolarDay(solar.day, solar.month, solar.year);
  const birthHourStem = stemForHour(birthDayPillar.stem, birthHourBranch);
  const annualYear = input.annualYear;
  const annual = stemBranchForYear(annualYear);
  const month = lunar.month;
  const day = lunar.day;

  const {menhIndex, thanIndex, hourIndex} = getSoulBody(month, birthHourBranch);
  const menhBranch = BRANCHES[menhIndex] ?? "";
  const cuc = getCuc(yearStem, menhBranch);
  const menhElement = getNapAmElement(yearStem, yearBranch);
  const cucMenhRelation = getElementRelation(menhElement, cuc.element);
  const starts = getZiweiStart(day, cuc.number);
  const yearPolarity = STEM_POLARITY[yearStem] ?? "";
  const direction = (yearPolarity === "Dương" && input.gender === "male") || (yearPolarity === "Âm" && input.gender === "female") ? "thuận" : "nghịch";
  const directionSign: 1 | -1 = direction === "thuận" ? 1 : -1;
  const nominalAge = Math.max(1, annualYear - lunar.year + 1);

  const palaces: Palace[] = BRANCHES.map((branch, index) => {
    const name = PALACES_BY_FORWARD_BRANCH[fix(index - menhIndex)] ?? "";
    return {
      index,
      branch,
      name,
      han: PALACE_HAN[name],
      stem: getPalaceStem(yearStem, index),
      isMenh: index === menhIndex,
      isThan: index === thanIndex,
      stars: []
    };
  });

  MAIN_OFFSETS.forEach(([name, offset]) => addStar(palaces, starts.ziweiIndex + offset, name, "major"));
  TIANFU_OFFSETS.forEach(([name, offset]) => addStar(palaces, starts.tianfuIndex + offset, name, "major"));

  const majorFortunePalace = assignMajorFortunes(palaces, menhIndex, cuc.number, directionSign, nominalAge);
  const smallLimit = assignSmallLimits(palaces, yearBranch, input.gender, nominalAge);
  // Lưu niên đại vận (zigzag trong đại vận) — cung vận của năm xem.
  const luuNienDaiVanIndex = getLNDVBase(majorFortunePalace, nominalAge, directionSign) ?? (smallLimit.palace ? smallLimit.palace.index : null);
  let annualHeadPalace: Palace | null = null;
  if(luuNienDaiVanIndex != null) {
    const target = palaces[luuNienDaiVanIndex];
    if (target) {
      target.isLuuNienDaiVan = true;
      annualHeadPalace = target;
    }
  }

  // Khởi tháng (lưu nguyệt) — flowBase already validated at the input boundary.
  const flowBase = input.flowBase;
  const adjustedMonth = adjustedLunarMonth(month, day, lunar.leap);
  const monthStartIndex = calculateThang1(
    flowBase,
    yearBranch,
    input.gender,
    annual.branch,
    adjustedMonth,
    hourIndex
  );
  const annualFlow = assignAnnualFlow(palaces, annual.branch, month, day, lunar.leap, hourIndex, monthStartIndex, annual.stem);
  if(smallLimit.palace) smallLimit.palace.isAnnualPalace = true;

  addMonthDayHourStars(palaces, month, day, hourIndex);
  addHoaLinhStars(palaces, yearBranch, hourIndex);
  addStemStars(palaces, yearStem);
  addLuGroup(palaces, yearStem);
  addYearBranchStars(palaces, yearBranch);
  addLifeStars(palaces, menhIndex, thanIndex, yearBranch, month, hourIndex);
  addChangSheng(palaces, cuc, directionSign);
  const voidMarkers = getVoidMarkers(yearStem, yearBranch);
  addVoidStars(palaces, voidMarkers);
  addFixedPalaceStars(palaces);

  addStemStars(palaces, annual.stem, "annual");
  addLuGroup(palaces, annual.stem, "annual");
  addYearBranchStars(palaces, annual.branch, "annual");

  const natalMutagens = getMutagenRecords(yearStem, palaces);
  const annualMutagens = getMutagenRecords(annual.stem, palaces, "annual");
  addMutagenStars(palaces, natalMutagens, "natal-mutagen");
  addMutagenStars(palaces, annualMutagens, "annual-mutagen");
  const phiFlows = getPhiFlows(palaces);
  const annualStars = palaces.flatMap(palace => palace.stars.filter(star => star.source === "annual").map(star => ({...star, palace})));
  const starCount = palaces.reduce((sum, palace) => sum + palace.stars.length, 0);
  return {
    solar, lunar, timeZone, birthHourBranch, yearStem, yearBranch,
    birthMonthStem:birthMonthPillar.stem, birthMonthBranch:birthMonthPillar.branch,
    birthDayStem:birthDayPillar.stem, birthDayBranch:birthDayPillar.branch,
    birthHourStem,
    annualYear, annualStem:annual.stem, annualBranch:annual.branch,
    nominalAge, month, day, menhIndex, thanIndex, menhBranch, menhElement,
    cucMenhRelation, cuc, starts, direction, directionSign, yearPolarity,
    palaces, majorFortunePalace, annualPalace:smallLimit.palace,
    smallLimitPalace:smallLimit.palace, smallLimitStartPalace:smallLimit.startPalace,
    smallLimitDirection:smallLimit.direction, taiTuePalace:annualFlow.taiTuePalace,
    annualHeadPalace,
    monthStartPalace:annualFlow.monthStartPalace, monthlyPalaces:annualFlow.months,
    annualMonthSeed:annualFlow.adjustedMonth,
    natalMutagens, annualMutagens, annualStars, phiFlows, voidMarkers, starCount
  };
}

function getMutagenRecords(stem: string, palaces: Palace[], source = "natal"): MutagenRecord[] {
  const table = tuHoaRow(TU_HOA, stem);
  if (!table) return [];
  return Object.entries(table).map(([mutagen, starName]) => {
    const found = findStar(palaces, starName);
    return {source, mutagen, starName, palace: found ? found.palace : null};
  });
}

function getPhiFlows(palaces: Palace[]): ChartPhiFlow[] {
  const flows: ChartPhiFlow[] = [];
  palaces.forEach(source => {
    const table = tuHoaRow(TU_HOA, source.stem ?? "");
    if (!table) return;
    Object.entries(table).forEach(([mutagen, starName]) => {
      const found = findStar(palaces, starName);
      flows.push({
        source,
        mutagen,
        starName,
        target: found ? found.palace : null,
        self: !!found && found.palace.index === source.index
      });
    });
  });
  return flows;
}

function baseStarName(name: string): string {
  if(name === "Lưu Hà") return name; // sao nguyên cục, "Lưu" là tên không phải tiền tố lưu niên
  return name.replace(/^Lưu\s+/, "");
}

/** @public */
export function elementForStar(name: string): string {
  return STAR_ELEMENTS[baseStarName(name)] || "";
}

function calculate(input: BirthInput): ChartData {
  const validated = parseZiweiCalculationInput(input);
  return buildChartData(validated);
}

/**
 * Pure helper for future multi-year snapshots — does not mutate module state.
 */
export function calculateForAnnualYear(
  input: BirthInput,
  annualYear: number,
): ChartData {
  const validated = withAnnualYear(parseZiweiCalculationInput(input), annualYear);
  return buildChartData(validated);
}

export { calculate };
