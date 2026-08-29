/**
 * Shared deterministic Zi Wei Calculation Core primitives.
 *
 * School-neutral mechanics only — no school conditionals, no Tứ Hóa / Khôi-Việt policy.
 * Internal working-palace type is not a public ChartData contract change.
 */
import { jdFromDate } from "../../calendar/julian";
import type { ChartPalace, ChartStar } from "@/types/chart";

/** Internal mutable palace used during placement (stars always present). */
export type ZiweiWorkingPalace = ChartPalace & { stars: ChartStar[] };

export const STEMS = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
export const BRANCHES = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
/** Sexagenary / hour-cycle branch order (Tý→Hợi). Distinct from palace-index BRANCHES (Dần→Sửu). */
export const CYCLE_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
export const HOUR_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
export const MONTH_NAMES = ["Giêng","Hai","Ba","Tư","Năm","Sáu","Bảy","Tám","Chín","Mười","Một","Chạp"];
export const PALACES_BY_FORWARD_BRANCH = ["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];
export const PALACE_HAN: Record<string, string> = {"Mệnh":"命","Huynh Đệ":"兄弟","Phu Thê":"夫妻","Tử Tức":"子女","Tài Bạch":"財帛","Tật Ách":"疾厄","Thiên Di":"遷移","Nô Bộc":"奴僕","Quan Lộc":"官祿","Điền Trạch":"田宅","Phúc Đức":"福德","Phụ Mẫu":"父母"};
const TIGER_RULE: Record<string, string> = {Giáp:"Bính",Kỷ:"Bính",Ất:"Mậu",Canh:"Mậu",Bính:"Canh",Tân:"Canh",Đinh:"Nhâm",Nhâm:"Nhâm",Mậu:"Giáp",Quý:"Giáp"};
export const STEM_POLARITY: Record<string, string> = {Giáp:"Dương",Bính:"Dương",Mậu:"Dương",Canh:"Dương",Nhâm:"Dương",Ất:"Âm",Đinh:"Âm",Kỷ:"Âm",Tân:"Âm",Quý:"Âm"};
export const NAP_AM_ELEMENTS = [
  "Kim","Hỏa","Mộc","Thổ","Kim","Hỏa","Thủy","Thổ","Kim","Mộc",
  "Thủy","Thổ","Hỏa","Mộc","Thủy","Kim","Hỏa","Mộc","Thổ","Kim",
  "Hỏa","Thủy","Thổ","Kim","Mộc","Thủy","Thổ","Hỏa","Mộc","Thủy"
];
export const CUC: Record<string, { number: number; name: string }> = {
  "Thủy":{number:2,name:"Thủy Nhị Cục"},
  "Mộc":{number:3,name:"Mộc Tam Cục"},
  "Kim":{number:4,name:"Kim Tứ Cục"},
  "Thổ":{number:5,name:"Thổ Ngũ Cục"},
  "Hỏa":{number:6,name:"Hỏa Lục Cục"}
};
// index: Dần(0) Mão(1) Thìn(2) Tỵ(3) Ngọ(4) Mùi(5) Thân(6) Dậu(7) Tuất(8) Hợi(9) Tý(10) Sửu(11)
// Chính tinh brightness source table uses: M = Miếu, V = Vượng, Đ = Đắc, H = Hãm, B = Bình.
const BRIGHTNESS: Record<string, string[]> = {
  "Tử Vi":     ["Miếu","Bình","Vượng","Vượng","Miếu","Miếu","Vượng","Bình","Vượng","Bình","Bình","Miếu"],
  "Thiên Cơ":  ["Đắc","Miếu","Miếu","Vượng","Đắc","Hãm","Vượng","Miếu","Miếu","Hãm","Đắc","Đắc"],
  "Thái Dương":["Vượng","Vượng","Vượng","Miếu","Miếu","Đắc","Hãm","Hãm","Hãm","Hãm","Hãm","Đắc"],
  "Vũ Khúc":   ["Vượng","Hãm","Miếu","Bình","Vượng","Miếu","Vượng","Hãm","Miếu","Bình","Vượng","Miếu"],
  "Thiên Đồng":["Miếu","Hãm","Hãm","Đắc","Hãm","Hãm","Miếu","Đắc","Hãm","Đắc","Vượng","Hãm"],
  "Liêm Trinh":["Miếu","Hãm","Miếu","Hãm","Vượng","Bình","Miếu","Hãm","Miếu","Hãm","Vượng","Bình"],
  "Thiên Phủ": ["Miếu","Bình","Vượng","Bình","Miếu","Bình","Miếu","Bình","Vượng","Bình","Miếu","Bình"],
  "Thái Âm":   ["Hãm","Hãm","Hãm","Hãm","Hãm","Đắc","Vượng","Miếu","Miếu","Miếu","Vượng","Đắc"],
  "Tham Lang": ["Đắc","Hãm","Vượng","Hãm","Hãm","Miếu","Đắc","Hãm","Vượng","Hãm","Hãm","Miếu"],
  "Cự Môn":    ["Vượng","Miếu","Hãm","Hãm","Vượng","Hãm","Đắc","Miếu","Hãm","Đắc","Vượng","Hãm"],
  "Thiên Tướng":["Miếu","Hãm","Vượng","Đắc","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Vượng","Đắc"],
  "Thiên Lương":["Vượng","Vượng","Miếu","Hãm","Miếu","Đắc","Vượng","Hãm","Miếu","Hãm","Vượng","Đắc"],
  "Thất Sát":  ["Miếu","Hãm","Hãm","Vượng","Miếu","Đắc","Miếu","Hãm","Hãm","Vượng","Miếu","Đắc"],
  "Phá Quân":  ["Đắc","Hãm","Vượng","Hãm","Miếu","Vượng","Đắc","Hãm","Vượng","Hãm","Miếu","Vượng"],
  "Văn Xương": ["Hãm","Đắc","Đắc","Miếu","Hãm","Đắc","Đắc","Miếu","Hãm","Đắc","Đắc","Miếu"],
  "Văn Khúc":  ["","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Miếu"],
  // Miếu: Dần/Ngọ/Tuất  |  Hãm: Thìn/Thân/Tý  |  Đắc: các vị trí còn lại
  "Hỏa Tinh":  ["Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc"],
  "Linh Tinh": ["Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Hãm"]
};
export const MAIN_OFFSETS: Array<[string, number]> = [
  ["Tử Vi",0], ["Thiên Cơ",-1], ["Thái Dương",-3], ["Vũ Khúc",-4], ["Thiên Đồng",-5], ["Liêm Trinh",-8]
];
export const TIANFU_OFFSETS: Array<[string, number]> = [
  ["Thiên Phủ",0], ["Thái Âm",1], ["Tham Lang",2], ["Cự Môn",3], ["Thiên Tướng",4], ["Thiên Lương",5], ["Thất Sát",6], ["Phá Quân",10]
];
export const TAI_TUE_CYCLE = ["Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù","Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"];
export const DOCTOR_CYCLE = ["Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"];
export const CHANG_SHENG_CYCLE = ["Tràng Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
export const CHANG_SHENG_START: Record<string, string> = {"Thủy":"Thân","Thổ":"Thân","Mộc":"Hợi","Kim":"Tỵ","Hỏa":"Dần"};
export const ELEMENT_GENERATES: Record<string, string> = {Mộc:"Hỏa",Hỏa:"Thổ",Thổ:"Kim",Kim:"Thủy",Thủy:"Mộc"};
export const ELEMENT_CONTROLS: Record<string, string> = {Mộc:"Thổ",Thổ:"Thủy",Thủy:"Hỏa",Hỏa:"Kim",Kim:"Mộc"};
export const STEM_SUPPORT: Record<string, { ThiênQuan: string; ThiênPhúc: string }> = {
  Giáp:{ThiênQuan:"Mùi",ThiênPhúc:"Dậu"},
  Ất:{ThiênQuan:"Thìn",ThiênPhúc:"Thân"},
  Bính:{ThiênQuan:"Tỵ",ThiênPhúc:"Tý"},
  Đinh:{ThiênQuan:"Dần",ThiênPhúc:"Hợi"},
  Mậu:{ThiênQuan:"Mão",ThiênPhúc:"Mão"},
  Kỷ:{ThiênQuan:"Dậu",ThiênPhúc:"Dần"},
  Canh:{ThiênQuan:"Hợi",ThiênPhúc:"Ngọ"},
  Tân:{ThiênQuan:"Dậu",ThiênPhúc:"Tỵ"},
  Nhâm:{ThiênQuan:"Tuất",ThiênPhúc:"Ngọ"},
  Quý:{ThiênQuan:"Ngọ",ThiênPhúc:"Tỵ"}
};
export const STEM_THIEN_TRU: Record<string, string> = {
  Giáp:"Tỵ", Ất:"Ngọ", Bính:"Tý", Đinh:"Tỵ", Mậu:"Ngọ",
  Kỷ:"Thân", Canh:"Dần", Tân:"Ngọ", Nhâm:"Dậu", Quý:"Hợi"
};
export const TRIET_BY_STEM: Record<string, [string, string]> = {
  Giáp:["Thân","Dậu"], Kỷ:["Thân","Dậu"], Ất:["Ngọ","Mùi"], Canh:["Ngọ","Mùi"],
  Bính:["Thìn","Tỵ"], Tân:["Thìn","Tỵ"], Đinh:["Dần","Mão"], Nhâm:["Dần","Mão"],
  Mậu:["Tý","Sửu"], Quý:["Tý","Sửu"]
};
export const LUU_VAN_XUONG: Record<string, string> = {Giáp:"Tỵ",Ất:"Ngọ",Bính:"Thân",Đinh:"Dậu",Mậu:"Thân",Kỷ:"Dậu",Canh:"Hợi",Tân:"Tý",Nhâm:"Dần",Quý:"Mão"};
export const LUU_VAN_KHUC: Record<string, string>  = {Giáp:"Dậu",Ất:"Thân",Bính:"Ngọ",Đinh:"Tỵ",Mậu:"Ngọ",Kỷ:"Tỵ",Canh:"Mão",Tân:"Dần",Nhâm:"Tý",Quý:"Hợi"};
export const LUU_HA_BY_STEM: Record<string, string> = {Giáp:"Dậu",Ất:"Tuất",Bính:"Mùi",Đinh:"Thân",Mậu:"Tỵ",Kỷ:"Ngọ",Canh:"Thìn",Tân:"Mão",Nhâm:"Hợi",Quý:"Dần"};

export function fix(n: number, mod = 12): number {
  return ((n % mod) + mod) % mod;
}

export function stemBranchForYear(year: number): { stem: string; branch: string } {
  return {
    stem: STEMS[fix(year + 6, 10)] ?? "",
    branch: CYCLE_BRANCHES[fix(year + 8, 12)] ?? ""
  };
}

export function stemBranchForLunarMonth(yearStem: string, lunarMonth: number): { stem: string; branch: string } {
  const tigerStem = TIGER_RULE[yearStem] ?? "";
  return {
    stem: STEMS[fix(STEMS.indexOf(tigerStem) + lunarMonth - 1, 10)] ?? "",
    branch: CYCLE_BRANCHES[fix(lunarMonth + 1, 12)] ?? ""
  };
}

export function stemBranchForSolarDay(day: number, month: number, year: number): { stem: string; branch: string } {
  const julianDay = jdFromDate(day, month, year);
  return {
    stem: STEMS[fix(julianDay + 9, 10)] ?? "",
    branch: CYCLE_BRANCHES[fix(julianDay + 1, 12)] ?? ""
  };
}

export function stemForHour(dayStem: string, hourBranch: string): string {
  const tyStemByDay: Record<string, string> = {
    Giáp:"Giáp", Kỷ:"Giáp", Ất:"Bính", Canh:"Bính", Bính:"Mậu",
    Tân:"Mậu", Đinh:"Canh", Nhâm:"Canh", Mậu:"Nhâm", Quý:"Nhâm"
  };
  return STEMS[fix(
    STEMS.indexOf(tyStemByDay[dayStem] ?? "") + HOUR_BRANCHES.indexOf(hourBranch),
    10
  )] ?? "";
}

export function cycleBranchToIndex(branch: string): number {
  return BRANCHES.indexOf(branch);
}

export function getPalaceStem(yearStem: string, branchIndex: number): string {
  const start = TIGER_RULE[yearStem] ?? "";
  return STEMS[fix(STEMS.indexOf(start) + branchIndex, 10)] ?? "";
}

export function getLuIndex(stem: string): number {
  const map: Record<string, string> = {
    Giáp:"Dần", Ất:"Mão", Bính:"Tỵ", Mậu:"Tỵ", Đinh:"Ngọ", Kỷ:"Ngọ",
    Canh:"Thân", Tân:"Dậu", Nhâm:"Hợi", Quý:"Tý"
  };
  return BRANCHES.indexOf(map[stem] ?? "");
}

/** Lộc Tồn palace index by year stem — ChartEngine public surface may re-export. */
export function locTonIndex(stem: string): number {
  return fix(getLuIndex(stem));
}

export function addStar(palaces: ZiweiWorkingPalace[], index: number, name: string, layer: string, source = "natal"): void {
  const branchIndex = fix(index);
  const table = BRIGHTNESS[name];
  const brightness = table ? (table[branchIndex] ?? "") : "";
  const palace = palaces[branchIndex];
  if (!palace) return;
  const exists = palace.stars.some(star => star.name === name && star.source === source);
  if(!exists) palace.stars.push({name, layer, brightness, source});
}

export function addStarAtBranch(palaces: ZiweiWorkingPalace[], branch: string, name: string, layer: string, source = "natal"): void {
  addStar(palaces, BRANCHES.indexOf(branch), name, layer, source);
}

export function addCycle(palaces: ZiweiWorkingPalace[], startIndex: number, names: string[], direction: number, layer: string, source = "natal"): void {
  names.forEach((name, offset) => addStar(palaces, startIndex + offset * direction, name, layer, source));
}
