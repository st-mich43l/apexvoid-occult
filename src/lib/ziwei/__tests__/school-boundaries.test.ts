/**
 * PR #256 — intentional Nam Phái vs Trung Châu Calculation Core boundaries.
 *
 * These tests lock released school differences so later shared extraction
 * cannot silently collapse them. Expected values are frozen literals from
 * current released baseline behavior — not derived from the policy tables
 * under refactor.
 */
import { describe, expect, it } from "vitest";
import type { BirthInput, ChartData, ChartStar } from "@/types/chart";
import { getEngine } from "../chart";

/** Golden-adjacent mid-year fixture; hour Dậu exposes Linh direction divergence. */
const FIXTURE_2013_DAU: BirthInput = {
  solarDate: "15/06/2013",
  birthHour: "Dậu",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

/** Canh Ngọ birth — locks Canh Khôi/Việt, TC majorMutagens, signature stars. */
const FIXTURE_1990_CANH: BirthInput = {
  solarDate: "15/08/1990",
  birthHour: "Ngọ",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function natalStarBranch(chart: ChartData, starName: string): string | null {
  for (const palace of chart.palaces) {
    const hit = (palace.stars ?? []).find(
      (star: ChartStar) =>
        star.name === starName &&
        (star.source === "natal" || star.source === undefined),
    );
    if (hit) return palace.branch;
  }
  return null;
}

function hasNatalStar(chart: ChartData, starName: string): boolean {
  return natalStarBranch(chart, starName) !== null;
}

function hasStarNamed(chart: ChartData, starName: string): boolean {
  return chart.palaces.some((palace) =>
    (palace.stars ?? []).some((star) => star.name === starName),
  );
}

describe("school boundaries — Canh Tứ Hóa (SCHOOL_POLICY)", () => {
  it("Nam Phái Canh Khoa is Thái Âm (frozen)", () => {
    const targets = getEngine("nam-phai")!.tuHoaTargets("Canh");
    expect(targets).toEqual([
      { mutagen: "Lộc", starName: "Thái Dương" },
      { mutagen: "Quyền", starName: "Vũ Khúc" },
      { mutagen: "Khoa", starName: "Thái Âm" },
      { mutagen: "Kỵ", starName: "Thiên Đồng" },
    ]);
  });

  it("Trung Châu Canh Khoa is Thiên Phủ (frozen)", () => {
    const targets = getEngine("trung-chau")!.tuHoaTargets("Canh");
    expect(targets).toEqual([
      { mutagen: "Lộc", starName: "Thái Dương" },
      { mutagen: "Quyền", starName: "Vũ Khúc" },
      { mutagen: "Khoa", starName: "Thiên Phủ" },
      { mutagen: "Kỵ", starName: "Thiên Đồng" },
    ]);
  });
});

describe("school boundaries — Canh Khôi / Việt (SCHOOL_POLICY)", () => {
  it("Nam Phái Canh: Thiên Khôi Ngọ / Thiên Việt Dần", () => {
    const chart = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    expect(chart.yearStem).toBe("Canh");
    expect(natalStarBranch(chart, "Thiên Khôi")).toBe("Ngọ");
    expect(natalStarBranch(chart, "Thiên Việt")).toBe("Dần");
  });

  it("Trung Châu Canh: Thiên Khôi Sửu / Thiên Việt Mùi", () => {
    const chart = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    expect(chart.yearStem).toBe("Canh");
    expect(natalStarBranch(chart, "Thiên Khôi")).toBe("Sửu");
    expect(natalStarBranch(chart, "Thiên Việt")).toBe("Mùi");
  });
});

describe("school boundaries — Linh Tinh direction (SCHOOL_ALGORITHM)", () => {
  it("same input yields Nam Sửu vs TC Mùi for Linh Tinh", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_2013_DAU);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_2013_DAU);
    expect(natalStarBranch(nam, "Linh Tinh")).toBe("Sửu");
    expect(natalStarBranch(tc, "Linh Tinh")).toBe("Mùi");
  });
});

