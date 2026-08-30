/**
 * Trung Châu static school policy (data only).
 * Current released behavior — not a doctrine certification.
 * ERQ-005 (Canh Tứ Hóa Khoa) remains unresolved by expert review.
 */
import type { KhoiVietTable, TuHoaTable } from "./policy-types";

export const TRUNG_CHAU_TU_HOA = {
  Giáp: { Lộc: "Liêm Trinh", Quyền: "Phá Quân", Khoa: "Vũ Khúc", Kỵ: "Thái Dương" },
  Ất: { Lộc: "Thiên Cơ", Quyền: "Thiên Lương", Khoa: "Tử Vi", Kỵ: "Thái Âm" },
  Bính: { Lộc: "Thiên Đồng", Quyền: "Thiên Cơ", Khoa: "Văn Xương", Kỵ: "Liêm Trinh" },
  Đinh: { Lộc: "Thái Âm", Quyền: "Thiên Đồng", Khoa: "Thiên Cơ", Kỵ: "Cự Môn" },
  Mậu: { Lộc: "Tham Lang", Quyền: "Thái Âm", Khoa: "Hữu Bật", Kỵ: "Thiên Cơ" },
  Kỷ: { Lộc: "Vũ Khúc", Quyền: "Tham Lang", Khoa: "Thiên Lương", Kỵ: "Văn Khúc" },
  Canh: { Lộc: "Thái Dương", Quyền: "Vũ Khúc", Khoa: "Thiên Phủ", Kỵ: "Thiên Đồng" },
  Tân: { Lộc: "Cự Môn", Quyền: "Thái Dương", Khoa: "Văn Khúc", Kỵ: "Văn Xương" },
  Nhâm: { Lộc: "Thiên Lương", Quyền: "Tử Vi", Khoa: "Tả Phụ", Kỵ: "Vũ Khúc" },
  Quý: { Lộc: "Phá Quân", Quyền: "Cự Môn", Khoa: "Thái Âm", Kỵ: "Tham Lang" },
} as const satisfies TuHoaTable;

export const TRUNG_CHAU_KHOI_VIET = {
  Giáp: ["Sửu", "Mùi"],
  Ất: ["Tý", "Thân"],
  Bính: ["Hợi", "Dậu"],
  Đinh: ["Hợi", "Dậu"],
  Mậu: ["Sửu", "Mùi"],
  Kỷ: ["Tý", "Thân"],
  Canh: ["Sửu", "Mùi"],
  Tân: ["Ngọ", "Dần"],
  Nhâm: ["Mão", "Tỵ"],
  Quý: ["Mão", "Tỵ"],
} as const satisfies KhoiVietTable;
