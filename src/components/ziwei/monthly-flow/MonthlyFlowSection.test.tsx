import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { calculate } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { MonthlyFlowSection } from "./MonthlyFlowSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("MonthlyFlowSection", () => {
  afterEach(cleanup);

  it("renders the styled header and compact month summary without version chrome", () => {
    const chart = calculate(REGRESSION);
    const { container } = render(
      <MonthlyFlowSection
        chart={chart}
        school="nam-phai"
        now={new Date("2026-08-13T12:00:00+07:00")}
      />,
    );

    expect(container.querySelector(".mf-monthly-flow > .mf-flow__head")).toBeTruthy();
    expect(container.querySelector(".mf-flow__metric-grid")).toBeTruthy();
    expect(container.querySelector(".mf-flow__reasons")).toBeTruthy();
    expect(container.querySelector(".mf-flow-timeline__tooltip")).toBeNull();
    expect(container.querySelector(".mf-flow__badge")).toBeNull();
    expect(container.querySelector("[data-version]")).toBeNull();
    expect(container.textContent ?? "").not.toMatch(/\bV\d+\.\d+/);
    expect(container.textContent ?? "").not.toMatch(/\bengine\b/i);
    expect(screen.getByText(/Năm 2026/)).toBeInTheDocument();
  });
});