describe("school boundaries — Bác Sĩ direction (SCHOOL_ALGORITHM)", () => {
  it("when directionSign is -1, Nam Lực Sĩ is forward of Bác Sĩ; TC is reverse", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_2013_DAU);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_2013_DAU);
    expect(nam.directionSign).toBe(-1);
    expect(tc.directionSign).toBe(-1);
    expect(natalStarBranch(nam, "Bác Sĩ")).toBe("Tý");
    expect(natalStarBranch(nam, "Lực Sĩ")).toBe("Sửu");
    expect(natalStarBranch(tc, "Bác Sĩ")).toBe("Tý");
    expect(natalStarBranch(tc, "Lực Sĩ")).toBe("Hợi");
  });
});

describe("school boundaries — annualPalace / Tiểu Hạn", () => {
  it("Nam: annualPalace equals smallLimitPalace (Tiểu Hạn)", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_2013_DAU);
    expect(nam.smallLimitPalace).not.toBeNull();
    expect(nam.smallLimitPalace).toBeDefined();
    expect(nam.annualPalace?.branch).toBe(nam.smallLimitPalace!.branch);
    expect(nam.annualPalace?.branch).toBe("Thân");
    expect(nam.annualPalace?.branch).not.toBe(nam.taiTuePalace?.branch);
  });

  it("Trung Châu: annualPalace equals taiTuePalace (Lưu Thái Tuế)", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_2013_DAU);
    expect(tc.annualPalace?.branch).toBe(tc.taiTuePalace?.branch);
    expect(tc.annualPalace?.branch).toBe("Ngọ");
  });

  it("Nam populates smallLimit fields; TC returns null / empty direction", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_2013_DAU);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_2013_DAU);
    expect(nam.smallLimitPalace).not.toBeNull();
    expect(nam.smallLimitStartPalace).not.toBeNull();
    expect(nam.smallLimitDirection).not.toBe("");
    expect(tc.smallLimitPalace).toBeNull();
    expect(tc.smallLimitStartPalace).toBeNull();
    expect(tc.smallLimitDirection).toBe("");
  });
});

describe("school boundaries — Trung Châu trùng bài / signature / majorMutagens", () => {
  it("TC trùng bài fields remain populated; Nam leaves them unset", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    const namUnset = nam.palaces.every(
      (p) => p.majorPalaceName == null && p.annualPalaceName == null,
    );
    expect(namUnset).toBe(true);
    expect(tc.palaces.every((p) => typeof p.majorPalaceName === "string")).toBe(
      true,
    );
    expect(tc.palaces.every((p) => typeof p.annualPalaceName === "string")).toBe(
      true,
    );
    expect(tc.palaces[0]!.majorPalaceName).toBeTruthy();
    expect(tc.palaces[0]!.annualPalaceName).toBeTruthy();
  });

  it("TC signature stars remain present; Nam does not place them", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    for (const name of [
      "Thiên Vu",
      "Thiên Nguyệt",
      "Âm Sát",
      "Nguyệt Giải",
      "Tướng Tinh",
    ] as const) {
      expect(hasNatalStar(tc, name)).toBe(true);
      expect(hasNatalStar(nam, name)).toBe(false);
    }
  });

  it("majorMutagens: TC emits records + ĐV decoration; Nam main pipeline empty", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    expect(nam.majorMutagens ?? []).toEqual([]);
    expect(tc.majorMutagens).toEqual([
      expect.objectContaining({
        source: "major-mutagen",
        mutagen: "Lộc",
        starName: "Thiên Đồng",
      }),
      expect.objectContaining({
        source: "major-mutagen",
        mutagen: "Quyền",
        starName: "Thiên Cơ",
      }),
      expect.objectContaining({
        source: "major-mutagen",
        mutagen: "Khoa",
        starName: "Văn Xương",
      }),
      expect.objectContaining({
        source: "major-mutagen",
        mutagen: "Kỵ",
        starName: "Liêm Trinh",
      }),
    ]);
    expect(hasStarNamed(tc, "ĐV Hóa Lộc")).toBe(true);
    expect(hasStarNamed(tc, "ĐV Hóa Quyền")).toBe(true);
    expect(hasStarNamed(tc, "ĐV Hóa Khoa")).toBe(true);
    expect(hasStarNamed(tc, "ĐV Hóa Kỵ")).toBe(true);
    expect(hasStarNamed(nam, "ĐV Hóa Lộc")).toBe(false);
  });
});
