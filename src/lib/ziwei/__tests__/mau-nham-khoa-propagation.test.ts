/**
 * PR #262 — deterministic propagation of APPROVE_MAU_AND_NHAM through
 * natal / annual / major / PhiFlow / monthly / decorations.
 * Algorithms unchanged; only school-policy table cells changed.
 */
import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/types/chart";
import { getEngine } from "../chart";
import { getTuHoaTargets } from "../calculation/shared-mutagens";
import { stemBranchForLunarMonth } from "../calculation/shared-primitives";
import { resolveMajorFortuneMutagensForStem } from "../calculation/resolve-major-fortune-mutagens";
import { TRUNG_CHAU_TU_HOA } from "../schools/trung-chau-policy";
import { NAM_PHAI_TU_HOA } from "../schools/nam-phai-policy";

const FIXTURE_MAU_NATAL: BirthInput = {
  solarDate: "15/06/2018",
  birthHour: "Ngọ",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const FIXTURE_NHAM_NATAL: BirthInput = {
  solarDate: "15/06/2022",
  birthHour: "Ngọ",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

/** Major Fortune active palace stem Mậu (golden hour-branch-Mão). */
const FIXTURE_MAJOR_MAU: BirthInput = {
  solarDate: "10/03/1995",
  birthHour: "Mão",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function khoaStar(records: Array<{ mutagen: string; starName: string }> | undefined): string {
  return records?.find((r) => r.mutagen === "Khoa")?.starName ?? "";
}

function hasDecorationInPalace(
  chart: { palaces: Array<{ branch: string; stars?: Array<{ name: string }> }> },
  palaceBranch: string,
  decorationName: string,
): boolean {
  const palace = chart.palaces.find((p) => p.branch === palaceBranch);
  return (palace?.stars ?? []).some((s) => s.name === decorationName);
}

describe("PR262 propagation — natal Khoa", () => {
  it("TC natal Mậu → Hóa Khoa = Thái Dương; Nam unchanged Hữu Bật", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_MAU_NATAL);
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_MAU_NATAL);
    expect(tc.yearStem).toBe("Mậu");
    expect(khoaStar(tc.natalMutagens)).toBe("Thái Dương");
    expect(khoaStar(nam.natalMutagens)).toBe("Hữu Bật");
    const khoaPalace = tc.natalMutagens?.find((r) => r.mutagen === "Khoa")?.palace?.branch;
    expect(khoaPalace).toBeTruthy();
    expect(hasDecorationInPalace(tc, khoaPalace!, "Hóa Khoa")).toBe(true);
  });

  it("TC natal Nhâm → Hóa Khoa = Thiên Phủ; Nam unchanged Tả Phụ", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_NHAM_NATAL);
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_NHAM_NATAL);
    expect(tc.yearStem).toBe("Nhâm");
    expect(khoaStar(tc.natalMutagens)).toBe("Thiên Phủ");
    expect(khoaStar(nam.natalMutagens)).toBe("Tả Phụ");
    const khoaPalace = tc.natalMutagens?.find((r) => r.mutagen === "Khoa")?.palace?.branch;
    expect(khoaPalace).toBeTruthy();
    expect(hasDecorationInPalace(tc, khoaPalace!, "Hóa Khoa")).toBe(true);
  });
});

describe("PR262 propagation — annual Khoa", () => {
  it("TC annual stem Mậu → Lưu Hóa Khoa = Thái Dương", () => {
    const tc = getEngine("trung-chau")!.calculate({
      ...FIXTURE_MAU_NATAL,
      annualYear: "2028",
    });
    expect(tc.annualStem).toBe("Mậu");
    expect(khoaStar(tc.annualMutagens)).toBe("Thái Dương");
    const khoaPalace = tc.annualMutagens?.find((r) => r.mutagen === "Khoa")?.palace?.branch;
    expect(khoaPalace).toBeTruthy();
    expect(hasDecorationInPalace(tc, khoaPalace!, "Lưu Hóa Khoa")).toBe(true);
  });

  it("TC annual stem Nhâm → Lưu Hóa Khoa = Thiên Phủ", () => {
    const tc = getEngine("trung-chau")!.calculate({
      ...FIXTURE_NHAM_NATAL,
      annualYear: "2032",
    });
    expect(tc.annualStem).toBe("Nhâm");
    expect(khoaStar(tc.annualMutagens)).toBe("Thiên Phủ");
    const khoaPalace = tc.annualMutagens?.find((r) => r.mutagen === "Khoa")?.palace?.branch;
    expect(khoaPalace).toBeTruthy();
    expect(hasDecorationInPalace(tc, khoaPalace!, "Lưu Hóa Khoa")).toBe(true);
  });
});

