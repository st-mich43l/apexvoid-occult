import { getDayPillar, getHourStem, getMonthStem, Pillar, STEM_POLARITY, STEMS, BRANCHES } from "../calendar/sexagenary";
import { civilClockDate, getHourBranch, getTrueSolarTime } from "../calendar/timezone";
import { findExactTermJd, getMonthBranchAt } from "../calendar/solar-terms";
import { BaziConventions, DEFAULT_CONVENTIONS } from "./conventions";
import { BaziChart } from "./types";

/**
 * Lấy Can Chi năm, chú ý chuyển năm Bát Tự ở Lập Xuân.
 */
function getYearPillar(date: Date): { pillar: Pillar, liChunDate: Date } {
  const currentYear = date.getUTCFullYear();
  // Lập xuân của năm nay
  const liChunJd = findExactTermJd(currentYear, 315);
  const liChunDate = new Date((liChunJd - 2440587.5) * 86400000);
  
  let baziYear = currentYear;
  if (date.getTime() < liChunDate.getTime()) {
    // Nếu trước Lập Xuân, tính là năm ngoái
    baziYear -= 1;
  }
  
  // Mốc năm Giáp Tý (1984, 1924, ...)
  const offset = baziYear - 4;
  let stemIndex = offset % 10;
  if (stemIndex < 0) stemIndex += 10;
  
  let branchIndex = offset % 12;
  if (branchIndex < 0) branchIndex += 12;
  
  return {
    pillar: { stem: STEMS[stemIndex] ?? "", branch: BRANCHES[branchIndex] ?? "" },
    liChunDate
  };
}

export function calculateBaziPillars(
  date: Date,
  longitude: number,
  utcOffsetMinutes: number,
  gender: "M" | "F",
  conventions: BaziConventions = DEFAULT_CONVENTIONS
): Pick<BaziChart, "year" | "month" | "day" | "hour" | "gender" | "longitude" | "utcOffsetMinutes" | "isYangGender" | "metadata"> {
  // TST chỉ ghi metadata — không an trụ giờ.
  const tst = getTrueSolarTime(date, longitude, {
    useEquationOfTime: conventions.useEquationOfTime,
  });
  const totalCorrectionMs = tst.getTime() - date.getTime();
  const equationOfTimeMinutes = totalCorrectionMs / 60000 - longitude * 4;

  const clock = civilClockDate(date, utcOffsetMinutes);
  const clockMs = clock.getTime();

  // 2. Trụ Năm — mốc Lập Xuân thiên văn so với instant UTC.
  const { pillar: yearPillar, liChunDate } = getYearPillar(date);

  // 3. Trụ Tháng
  const monthBranchIndex = getMonthBranchAt(date);
  const yearStemIndex = STEMS.indexOf(yearPillar.stem);
  const monthStemIndex = getMonthStem(yearStemIndex, monthBranchIndex);
  const monthPillar: Pillar = {
    stem: STEMS[monthStemIndex] ?? "",
    branch: BRANCHES[monthBranchIndex] ?? "",
  };

  // 4. Trụ Giờ — đồng hồ dân sự (Dậu đến 18:59), khớp Tử Vi.
  const { branchIndex: hourBranchIndex, isNextDay } = getHourBranch(clock, {
    dayBoundary: conventions.dayBoundary,
    earlyLateZi: conventions.earlyLateZi,
  });

  // 5. Trụ Ngày — ngày đồng hồ + ranh Tý 23:00.
  const clockDayJd = (clockMs + (isNextDay ? 86400000 : 0)) / 86400000 + 2440587.5;
  const dayPillar = getDayPillar(clockDayJd + 0.5); 
  
  // 6. Hoàn thiện Trụ Giờ
  const dayStemIndex = STEMS.indexOf(dayPillar.stem);
  const hourStemIndex = getHourStem(dayStemIndex, hourBranchIndex);
  const hourPillar: Pillar = { stem: STEMS[hourStemIndex] ?? "", branch: BRANCHES[hourBranchIndex] ?? "" };
  
  // 7. Âm dương nam nữ
  const stemPol = STEM_POLARITY[yearPillar.stem] ?? 1;
  let isYangGender = false;
  if ((stemPol > 0 && gender === "M") || (stemPol < 0 && gender === "F")) {
    isYangGender = true; // Dương nam, Âm nữ
  } else {
    isYangGender = false; // Âm nam, Dương nữ
  }
  
  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    gender,
    longitude,
    utcOffsetMinutes,
    isYangGender,
    metadata: {
      trueSolarTime: tst,
      liChunDate,
      equationOfTimeMinutes
    }
  };
}
