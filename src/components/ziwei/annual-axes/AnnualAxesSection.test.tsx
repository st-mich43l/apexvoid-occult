import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxes } from "@/lib/ziwei/analysis/modules/annual-axes";
import type { AnnualAxesResult } from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxesSection } from "./AnnualAxesSection";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

function renderSection(school: "trung-chau" | "nam-phai" = "trung-chau") {
  const chart =
    school === "trung-chau" ? calculateTrungChau(REGRESSION) : calculateNamPhai(REGRESSION);
  return {
    chart,
    school,
    ...render(<AnnualAxesSection chart={chart} school={school} />),
  };
}

function firstAvailablePoint(container: HTMLElement) {
  const points = Array.from(
    container.querySelectorAll<SVGGElement>('.annual-axes-radar__point[role="button"]'),
  );
  return points.find((p) => p.getAttribute("aria-disabled") !== "true");
}

describe("AnnualAxesSection — Trung Châu available result", () => {
  it("renders header, radar, and selection hint", () => {
    const { container } = renderSection("trung-chau");

    expect(screen.getByText("Sáu trục khí vận")).toBeInTheDocument();
    expect(container.querySelector('[data-module="annual-axes"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.annual-axes-radar__point')).toHaveLength(6);
    expect(container.querySelector('.annual-axes-section__hint')?.textContent ?? "").toMatch(
      /Chạm một trục/,
    );
    expect(container.querySelector('.annual-axes-section__disclaimer')).toBeNull();
    expect(container.querySelector('.annual-axes-section__focus')).toBeNull();
  });

  it("does not show legacy engine badges", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV05=1");
    const chart = calculateTrungChau(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="trung-chau" result={result} />,
    );
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.5");
    expect(container.textContent ?? "").not.toContain("Engine");
  });

  it("opens detail when the axis name is clicked", () => {
    renderSection("trung-chau");
    fireEvent.click(screen.getByText("Sức khỏe"));
    expect(screen.getByRole("region", { name: /Chi tiết Sức khỏe/ })).toBeInTheDocument();
  });

  it("shows the axis score in the readout on hover, not on the rim", () => {
    const { container } = renderSection("trung-chau");
    const hint = container.querySelector(".annual-axes-section__hint");
    expect(hint?.textContent ?? "").toMatch(/Chạm một trục/);
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    fireEvent.mouseEnter(point!);
    expect(container.querySelector(".annual-axes-section__hint")?.textContent ?? "").toMatch(/\d/);
    fireEvent.mouseLeave(point!);
    expect(container.querySelector(".annual-axes-section__hint")?.textContent ?? "").toMatch(
      /Chạm một trục/,
    );
  });

  it("opens the detail panel when a radar point is clicked", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    fireEvent.click(point!);
    expect(screen.getByRole("region", { name: /Chi tiết/ })).toBeInTheDocument();
    const detail = container.querySelector('.annual-axis-detail');
    expect(detail?.textContent ?? "").toMatch(/Hỗ trợ|Áp lực|Điểm/);
  });

  it("closing the detail panel restores the previous state", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    fireEvent.click(point!);
    const closeButton = screen.getByRole("button", { name: /Đóng chi tiết/ });
    fireEvent.click(closeButton);
    expect(container.querySelector('.annual-axis-detail')).toBeNull();
  });
});

describe("AnnualAxesSection — Nam Phái V0.10 current runtime", () => {
  it("renders the six-axis radar with an explicit V0.10 runtime badge", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(container.querySelectorAll('.annual-axes-radar__point')).toHaveLength(6);
    expect(result.annualFocus).not.toBeNull();
    expect(result.capabilities.supportsAnnualFocus).toBe(true);
    expect(container.textContent ?? "").toContain(String(result.annualYear));
    expect(result.versions.engineVersion).toBe("0.10.0");
    expect(container.querySelector('[data-engine-badge="annual-axes"]')?.textContent).toContain(
      "V0.10 EXP",
    );
    expect(container.querySelector('[data-engine-version="0.10.0"]')).toBeInTheDocument();
  });

  it("renders the exact V0.10 core score without React-side rescaling", () => {
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    const point = container.querySelector<SVGGElement>('[data-domain="wealth"]');
    expect(point).toBeTruthy();
    fireEvent.click(point!);
    const wealth = result.axes.wealth;
    expect(["available", "partial-data"]).toContain(wealth.status);
    if (wealth.status === "unavailable") return;
    expect(wealth.engine).toBe("v0.10");
    expect(container.textContent ?? "").toContain(`Điểm ${wealth.score.toFixed(1)}`);
    expect(container.querySelector('[data-axis-engine="v0.10"]')).toBeInTheDocument();
    expect(container.textContent ?? "").toContain("Nền lá số");
    expect(container.textContent ?? "").toContain("Đại vận");
    expect(container.textContent ?? "").toContain("Lưu niên");
    expect(container.textContent ?? "").toContain("Cộng hưởng");
  });

  it("ignores obsolete V0.8 URL toggles because V0.10 is the current runtime", () => {
    window.history.replaceState({}, "", "/?ziweiAnnualAxesV08=0");
    const chart = calculateNamPhai(REGRESSION);
    const result = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const { container } = render(
      <AnnualAxesSection chart={chart} school="nam-phai" result={result} />,
    );
    expect(result.versions.engineVersion).toBe("0.10.0");
    expect(container.textContent ?? "").toContain("V0.10 EXP");
    expect(container.textContent ?? "").not.toContain("Nam Phái V0.8");
  });
});

