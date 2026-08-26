/**
 * Các hàm liên quan đến múi giờ, kinh độ và True Solar Time.
 *
 * Calendar must not import Bát Tự conventions — pass explicit option bags.
 */

/**
 * LỊCH SỬ MÚI GIỜ VIỆT NAM (Dành cho việc tra cứu):
 *
 * - Trước 01/05/1911: Mỗi địa phương dùng giờ mặt trời riêng. Sài Gòn dùng UTC+7:06:30.
 * - 01/05/1911 - 31/12/1942: Cả nước dùng giờ Đông Dương: UTC+7:00.
 * - 01/01/1943 - 31/03/1945: Dùng múi giờ Tokyo: UTC+8:00.
 * - 01/04/1945 - 01/09/1945: Dùng UTC+9:00.
 * - 02/09/1945 - nay (Miền Bắc): Đa phần dùng UTC+7:00.
 * - 01/07/1955 - 31/12/1959 (Miền Nam): UTC+7:00.
 * - 01/01/1960 - 12/06/1975 (Miền Nam): UTC+8:00.
 * - Từ 13/06/1975 - nay: Cả nước thống nhất UTC+7:00.
 *
 * Do sự phức tạp này, engine KHÔNG tự đoán múi giờ. Người dùng phải cung cấp `utcOffsetMinutes` rõ ràng.
 */

export interface TrueSolarTimeOptions {
  useEquationOfTime?: boolean;
}

export interface HourBranchOptions {
  dayBoundary?: "zi23" | "midnight";
  earlyLateZi?: boolean;
}

const DEFAULT_TST: Required<TrueSolarTimeOptions> = { useEquationOfTime: false };
const DEFAULT_HOUR: Required<HourBranchOptions> = {
  dayBoundary: "zi23",
  earlyLateZi: false,
};

/**
 * Đồng hồ dân sự tại múi giờ khai sinh: các trường UTC của Date trả về
 * phản ánh giờ:phút:ngày trên đồng hồ (không phải TST).
 * `instant` là thời điểm UTC thật.
 */
export function civilClockDate(instant: Date, utcOffsetMinutes: number): Date {
  return new Date(instant.getTime() + utcOffsetMinutes * 60 * 1000);
}

/**
 * True Solar Time — chỉ metadata / đối chiếu thiên văn.
 * Trụ giờ Bát Tự an theo đồng hồ (`civilClockDate`), khớp Tử Vi và mẫu.
 */
export function getTrueSolarTime(
  date: Date,
  longitude: number,
  options: TrueSolarTimeOptions = DEFAULT_TST,
): Date {
  const longitudeOffsetMinutes = longitude * 4;
  let equationOfTimeMinutes = 0;
  const useEot = options.useEquationOfTime ?? DEFAULT_TST.useEquationOfTime;

  if (useEot) {
    const jdn = date.getTime() / 86400000 + 2440587.5;
    const T = (jdn - 2451545.0) / 36525.0;
    const dr = Math.PI / 180;

    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;

    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const epsilon =
      23.439291 - 0.013004167 * T - 0.00000016389 * T * T + 0.0000005036 * T * T * T;

    const y = Math.pow(Math.tan((epsilon / 2) * dr), 2);
    const L0_rad = L0 * dr;
    const M_rad = M * dr;

    const eotRad =
      y * Math.sin(2 * L0_rad) -
      2 * e * Math.sin(M_rad) +
      4 * e * y * Math.sin(M_rad) * Math.cos(2 * L0_rad) -
      0.5 * y * y * Math.sin(4 * L0_rad) -
      1.25 * e * e * Math.sin(2 * M_rad);

    equationOfTimeMinutes = eotRad * 4 * (180 / Math.PI);
  }

  const totalCorrectionMs = (longitudeOffsetMinutes + equationOfTimeMinutes) * 60 * 1000;
  return new Date(date.getTime() + totalCorrectionMs);
}

/**
 * Tìm chỉ số Địa Chi (0-11 tương ứng Tý-Hợi) của giờ.
 * Và xác định xem giờ này có được tính là ngày hôm sau hay không.
 *
 * `solarTime` must already be a civil-clock Date (UTC fields = civil clock).
 */
export function getHourBranch(
  solarTime: Date,
  options: HourBranchOptions = DEFAULT_HOUR,
): { branchIndex: number; isNextDay: boolean } {
  const hours = solarTime.getUTCHours();
  const minutes = solarTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const branchIndex = Math.floor(((totalMinutes + 60) % 1440) / 120);
  let isNextDay = false;

  const dayBoundary = options.dayBoundary ?? DEFAULT_HOUR.dayBoundary;
  const earlyLateZi = options.earlyLateZi ?? DEFAULT_HOUR.earlyLateZi;

  if (dayBoundary === "midnight") {
    if (earlyLateZi) {
      if (hours === 23) {
        isNextDay = false;
      }
    } else if (hours === 23) {
      isNextDay = false;
    }
  } else if (hours === 23) {
    // dayBoundary === "zi23" (Mặc định Bát Tự)
    isNextDay = true;
  }

  return { branchIndex, isNextDay };
}
