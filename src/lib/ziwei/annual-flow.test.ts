import { describe, expect, it } from "vitest";
import {
  getAnnualMajorFortuneIndex,
  getFirstFlowMonthIndex,
  getFlowMonthBaseIndex,
  getSmallLimitBranchRing,
  getSmallLimitIndex,
  PALACE_BRANCHES,
} from "./annual-flow";

describe("Tiểu Hạn và Lưu Nguyệt", () => {
  it("khớp lá số mẫu Tân Mùi Âm Nữ, năm Bính Ngọ 2026", () => {
    const smallLimitIndex = getSmallLimitIndex("Mùi", "female", "Ngọ");
    expect(PALACE_BRANCHES[smallLimitIndex]).toBe("Dần");

    const monthOneIndex = getFirstFlowMonthIndex(
      smallLimitIndex,
      8,
      9, // giờ Dậu
    );
    expect(PALACE_BRANCHES[monthOneIndex]).toBe("Thìn");

    expect(getSmallLimitBranchRing("Mùi", "female")).toEqual([
      "Ngọ",
      "Tỵ",
      "Thìn",
      "Mão",
      "Dần",
      "Sửu",
      "Tý",
      "Hợi",
      "Tuất",
      "Dậu",
      "Thân",
      "Mùi",
    ]);
  });

  it("tách Lưu Niên khỏi Tiểu Hạn/Lưu Niên Đại Vận", () => {
    const args = ["Mùi", "female", "Ngọ"] as const;
    const luuNienBase = getFlowMonthBaseIndex("luu-nien", ...args);
    const tieuHanBase = getFlowMonthBaseIndex("tieu-han", ...args);
    const daiVanBase = getFlowMonthBaseIndex("dai-van", ...args);

    expect(PALACE_BRANCHES[luuNienBase]).toBe("Ngọ");
    expect(PALACE_BRANCHES[tieuHanBase]).toBe("Dần");
    expect(daiVanBase).toBe(tieuHanBase);

    expect(
      PALACE_BRANCHES[getFirstFlowMonthIndex(luuNienBase, 8, 9)],
    ).toBe("Thân");
    expect(
      PALACE_BRANCHES[getFirstFlowMonthIndex(tieuHanBase, 8, 9)],
    ).toBe("Thìn");
  });
});

describe("Lưu Niên Đại Vận", () => {
  it("đi đúng nhịp Dương Nam/Âm Nữ", () => {
    const sequence = Array.from({ length: 10 }, (_, offset) =>
      PALACE_BRANCHES[
        getAnnualMajorFortuneIndex(4, 22, 22 + offset, 1)
      ],
    );
    expect(sequence).toEqual([
      "Ngọ",
      "Tý",
      "Hợi",
      "Tý",
      "Sửu",
      "Dần",
      "Mão",
      "Thìn",
      "Tỵ",
      "Ngọ",
    ]);
  });

  it("đi đúng nhịp Âm Nam/Dương Nữ", () => {
    const sequence = Array.from({ length: 10 }, (_, offset) =>
      PALACE_BRANCHES[
        getAnnualMajorFortuneIndex(10, 13, 13 + offset, -1)
      ],
    );
    expect(sequence).toEqual([
      "Tý",
      "Ngọ",
      "Mùi",
      "Ngọ",
      "Tỵ",
      "Thìn",
      "Mão",
      "Dần",
      "Sửu",
      "Tý",
    ]);
  });
});

const CYCLE_BRANCHES_LOCAL = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

describe("Tiểu Hạn exhaustive invariants", () => {
  const genders = ["male", "female"] as const;
  it("index always 0..11; ring is a permutation of 12 branches", () => {
    for (const birth of CYCLE_BRANCHES_LOCAL) {
      for (const gender of genders) {
        const ring = getSmallLimitBranchRing(birth, gender);
        expect(ring).toHaveLength(12);
        expect(new Set(ring).size).toBe(12);
        for (const annual of CYCLE_BRANCHES_LOCAL) {
          const idx = getSmallLimitIndex(birth, gender, annual);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
        const start = getSmallLimitIndex(birth, gender, birth);
        const after12 = getSmallLimitIndex(birth, gender, birth);
        expect(after12).toBe(start);
      }
    }
  });
});

describe("Lưu Nguyệt index bounds", () => {
  it("getFirstFlowMonthIndex stays in 0..11 for all valid inputs", () => {
    for (let annual = 0; annual < 12; annual++) {
      for (let month = 1; month <= 12; month++) {
        for (let hour = 0; hour < 12; hour++) {
          const idx = getFirstFlowMonthIndex(annual, month, hour);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
