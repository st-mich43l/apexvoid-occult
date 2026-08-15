import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";

import { MAJOR_FORTUNE_VERSION } from "@/lib/ziwei/analysis/modules/major-fortune/version";
import { analyzeMajorFortuneTimeline } from "@/lib/ziwei/analysis/modules/major-fortune/timeline";
import { MajorFortuneSection } from "./MajorFortuneSection";
import { MajorFortuneTimelineChart } from "./MajorFortuneTimelineChart";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("MajorFortuneTimelineChart", () => {
  it("renders a compact score-only timeline and no persistent tooltip", () => {
    const chart = calculateTrungChau(REGRESSION);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "trung-chau" });
    const current = timeline.currentCycleIndex!;
    const { container } = render(
      <MajorFortuneTimelineChart
        timeline={timeline}
        selectedCycleIndex={current}
        onSelectCycle={() => {}}
      />,
    );

    for (const t of [0, 20, 40, 60, 80, 100]) {
      expect(container.querySelector(".mf-timeline__y-axis")?.textContent).toContain(String(t));
    }
    expect(container.querySelectorAll(".mf-timeline__bar-total").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".mf-timeline__bar-base")).toHaveLength(0);
    expect(screen.getAllByText("Chính vận")).toHaveLength(1);
    expect(container.querySelector("[data-testid='mf-timeline-scroll']")).not.toBeNull();
    expect(screen.queryByTestId("mf-timeline-tooltip")).not.toBeInTheDocument();

    for (const p of timeline.points) {
      expect(container.textContent).toContain(p.ageLabel);
    }

    const html = container.innerHTML;
    expect(html).not.toMatch(/SRC-MF-|CLM-MF-|physicalFactId|evidenceClusterId/);
  });

  it("supports keyboard activation of another cycle", () => {
    const chart = calculateTrungChau(REGRESSION);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "trung-chau" });
    const selected: number[] = [];
    const other = timeline.points.find((p) => !p.isCurrentCycle)!;
    render(
      <MajorFortuneTimelineChart
        timeline={timeline}
        selectedCycleIndex={timeline.currentCycleIndex}
        onSelectCycle={(id) => selected.push(id)}
      />,
    );
    const hit = screen.getByRole("button", {
      name: new RegExp(`${other.ageLabel} tuổi`),
    });
    hit.focus();
    fireEvent.keyDown(hit, { key: "Enter" });
    expect(selected).toContain(other.cycleIndex);
  });

  it("shows concise floating details only while a cycle is focused", () => {
    const chart = calculateTrungChau(REGRESSION);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "trung-chau" });
    const point = timeline.points[0]!;
    render(
      <MajorFortuneTimelineChart
        timeline={timeline}
        selectedCycleIndex={timeline.currentCycleIndex}
        onSelectCycle={() => {}}
      />,
    );

    const hit = screen.getByRole("button", { name: new RegExp(`${point.ageLabel} tuổi`) });
    fireEvent.focus(hit);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent(`${point.activePalaceName} (${point.activePalaceBranch})`);
    expect(tooltip).toHaveTextContent(/Dữ liệu \d+%/);
    expect(tooltip).not.toHaveTextContent("Nền ba trụ");

    fireEvent.blur(hit);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("MajorFortuneSection timeline integration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders timeline and selects current cycle by default", () => {
    const chart = calculateTrungChau(REGRESSION);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "trung-chau" });
    const current = timeline.points.find((p) => p.isCurrentCycle)!;
    const { container } = render(<MajorFortuneSection chart={chart} school="trung-chau" />);

    expect(screen.getByLabelText("Đại Vận")).toHaveAttribute("data-version", MAJOR_FORTUNE_VERSION.integrationVersion);
    expect(screen.getAllByText("Chính vận").length).toBeGreaterThan(0);
    expect(container.querySelector(".mf-timeline__legend")).toBeNull();
    expect(screen.queryByTestId("mf-timeline-tooltip")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(new RegExp(`${current.startAge}–${current.endAge}`)).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/Đang xem:/)).not.toBeInTheDocument();
  });

  it("clicking another cycle updates summary and pillars; marker stays", () => {
    const chart = calculateTrungChau(REGRESSION);
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "trung-chau" });
    const other = timeline.points.find((p) => !p.isCurrentCycle)!;
    const { container } = render(<MajorFortuneSection chart={chart} school="trung-chau" />);

    const hit = screen.getByRole("button", {
      name: new RegExp(`${other.ageLabel} tuổi`),
    });
    fireEvent.click(hit);

    expect(screen.getByText(`Đang xem ${other.startAge}–${other.endAge} tuổi`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Về chính vận" })).toBeInTheDocument();
    expect(screen.getAllByText("Chính vận")).toHaveLength(1);

    expect(container.querySelectorAll(".mf-major-fortune__pillars [role='listitem']").length).toBe(4);

    fireEvent.click(screen.getByRole("button", { name: "Về chính vận" }));
    expect(screen.queryByText(/Đang xem:/)).not.toBeInTheDocument();
  });

  it("Nam Phái Tứ Hóa trụ is evaluable", () => {
    const chart = calculateNamPhai(REGRESSION);
    render(<MajorFortuneSection chart={chart} school="nam-phai" />);
    expect(screen.queryByText("Tứ Hóa chưa khả dụng")).toBeNull();
    expect(screen.getByLabelText("Đại Vận")).toBeInTheDocument();
  });
});
