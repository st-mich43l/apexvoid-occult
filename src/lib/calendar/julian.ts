/**
 * Chuyển đổi ngày dương lịch sang Julian Day (JDN) và ngược lại.
 * Dùng chung cho Tử Vi và Bát Tự.
 */

/**
 * Tính số nguyên Julian Day Number (JDN) từ ngày dương lịch (lúc 12h trưa UTC).
 * Giữ nguyên logic của tu-vi-engine cũ để không đổi output.
 */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      32083;
  }
  return jd;
}