describe("PR262 propagation — Major Fortune Khoa", () => {
  it("active Major Fortune palace stem Mậu uses corrected Khoa via table", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_MAJOR_MAU);
    const active = tc.palaces.find((p) => p.majorFortune?.active);
    expect(active?.stem).toBe("Mậu");
    expect(khoaStar(tc.majorMutagens)).toBe("Thái Dương");
    const viaResolver = resolveMajorFortuneMutagensForStem(
      "trung-chau",
      "Mậu",
      tc.palaces,
    );
    expect(khoaStar(viaResolver)).toBe("Thái Dương");
  });
});

describe("PR262 propagation — PhiFlow Khoa", () => {
  it("Mậu source palace: Khoa → Thái Dương; Lộc/Quyền/Kỵ unchanged", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_MAU_NATAL);
    const mauSource = tc.palaces.find((p) => p.stem === "Mậu");
    expect(mauSource).toBeTruthy();
    const flows = (tc.phiFlows ?? []).filter((f) => f.source.branch === mauSource!.branch);
    expect(flows).toHaveLength(4);
    const byMutagen = Object.fromEntries(flows.map((f) => [f.mutagen, f]));
    expect(byMutagen.Lộc?.starName).toBe("Tham Lang");
    expect(byMutagen.Quyền?.starName).toBe("Thái Âm");
    expect(byMutagen.Khoa?.starName).toBe("Thái Dương");
    expect(byMutagen.Kỵ?.starName).toBe("Thiên Cơ");
    const thaiDuongPalace = tc.palaces.find((p) =>
      (p.stars ?? []).some((s) => s.name === "Thái Dương"),
    );
    expect(byMutagen.Khoa?.target?.branch).toBe(thaiDuongPalace?.branch);
  });

  it("Nhâm source palace: Khoa → Thiên Phủ; Lộc/Quyền/Kỵ unchanged", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_NHAM_NATAL);
    const nhamSource = tc.palaces.find((p) => p.stem === "Nhâm");
    expect(nhamSource).toBeTruthy();
    const flows = (tc.phiFlows ?? []).filter((f) => f.source.branch === nhamSource!.branch);
    expect(flows).toHaveLength(4);
    const byMutagen = Object.fromEntries(flows.map((f) => [f.mutagen, f]));
    expect(byMutagen.Lộc?.starName).toBe("Thiên Lương");
    expect(byMutagen.Quyền?.starName).toBe("Tử Vi");
    expect(byMutagen.Khoa?.starName).toBe("Thiên Phủ");
    expect(byMutagen.Kỵ?.starName).toBe("Vũ Khúc");
    const thienPhuPalace = tc.palaces.find((p) =>
      (p.stars ?? []).some((s) => s.name === "Thiên Phủ"),
    );
    expect(byMutagen.Khoa?.target?.branch).toBe(thienPhuPalace?.branch);
  });
});

describe("PR262 propagation — monthly calendar stem Khoa", () => {
  it("Mậu calendar-stem month resolves Khoa Thái Dương via policy table", () => {
    const { stem } = stemBranchForLunarMonth("Giáp", 3);
    expect(stem).toBe("Mậu");
    const khoa = getTuHoaTargets(TRUNG_CHAU_TU_HOA, stem).find((t) => t.mutagen === "Khoa");
    expect(khoa?.starName).toBe("Thái Dương");
    expect(
      getTuHoaTargets(NAM_PHAI_TU_HOA, stem).find((t) => t.mutagen === "Khoa")?.starName,
    ).toBe("Hữu Bật");
  });

  it("Nhâm calendar-stem month resolves Khoa Thiên Phủ via policy table", () => {
    const { stem } = stemBranchForLunarMonth("Giáp", 7);
    expect(stem).toBe("Nhâm");
    const khoa = getTuHoaTargets(TRUNG_CHAU_TU_HOA, stem).find((t) => t.mutagen === "Khoa");
    expect(khoa?.starName).toBe("Thiên Phủ");
    expect(
      getTuHoaTargets(NAM_PHAI_TU_HOA, stem).find((t) => t.mutagen === "Khoa")?.starName,
    ).toBe("Tả Phụ");
  });
});

describe("PR262 propagation — geometry invariance smoke", () => {
  it("palace branches / Mệnh / Thân unchanged vs Nam on shared fixture geometry keys", () => {
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_MAU_NATAL);
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_MAU_NATAL);
    expect(tc.palaces.map((p) => p.branch)).toEqual(nam.palaces.map((p) => p.branch));
    expect(tc.palaces.map((p) => p.index)).toEqual(nam.palaces.map((p) => p.index));
    expect(tc.menhPalace?.branch).toBe(nam.menhPalace?.branch);
    expect(tc.thanPalace?.branch).toBe(nam.thanPalace?.branch);
  });
});
