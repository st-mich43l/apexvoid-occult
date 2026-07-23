import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { analyzeMajorFortuneOrdinalV03 } from "@/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter";
import {
  isMajorFortuneV03OrdinalEnabled,
  MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";
import { getAnalysisStatus } from "@/lib/ziwei/analysis";
import { MajorFortuneV03OrdinalSection } from "./MajorFortuneV03OrdinalSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("isMajorFortuneV03OrdinalEnabled", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults off", () => {
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });

  it("env true enables", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "true");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(true);
  });

  it("env false stays off even with query 1", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "false");
    window.history.replaceState({}, "", `/?${MAJOR_FORTUNE_V03_ORDINAL_FEATURE_FLAG}=1`);
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });

  it("invalid env is off", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL", "yes");
    expect(isMajorFortuneV03OrdinalEnabled()).toBe(false);
  });
});

describe("MajorFortuneV03OrdinalSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders experimental badge, disclaimer, score and four pillars", () => {
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    render(
      <MajorFortuneV03OrdinalSection chart={chart} school="nam-phai" analysis={analysis} />,
    );
    expect(screen.getByText("Đại Vận V0.3")).toBeTruthy();
    expect(screen.getAllByText(/Experimental heuristic/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/không phải công thức cổ điển đã được xác minh/),
    ).toBeTruthy();
    expect(screen.getByText("Thiên Thời")).toBeTruthy();
    expect(screen.getByText("Địa Lợi")).toBeTruthy();
    expect(screen.getByText("Nhân Hòa")).toBeTruthy();
    expect(screen.getByText("Tứ Hóa & Sát Tinh")).toBeTruthy();
    expect(screen.getByText("Coverage")).toBeTruthy();
    expect(screen.getByText("Partial")).toBeTruthy();
    expect(
      screen.getByText(/Nam Phái: Tứ Hóa đại vận chưa có từ Calculation Core/),
    ).toBeTruthy();
  });

  it("renders Trung Châu scored state", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "trung-chau" });
    render(
      <MajorFortuneV03OrdinalSection
        chart={chart}
        school="trung-chau"
        analysis={analysis}
      />,
    );
    expect(screen.getByText("Điểm")).toBeTruthy();
    expect(analysis.result?.score).not.toBeNull();
  });

  it("renders unavailable without active palace", () => {
    const chart = { ...calculateNamPhai(REGRESSION), majorFortunePalace: null };
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });
    render(
      <MajorFortuneV03OrdinalSection chart={chart} school="nam-phai" analysis={analysis} />,
    );
    expect(screen.getByText(/Không có cung Đại Vận đang hoạt động/)).toBeTruthy();
  });

  it("does not change production major-fortune routing", () => {
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "unavailable",
      module: "major-fortune",
      reason: "rebuilding",
    });
  });
});
