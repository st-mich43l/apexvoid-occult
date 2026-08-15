import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  isMajorFortuneV03OrdinalEnabled,
  MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";
import { getAnalysisStatus } from "@/lib/ziwei/analysis";
import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { MAJOR_FORTUNE_VERSION } from "@/lib/ziwei/analysis/modules/major-fortune/version";
import { analyzeMajorFortune } from "@/lib/ziwei/analysis/modules/major-fortune/production";
import { MajorFortuneSection } from "./MajorFortuneSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("isMajorFortuneV03OrdinalEnabled production defaults", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults on when env missing", () => {
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
  });

  it("env false disables", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "false");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });

  it("query 0 disables session", () => {
    window.history.replaceState({}, "", `/?${MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG}=0`);
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });
});

describe("MajorFortuneSection", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders Nam Phái with Tứ Hóa trụ scored", () => {
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortune(chart, { school: "nam-phai" });
    render(<MajorFortuneSection chart={chart} school="nam-phai" analysis={analysis as any} />);
    expect(screen.getAllByText(/Đại Vận/).length).toBeGreaterThan(0);
    expect(screen.getByText("Thiên Thời")).toBeTruthy();
    expect(screen.getByText("Địa Lợi")).toBeTruthy();
    expect(screen.getByText("Nhân Hòa")).toBeTruthy();
    expect(screen.getAllByText("Tứ Hóa").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Tứ Hóa chưa khả dụng")).toBeNull();
    expect(screen.queryByText(/3\/4 trụ đã được tính/)).toBeNull();
    expect(screen.getByText("Xem cách tính & bằng chứng")).toBeTruthy();
  });

  it("renders one compact summary, four pillars and collapsed technical details", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "false");
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortune(chart, { school: "nam-phai" });
    render(<MajorFortuneSection chart={chart} school="nam-phai" analysis={analysis as any} />);
    expect(screen.getAllByText(/Đại Vận/).length).toBeGreaterThan(0);
    expect(screen.getByText(/không đảo vận khó thành cân bằng/)).toBeTruthy();
    expect(screen.getByText("Thiên Thời")).toBeTruthy();
    expect(screen.getByText("Địa Lợi")).toBeTruthy();
    expect(screen.getByText("Nhân Hòa")).toBeTruthy();
    expect(screen.getAllByText("Tứ Hóa")).toHaveLength(2);
    expect(screen.getByText("Dữ liệu 75%")).toBeTruthy();
    expect(screen.getByText(/3\/4 trụ đã được tính/)).toBeTruthy();
    expect(screen.getAllByText("Tứ Hóa chưa khả dụng")).toHaveLength(1);
    expect(screen.getByText("Xem cách tính & bằng chứng")).toBeTruthy();
    expect(document.querySelector(".mf-major-fortune__details")).not.toHaveAttribute("open");
    expect(screen.queryByText("strong-support")).toBeNull();
    expect(screen.queryByText("partial-data")).toBeNull();
  });

  it("renders Trung Châu with Vietnamese band", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortune(chart, { school: "trung-chau" });
    const { container } = render(<MajorFortuneSection chart={chart} school="trung-chau" analysis={analysis as any} />);
    expect(container.querySelector(".mf-major-fortune__score-value")).toBeTruthy();
    expect(analysis.display?.title).toContain("Đại Vận");
    expect(analysis.display?.bandLabelVi).toBeTruthy();
    expect(screen.getAllByText(analysis.display?.bandLabelVi as string).length).toBeGreaterThan(0);
    expect(analysis.result?.coverage.scoringCoverageWeight).toBe(1);
    expect(screen.getByLabelText("Đại Vận")).toHaveAttribute(
      "data-version",
      MAJOR_FORTUNE_VERSION.integrationVersion,
    );
  });

  it("renders unavailable when no cycle metadata exists", () => {
    const base = calculateNamPhai(REGRESSION);
    const chart = {
      ...base,
      majorFortunePalace: null,
      palaces: base.palaces.map((p) => ({ ...p, majorFortune: undefined })),
    };
    render(<MajorFortuneSection chart={chart} school="nam-phai" />);
    expect(screen.getByText(/Không có chu kỳ Đại Vận hợp lệ/)).toBeTruthy();
  });

  it("production status is available by default", () => {
    expect(getAnalysisStatus("major-fortune")).toMatchObject({
      status: "available",
      module: "major-fortune",
      version: MAJOR_FORTUNE_VERSION.integrationVersion,
    });
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
  });
});