describe("AnnualAxesSection — unavailable/partial paths", () => {
  it("keeps unavailable domains keyboard-inspectable without implying a score", () => {
    const chart = calculateTrungChau(REGRESSION);
    const base = analyzeAnnualAxes(chart, { school: "trung-chau" });
    const partial: AnnualAxesResult = {
      ...base,
      axes: {
        ...base.axes,
        romance: {
          domain: "romance",
          engine: "v0.2",
          status: "unavailable",
          score: null,
          band: null,
          evidence: [],
          reasonCodes: ["missing-required-annual-facts"],
        },
      },
    };
    const { container } = render(
      <AnnualAxesSection chart={chart} school="trung-chau" result={partial} />,
    );
    const romancePoint = container.querySelector<SVGGElement>('[data-domain="romance"]');
    expect(romancePoint).toBeDefined();
    expect(romancePoint!.getAttribute("tabindex")).toBe("0");
    expect(romancePoint!.getAttribute("aria-disabled")).toBeNull();
    expect(romancePoint!.getAttribute("data-status")).toBe("unavailable");
    expect(romancePoint!.getAttribute("aria-label") ?? "").toMatch(/không đủ dữ liệu/i);
  });
});

describe("AnnualAxesSection — keyboard accessibility", () => {
  it("radar points are keyboard-focusable and trigger selection on Enter", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    expect(point!.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(point!, { key: "Enter" });
    expect(screen.getByRole("region", { name: /Chi tiết/ })).toBeInTheDocument();
  });

  it("interactive controls expose accessible labels", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    expect(point).toBeDefined();
    expect((point!.getAttribute("aria-label") ?? "").trim().length).toBeGreaterThan(0);

    fireEvent.click(point!);
    const buttons = container.querySelectorAll("button");
    for (const btn of buttons) {
      const hasLabel = (btn.getAttribute("aria-label") ?? btn.textContent ?? "").trim().length > 0;
      expect(hasLabel).toBe(true);
    }
  });
});

describe("AnnualAxesSection — deterministic (no prediction prose)", () => {
  it("does not render any predictive prose verbs in the detail body", () => {
    const { container } = renderSection("trung-chau");
    const point = firstAvailablePoint(container);
    fireEvent.click(point!);
    const forbidden = ["sẽ có", "sẽ gặp", "chắc chắn", "vận số"];
    const detail = container.querySelector(".annual-axis-detail");
    expect(detail).toBeTruthy();
    const text = (detail?.textContent ?? "").toLowerCase();
    for (const word of forbidden) {
      expect(text).not.toContain(word.toLowerCase());
    }
  });

  it("emits `data-module=annual-axes` and stable domain data-attributes for e2e hooks", () => {
    const { container } = renderSection("trung-chau");
    expect(container.querySelector('[data-module="annual-axes"]')).toBeInTheDocument();
    for (const domain of ["health", "family", "wealth", "career", "social", "romance"]) {
      expect(container.querySelector(`[data-domain="${domain}"]`)).toBeInTheDocument();
    }
  });
});

describe("AnnualAxesSection — feature flag disabled path", () => {
  it("is a no-op placeholder ChartPage responsibility — this section itself does not gate on the flag", () => {
    const { container } = renderSection("trung-chau");
    expect(within(container).getByText("Sáu trục khí vận")).toBeInTheDocument();
  });
});
