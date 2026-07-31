import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { analyzeMajorFortuneForPresentation } from "@/lib/ziwei/analysis/modules/major-fortune/presentation";
import {
  isMajorFortuneV03OrdinalEnabled,
  MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";
import { getAnalysisStatus } from "@/lib/ziwei/analysis";
import { MAJOR_FORTUNE_PRODUCTION_VERSION } from "@/lib/ziwei/analysis/modules/major-fortune/version";
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

describe("MajorFortuneSection production UI", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders disclaimer, scoring coverage and four pillars", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "false");
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneForPresentation(chart, { school: "nam-phai" });
    render(<MajorFortuneSection chart={chart} school="nam-phai" analysis={analysis.analysis} />);
    expect(screen.getByText("Đại Vận")).toBeTruthy();
    expect(screen.getByText(/không phải công thức cổ điển tuyệt đối/)).toBeTruthy();
    expect(screen.getByText("Thiên Thời")).toBeTruthy();
    expect(screen.getByText("Địa Lợi")).toBeTruthy();
    expect(screen.getByText("Nhân Hòa")).toBeTruthy();
    expect(screen.getByText("Tứ Hóa")).toBeTruthy();
    expect(screen.getByText(/Độ phủ 75%/)).toBeTruthy();
    expect(screen.getByText("3/4 trụ đã được tính")).toBeTruthy();
    expect(screen.getAllByText(/Tứ Hóa Đại Vận Nam Phái chưa được kích hoạt/)).not.toHaveLength(0);
    expect(screen.queryByText("strong-support")).toBeNull();
    expect(screen.queryByText("partial-data")).toBeNull();
  });

  it("renders Trung Châu with Vietnamese band", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortuneForPresentation(chart, { school: "trung-chau" });
    const { container } = render(
      <MajorFortuneSection chart={chart} school="trung-chau" analysis={analysis.analysis} />,
    );
    expect(container.querySelector(".mf-v03__score-value")).toBeTruthy();
    expect(analysis.analysis.result?.score).not.toBeNull();
    expect(analysis.analysis.display.bandLabelVi).toBeTruthy();
    expect(container.querySelector(".mf-v03__score-band")?.textContent).toBe(
      analysis.analysis.display.bandLabelVi,
    );
    expect(analysis.analysis.result?.coverage.scoringCoverageWeight).toBe(1);
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
      version: MAJOR_FORTUNE_PRODUCTION_VERSION.productionIntegrationVersion,
    });
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
  });
});
