import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import {
  HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG,
  isHuyenKhiPreviewV01Enabled,
} from "@/lib/ziwei/analysis";
import { HuyenKhiResearchPreview } from "./HuyenKhiResearchPreview";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("isHuyenKhiPreviewV01Enabled", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("defaults OFF", () => {
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });

  it("opts in via query and persists for the session", () => {
    window.history.replaceState({}, "", `/?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=1`);
    expect(isHuyenKhiPreviewV01Enabled()).toBe(true);
    window.history.replaceState({}, "", "/");
    expect(isHuyenKhiPreviewV01Enabled()).toBe(true);
  });

  it("opts out via query", () => {
    window.sessionStorage.setItem(HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG, "1");
    window.history.replaceState({}, "", `/?${HUYEN_KHI_PREVIEW_V01_FEATURE_FLAG}=0`);
    expect(isHuyenKhiPreviewV01Enabled()).toBe(false);
  });
});

describe("HuyenKhiResearchPreview", () => {
  it("selects Mệnh by default and exposes 12 accessible palace controls", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    expect(screen.getByText("Huyền Khí")).toBeInTheDocument();
    expect(screen.getByText("Research Preview")).toBeInTheDocument();
    expect(
      screen.getByText(/Đây là bản xem trước dữ liệu cấu trúc/),
    ).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(12);

    const menh = chart.palaces.find((p) => p.isMenh);
    expect(menh).toBeDefined();
    const selected = options.find((o) => o.getAttribute("aria-selected") === "true");
    expect(selected?.textContent ?? "").toContain(menh!.name);
    expect(container.querySelector(".huyen-khi-preview__detail")).toBeTruthy();
  });

  it("keeps phụ tinh and dimension frame collapsed by default", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    const minors = container.querySelector<HTMLDetailsElement>(
      '[data-minors-collapsed="true"]',
    );
    const dims = container.querySelector<HTMLDetailsElement>(
      '[data-dimensions-collapsed="true"]',
    );
    expect(minors).toBeTruthy();
    expect(dims).toBeTruthy();
    expect(minors?.open).toBe(false);
    expect(dims?.open).toBe(false);
  });

  it("shows five Chưa đánh giá states when the dimension frame is opened", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );

    const dims = container.querySelector('[data-dimensions-collapsed]');
    expect(dims).toBeTruthy();
    fireEvent.click(within(dims as HTMLElement).getByText("Khung đánh giá Huyền Khí"));

    const states = container.querySelectorAll(".huyen-khi-preview__dim-state");
    expect(states).toHaveLength(5);
    for (const el of states) {
      expect(el.textContent).toBe("Chưa đánh giá");
    }
    expect(container.textContent ?? "").toMatch(/cổng kiểm chứng chuyên gia/);
  });

  it("does not render a numeric score label", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <HuyenKhiResearchPreview chart={chart} school="nam-phai" />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bĐiểm\b/);
    expect(text).not.toMatch(/\bscore\b/i);
    expect(text).not.toMatch(/\b[0-9]+(\.[0-9]+)?\s*%/);
  });

  it("resets selection to Mệnh when school/chart identity changes", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { rerender, container } = render(
      <HuyenKhiResearchPreview chart={chartA} school="nam-phai" />,
    );

    const nonMenh = screen.getAllByRole("option").find(
      (o) => o.getAttribute("aria-selected") !== "true",
    );
    expect(nonMenh).toBeDefined();
    fireEvent.click(nonMenh!);

    const chartB = calculateNamPhai({ ...REGRESSION, birthHour: "Tý" });
    rerender(<HuyenKhiResearchPreview chart={chartB} school="nam-phai" />);

    const menh = chartB.palaces.find((p) => p.isMenh);
    const selected = container.querySelector('.huyen-khi-preview__palace.is-selected');
    expect(selected?.textContent ?? "").toContain(menh!.name);
  });
});
