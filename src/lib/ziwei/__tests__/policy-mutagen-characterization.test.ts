/**
 * PR #257 — lock school policy projection and mutagen resolution before extraction.
 *
 * Expectations are frozen literals from released baseline behavior — not derived
 * from the policy tables or helpers under refactor.
 */
import { describe, expect, it } from "vitest";
import type { BirthInput, ChartPalace, ChartStar } from "@/types/chart";
import { getEngine } from "../chart";
import { resolveMajorFortuneMutagensForStem } from "../calculation/resolve-major-fortune-mutagens";

const FIXTURE_1990_CANH: BirthInput = {
  solarDate: "15/08/1990",
  birthHour: "Ngọ",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function slimMutagens(
  records:
    | Array<{
        source?: string;
        mutagen: string;
        starName: string;
        palace?: { branch?: string } | null;
      }>
    | undefined,
) {
  return (records ?? []).map((r) => ({
    source: r.source,
    mutagen: r.mutagen,
    starName: r.starName,
    palaceBranch: r.palace?.branch ?? null,
  }));
}

function palaceShell(
  index: number,
  branch: string,
  stars: ChartStar[],
): ChartPalace {
  return {
    index,
    branch,
    name: "Mệnh",
    han: "",
    stem: "Giáp",
    stars,
  };
}

describe("policy / mutagen characterization — tuHoaTargets", () => {
  it("Nam Canh order Lộc→Quyền→Khoa→Kỵ with Khoa Thái Âm", () => {
    expect(getEngine("nam-phai")!.tuHoaTargets("Canh")).toEqual([
      { mutagen: "Lộc", starName: "Thái Dương" },
      { mutagen: "Quyền", starName: "Vũ Khúc" },
      { mutagen: "Khoa", starName: "Thái Âm" },
      { mutagen: "Kỵ", starName: "Thiên Đồng" },
    ]);
  });

  it("Trung Châu Canh order with Khoa Thiên Phủ", () => {
    expect(getEngine("trung-chau")!.tuHoaTargets("Canh")).toEqual([
      { mutagen: "Lộc", starName: "Thái Dương" },
      { mutagen: "Quyền", starName: "Vũ Khúc" },
      { mutagen: "Khoa", starName: "Thiên Phủ" },
      { mutagen: "Kỵ", starName: "Thiên Đồng" },
    ]);
  });

  it("unknown stem returns empty list", () => {
    expect(getEngine("nam-phai")!.tuHoaTargets("")).toEqual([]);
    expect(getEngine("trung-chau")!.tuHoaTargets("NotAStem")).toEqual([]);
  });
});

describe("policy / mutagen characterization — natal and annual records", () => {
  it("Nam natal mutagens for Canh year (frozen branches)", () => {
    const chart = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    expect(chart.yearStem).toBe("Canh");
    expect(slimMutagens(chart.natalMutagens)).toEqual([
      { source: "natal", mutagen: "Lộc", starName: "Thái Dương", palaceBranch: "Tuất" },
      { source: "natal", mutagen: "Quyền", starName: "Vũ Khúc", palaceBranch: "Dậu" },
      { source: "natal", mutagen: "Khoa", starName: "Thái Âm", palaceBranch: "Thìn" },
      { source: "natal", mutagen: "Kỵ", starName: "Thiên Đồng", palaceBranch: "Thân" },
    ]);
  });

  it("TC natal mutagens for Canh year — Khoa Thiên Phủ at Mão", () => {
    const chart = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    expect(slimMutagens(chart.natalMutagens)).toEqual([
      { source: "natal", mutagen: "Lộc", starName: "Thái Dương", palaceBranch: "Tuất" },
      { source: "natal", mutagen: "Quyền", starName: "Vũ Khúc", palaceBranch: "Dậu" },
      { source: "natal", mutagen: "Khoa", starName: "Thiên Phủ", palaceBranch: "Mão" },
      { source: "natal", mutagen: "Kỵ", starName: "Thiên Đồng", palaceBranch: "Thân" },
    ]);
  });

  it("annual mutagens follow Bính (annual stem) for both schools", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    expect(nam.annualStem).toBe("Bính");
    const expected = [
      { source: "annual", mutagen: "Lộc", starName: "Thiên Đồng", palaceBranch: "Thân" },
      { source: "annual", mutagen: "Quyền", starName: "Thiên Cơ", palaceBranch: "Tý" },
      { source: "annual", mutagen: "Khoa", starName: "Văn Xương", palaceBranch: "Thìn" },
      { source: "annual", mutagen: "Kỵ", starName: "Liêm Trinh", palaceBranch: "Tỵ" },
    ];
    expect(slimMutagens(nam.annualMutagens)).toEqual(expected);
    expect(slimMutagens(tc.annualMutagens)).toEqual(expected);
  });
});

