import { BRANCHES, STEM_POLARITY } from "../calendar/sexagenary";
import { getSolarLongitude } from "../calendar/solar-terms";
import { civilClockDate } from "../calendar/timezone";
import { solarToLunar } from "../ziwei/engine-nam-phai";
import { getElement } from "./elements";

/** 24 tiết khí, index = floor(kinh độ / 15). Xuân Phân = 0°. */
const JIEQI_NAMES = [
  "Xuân Phân",
  "Thanh Minh",
  "Cốc Vũ",
  "Lập Hạ",
  "Tiểu Mãn",
  "Mang Chủng",
  "Hạ Chí",
  "Tiểu Thử",
  "Đại Thử",
  "Lập Thu",
  "Xử Thử",
  "Bạch Lộ",
  "Thu Phân",
  "Hàn Lộ",
  "Sương Giáng",
  "Lập Đông",
  "Tiểu Tuyết",
  "Đại Tuyết",
  "Đông Chí",
  "Tiểu Hàn",
  "Đại Hàn",
  "Lập Xuân",
  "Vũ Thủy",
  "Kinh Trập",
] as const;

export interface CivilCalendarDisplay {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  clockHour: number;
  clockMinute: number;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarLeap: boolean;
  jieqi: string;
  hourBranch: string;
}

export function jieqiAt(instant: Date): string {
  const jd = instant.getTime() / 86400000 + 2440587.5;
  const lon = getSolarLongitude(jd);
  const idx = Math.floor(lon / 15) % 24;
  return JIEQI_NAMES[idx] ?? "";
}

function polarityMark(char: string): string {
  if (STEM_POLARITY[char] !== undefined) {
    return (STEM_POLARITY[char] ?? 0) > 0 ? "+" : "−";
  }
  const i = BRANCHES.indexOf(char);
  if (i < 0) return "";
  return i % 2 === 0 ? "+" : "−";
}

export function polarityElementLabel(char: string): string {
  return `${polarityMark(char)}${getElement(char)}`;
}

export function buildCivilCalendarDisplay(
  instant: Date,
  utcOffsetMinutes: number,
  hourBranch: string,
): CivilCalendarDisplay {
  const clock = civilClockDate(instant, utcOffsetMinutes);
  const solarYear = clock.getUTCFullYear();
  const solarMonth = clock.getUTCMonth() + 1;
  const solarDay = clock.getUTCDate();
  const tzHours = utcOffsetMinutes / 60;
  const lunar = solarToLunar(solarDay, solarMonth, solarYear, tzHours);
  return {
    solarYear,
    solarMonth,
    solarDay,
    clockHour: clock.getUTCHours(),
    clockMinute: clock.getUTCMinutes(),
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    lunarLeap: lunar.leap !== 0,
    jieqi: jieqiAt(instant),
    hourBranch,
  };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
