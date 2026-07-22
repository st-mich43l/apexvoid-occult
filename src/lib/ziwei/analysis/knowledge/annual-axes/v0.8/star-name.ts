/**
 * Exact star-name helpers for V0.8 knowledge validation.
 * Kept inside knowledge/ to avoid circular imports with the scorer.
 */

const SPELLING_ALIASES: ReadonlyMap<string, string> = new Map([
  ["Hoá Kỵ", "Hóa Kỵ"],
  ["Hoá Lộc", "Hóa Lộc"],
  ["Hoá Quyền", "Hóa Quyền"],
  ["Hoá Khoa", "Hóa Khoa"],
  ["Lưu Hoá Kỵ", "Lưu Hóa Kỵ"],
  ["Lưu Hoá Lộc", "Lưu Hóa Lộc"],
  ["Lưu Hoá Quyền", "Lưu Hóa Quyền"],
  ["Lưu Hoá Khoa", "Lưu Hóa Khoa"],
  ["Tả Phụ", "Tả Phù"],
  ["Hỉ Thần", "Hỷ Thần"],
  ["Thiên Khôi (Lưu)", "Lưu Thiên Khôi"],
  ["Thiên Việt (Lưu)", "Lưu Thiên Việt"],
  ["Lưu Khôi", "Lưu Thiên Khôi"],
  ["Lưu Việt", "Lưu Thiên Việt"],
]);

export function exactCanonicalStarName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return SPELLING_ALIASES.get(trimmed) ?? trimmed;
}

export function isAnnualOnlyStarName(exactName: string): boolean {
  if (exactName === "Lưu Hà") return false;
  return /^Lưu\s+/.test(exactName);
}