describe("policy / mutagen characterization — phiFlows", () => {
  it("preserves palace × Lộc-Quyền-Khoa-Kỵ order (first palace frozen)", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    expect(nam.phiFlows).toHaveLength(48);
    const firstFour = nam.phiFlows!.slice(0, 4).map((f) => ({
      sourceBranch: f.source.branch,
      mutagen: f.mutagen,
      starName: f.starName,
      targetBranch: f.target?.branch ?? null,
      self: f.self,
    }));
    expect(firstFour).toEqual([
      {
        sourceBranch: "Dần",
        mutagen: "Lộc",
        starName: "Tham Lang",
        targetBranch: "Tỵ",
        self: false,
      },
      {
        sourceBranch: "Dần",
        mutagen: "Quyền",
        starName: "Thái Âm",
        targetBranch: "Thìn",
        self: false,
      },
      {
        sourceBranch: "Dần",
        mutagen: "Khoa",
        starName: "Hữu Bật",
        targetBranch: "Tỵ",
        self: false,
      },
      {
        sourceBranch: "Dần",
        mutagen: "Kỵ",
        starName: "Thiên Cơ",
        targetBranch: "Tý",
        self: false,
      },
    ]);
  });
});

describe("policy / mutagen characterization — Major Fortune resolver", () => {
  it("Nam Canh targets via resolver (natal-eligible filter)", () => {
    const chart = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    expect(
      slimMutagens(resolveMajorFortuneMutagensForStem("nam-phai", "Canh", chart.palaces)),
    ).toEqual([
      { source: "major-mutagen", mutagen: "Lộc", starName: "Thái Dương", palaceBranch: "Tuất" },
      { source: "major-mutagen", mutagen: "Quyền", starName: "Vũ Khúc", palaceBranch: "Dậu" },
      { source: "major-mutagen", mutagen: "Khoa", starName: "Thái Âm", palaceBranch: "Thìn" },
      { source: "major-mutagen", mutagen: "Kỵ", starName: "Thiên Đồng", palaceBranch: "Thân" },
    ]);
  });

  it("TC Canh Khoa is Thiên Phủ via resolver", () => {
    const chart = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    const khoa = resolveMajorFortuneMutagensForStem(
      "trung-chau",
      "Canh",
      chart.palaces,
    ).find((r) => r.mutagen === "Khoa");
    expect(khoa).toEqual(
      expect.objectContaining({
        source: "major-mutagen",
        mutagen: "Khoa",
        starName: "Thiên Phủ",
      }),
    );
    expect(khoa?.palace?.branch).toBe("Mão");
  });

  it("empty fortune stem returns []", () => {
    const chart = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    expect(resolveMajorFortuneMutagensForStem("nam-phai", "", chart.palaces)).toEqual([]);
  });

  it("rejects annual, annual-mutagen, and Lưu-prefixed stars", () => {
    const palaces: ChartPalace[] = [
      palaceShell(0, "Dần", [
        { name: "Thái Dương", layer: "annual", source: "annual", brightness: "" },
        { name: "Vũ Khúc", layer: "mutagen", source: "annual-mutagen", brightness: "" },
        { name: "Lưu Thái Âm", layer: "annual", source: "natal", brightness: "" },
        { name: "Thiên Đồng", layer: "major", source: "natal", brightness: "" },
      ]),
    ];
    const records = resolveMajorFortuneMutagensForStem("nam-phai", "Canh", palaces);
    expect(slimMutagens(records)).toEqual([
      { source: "major-mutagen", mutagen: "Lộc", starName: "Thái Dương", palaceBranch: null },
      { source: "major-mutagen", mutagen: "Quyền", starName: "Vũ Khúc", palaceBranch: null },
      { source: "major-mutagen", mutagen: "Khoa", starName: "Thái Âm", palaceBranch: null },
      { source: "major-mutagen", mutagen: "Kỵ", starName: "Thiên Đồng", palaceBranch: "Dần" },
    ]);
  });
});

describe("policy / mutagen characterization — TC major decoration", () => {
  it("TC emits majorMutagens + ĐV Hóa stars; Nam does not", () => {
    const nam = getEngine("nam-phai")!.calculate(FIXTURE_1990_CANH);
    const tc = getEngine("trung-chau")!.calculate(FIXTURE_1990_CANH);
    expect(nam.majorMutagens ?? []).toEqual([]);
    expect(slimMutagens(tc.majorMutagens ?? [])).toEqual([
      { source: "major-mutagen", mutagen: "Lộc", starName: "Thiên Đồng", palaceBranch: "Thân" },
      { source: "major-mutagen", mutagen: "Quyền", starName: "Thiên Cơ", palaceBranch: "Tý" },
      { source: "major-mutagen", mutagen: "Khoa", starName: "Văn Xương", palaceBranch: "Thìn" },
      { source: "major-mutagen", mutagen: "Kỵ", starName: "Liêm Trinh", palaceBranch: "Tỵ" },
    ]);
    const hasDv = (chart: typeof tc, name: string) =>
      chart.palaces.some((p) => (p.stars ?? []).some((s) => s.name === name));
    expect(hasDv(tc, "ĐV Hóa Lộc")).toBe(true);
    expect(hasDv(tc, "ĐV Hóa Quyền")).toBe(true);
    expect(hasDv(tc, "ĐV Hóa Khoa")).toBe(true);
    expect(hasDv(tc, "ĐV Hóa Kỵ")).toBe(true);
    expect(hasDv(nam, "ĐV Hóa Lộc")).toBe(false);
  });
});
