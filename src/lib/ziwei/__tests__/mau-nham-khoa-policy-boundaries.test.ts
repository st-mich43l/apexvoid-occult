/**
 * PR #262 — lock APPROVE_MAU_AND_NHAM doctrine boundaries.
 *
 * Commit-1 characterization: pre-correction runtime + approved two-cell delta.
 * Propagation / post-correction assertions land in a later commit.
 */
import { describe, expect, it } from "vitest";
import type { TuHoaTable } from "../schools/policy-types";
import { NAM_PHAI_TU_HOA } from "../schools/nam-phai-policy";
import { TRUNG_CHAU_TU_HOA } from "../schools/trung-chau-policy";
import { getTuHoaTargets } from "../calculation/shared-mutagens";

/** Frozen pre-PR#262 released Trung Châu Tứ Hóa (historical baseline). */
export const PRE_CORRECTION_TRUNG_CHAU_TU_HOA = {
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

/** Approved post-correction table under APPROVE_MAU_AND_NHAM. */
export const APPROVED_TRUNG_CHAU_TU_HOA = {
  ...PRE_CORRECTION_TRUNG_CHAU_TU_HOA,
  Mậu: { ...PRE_CORRECTION_TRUNG_CHAU_TU_HOA.Mậu, Khoa: "Thái Dương" },
  Nhâm: { ...PRE_CORRECTION_TRUNG_CHAU_TU_HOA.Nhâm, Khoa: "Thiên Phủ" },
} as const satisfies TuHoaTable;

function cellDiffs(
  a: TuHoaTable,
  b: TuHoaTable,
): Array<{ stem: string; mutagen: string; from: string; to: string }> {
  const diffs: Array<{ stem: string; mutagen: string; from: string; to: string }> = [];
  for (const stem of Object.keys(a) as Array<keyof TuHoaTable>) {
    for (const mutagen of ["Lộc", "Quyền", "Khoa", "Kỵ"] as const) {
      if (a[stem][mutagen] !== b[stem][mutagen]) {
        diffs.push({
          stem,
          mutagen,
          from: a[stem][mutagen],
          to: b[stem][mutagen],
        });
      }
    }
  }
  return diffs;
}

function khoa(table: TuHoaTable, stem: string): string {
  return getTuHoaTargets(table, stem).find((t) => t.mutagen === "Khoa")?.starName ?? "";
}

describe("APPROVE_MAU_AND_NHAM — exactly-two-cell invariant", () => {
  it("approved table differs from pre-correction in exactly Mậu.Khoa and Nhâm.Khoa", () => {
    const diffs = cellDiffs(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, APPROVED_TRUNG_CHAU_TU_HOA);
    expect(diffs).toHaveLength(2);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { stem: "Mậu", mutagen: "Khoa", from: "Hữu Bật", to: "Thái Dương" },
        { stem: "Nhâm", mutagen: "Khoa", from: "Tả Phụ", to: "Thiên Phủ" },
      ]),
    );
  });

  it("approved cells and Canh no-change", () => {
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Thái Dương");
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Thiên Phủ");
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
    expect(khoa(PRE_CORRECTION_TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
  });

  it("representative surrounding cells remain identical", () => {
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Mậu.Lộc).toBe("Tham Lang");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Mậu.Quyền).toBe("Thái Âm");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Mậu.Kỵ).toBe("Thiên Cơ");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Nhâm.Lộc).toBe("Thiên Lương");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Nhâm.Quyền).toBe("Tử Vi");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Nhâm.Kỵ).toBe("Vũ Khúc");
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Kỷ.Khoa).toBe(
      PRE_CORRECTION_TRUNG_CHAU_TU_HOA.Kỷ.Khoa,
    );
    expect(APPROVED_TRUNG_CHAU_TU_HOA.Tân.Khoa).toBe(
      PRE_CORRECTION_TRUNG_CHAU_TU_HOA.Tân.Khoa,
    );
  });
});

describe("APPROVE_MAU_AND_NHAM — school boundary (intended divergence)", () => {
  it("Nam Phái Mậu/Nhâm Khoa remain Hữu Bật / Tả Phụ", () => {
    expect(khoa(NAM_PHAI_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoa(NAM_PHAI_TU_HOA, "Nhâm")).toBe("Tả Phụ");
  });

  it("approved Trung Châu diverges from Nam on Mậu/Nhâm Khoa only among Khoa cells", () => {
    expect(khoa(NAM_PHAI_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Thái Dương");
    expect(khoa(NAM_PHAI_TU_HOA, "Nhâm")).toBe("Tả Phụ");
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Thiên Phủ");
    expect(khoa(APPROVED_TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
    expect(khoa(NAM_PHAI_TU_HOA, "Canh")).toBe("Thái Âm");
  });
});

describe("APPROVE_MAU_AND_NHAM — pre-migration released runtime lock", () => {
  it("released TRUNG_CHAU_TU_HOA still matches pre-correction baseline before policy commit", () => {
    // This assertion flips in the policy-fix commit to the approved table.
    expect(cellDiffs(TRUNG_CHAU_TU_HOA, PRE_CORRECTION_TRUNG_CHAU_TU_HOA)).toHaveLength(0);
    expect(khoa(TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoa(TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Tả Phụ");
    expect(khoa(TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
  });
});
