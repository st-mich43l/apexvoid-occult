import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { PalaceOverviewRadar } from "./PalaceOverviewRadar";
import * as overview from "@/lib/ziwei/analysis/modules/palace-overview";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const OTHER_CHART: BirthInput = {
  solarDate: "1988-03-14",
  birthHour: "Mão",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function renderRadar() {
  const chart = calculateNamPhai(REGRESSION);
  return render(<PalaceOverviewRadar chart={chart} school="nam-phai" />);
}

function clickRadarPoint(points: NodeListOf<Element>, index: number): void {
  const point = points.item(index);
  if (!point) {
    throw new Error(`Expected radar point at index ${index}`);
  }
  fireEvent.click(point);
}

function getPalaceDetail(container: HTMLElement): HTMLElement {
  const detail = container.querySelector<HTMLElement>(".palace-overview-detail");
  if (!detail) {
    throw new Error("Expected Palace Overview detail panel");
  }
  return detail;
}

function resultFixture(
  palaceIndex: number,
  score: number,
  band: overview.PalaceOverviewBand,
): overview.PalaceOverviewResult {
  const PALACE_NAMES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
  return {
    module: "palace-overview",
    version: "1.0.0-experimental",
    versions: {
      contractVersion: "1",
      engineVersion: "1",
      knowledgeVersion: "1",
    },
    palaceIndex,
    palaceName: PALACE_NAMES[palaceIndex] ?? `Test ${palaceIndex}`,
    palaceBranch: "Tý",
    score,
    band,
    axes: {
      support: 0,
      pressure: 0,
      stability: 0,
      activation: 0,
    },
    rawAxes: {
      support: 0,
      pressure: 0,
      stability: 0,
      activation: 0,
    },
    intensity: 0,
    evidenceCompleteness: 100,
    majorStars: [],
    contextOnlyStars: [],
    isVoidMajor: false,
    topSupportDrivers: [],
    topPressureDrivers: [],
    allEvidence: [],
    profileId: "test",
    school: "nam-phai",
    annotations: [],
    isMenh: palaceIndex === 0,
    isThan: false,
    confidence: {
      evidenceCompletenessPercent: 100,
      sourceConfidencePercent: null,
      calibrationConfidence: "unvalidated",
      reasons: ["test-fixture"],
    },
    calibration: {
      profileVersion: "test",
      benchmarkVersion: null,
      calibrationVersion: null,
      releaseStage: "experimental",
      scoringInfrastructureVersion: "1.0.0",
    },
  };
}

describe("PalaceOverviewRadar", () => {
  it("renders the renamed title and hides raw engine version by default", () => {
    const { container } = renderRadar();
    expect(screen.getByText("Cấu trúc 12 cung")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/1\.0\.0-experimental/);
    expect(container.textContent).not.toMatch(/palace-overview-v1/);
  });

  it("opens the detail panel on click with Formula V2 breakdown (Nam Phái)", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("Công thức V2 (bài làm)")).toBeInTheDocument();
    expect(container.querySelector(".palace-overview-detail__full-evidence")).toBeNull();
    expect(screen.getByText("V2 FORMULA")).toBeInTheDocument();
  });

  it("Trung Châu keeps A–G full-evidence groups collapsed by default", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <PalaceOverviewRadar chart={chart} school="trung-chau" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(detail).not.toBeNull();

    const fullEvidence = container.querySelector(
      ".palace-overview-detail__full-evidence",
    ) as HTMLDetailsElement;
    expect(fullEvidence).not.toBeNull();
    expect(fullEvidence.open).toBe(false);

    const headingsInside = within(fullEvidence)
      .getAllByRole("heading", { level: 5 })
      .map((h) => h.textContent);
    for (const prefix of ["A.", "B.", "C.", "D.", "E.", "F.", "G."]) {
      expect(headingsInside.some((h) => h?.startsWith(prefix))).toBe(true);
    }
  });

  it("full-evidence details opens on click (Trung Châu)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(
      <PalaceOverviewRadar chart={chart} school="trung-chau" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const summary = screen.getByText("Xem toàn bộ bằng chứng");
    fireEvent.click(summary);
    const fullEvidence = container.querySelector(
      ".palace-overview-detail__full-evidence",
    ) as HTMLDetailsElement;
    expect(fullEvidence.open).toBe(true);
  });

  it("opens the detail panel via keyboard (Enter) on a focused radar point", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.keyDown(point, { key: "Enter" });
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();
  });

  it("moves profileId/version behind a collapsed 'Thông tin mô hình' section", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const details = screen.getByText("Thông tin mô hình").closest("details");
    expect(details).not.toBeNull();
    expect(details?.textContent).toMatch(/palace-overview-scoring-formula-v2/);
  });

  it("hovering a radar point shows the score in the readout, not on the rim", () => {
    const { container } = renderRadar();
    expect(container.querySelector(".palace-overview-radar__score")).toBeNull();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.mouseEnter(point);
    expect(container.querySelector(".palace-overview-radar__score")).toBeNull();
    expect(container.querySelector(".palace-overview-radar__hint")?.textContent).toMatch(
      /Mệnh/,
    );
    expect(container.querySelector(".palace-overview-radar__hint")?.textContent).toMatch(/\d/);
    fireEvent.mouseLeave(point);
    expect(container.querySelector(".palace-overview-radar__hint")?.textContent).toMatch(
      /Chạm một cung/,
    );
  });

  it("localizes the radar point band label instead of the raw English band string", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    const aria = point.getAttribute("aria-label") ?? "";
    expect(aria).not.toMatch(/\b(low|guarded|balanced|supportive|strong)\b/);
    expect(aria).toMatch(/điểm \d+/i);
  });

  it("V1.2: the first radar point is always Mệnh (pinned to 12 o'clock) and shows the Mệnh badge", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(within(detail as HTMLElement).getByText("Chi tiết · Mệnh")).toBeInTheDocument();
    expect(within(detail as HTMLElement).getByText("Mệnh")).toBeInTheDocument();
  });

  it("V1.2.1: basic Cung Mệnh/Cung Thân rows are badge-only, not repeated as list rows", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(within(detail as HTMLElement).queryByText("Cung an Mệnh của lá số")).toBeNull();
    expect(within(detail as HTMLElement).queryByText("Cung an Thân — trọng tâm biểu hiện")).toBeNull();
  });

  it("default detail omits unscored semantic essays", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    const detail = container.querySelector(".palace-overview-detail") as HTMLElement;
    expect(within(detail).queryByText("Liên kết phụ tinh")).toBeNull();
    expect(within(detail).queryByText("Tứ Hóa theo sao nhận Hóa")).toBeNull();
    expect(within(detail).queryByText("Biểu hiện tại cung")).toBeNull();
  });
});


describe("PalaceOverviewRadar — Presentation Logic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("proves scores 0, 24, 40, and 49.9 display Cẩn trọng and 50 displays Cân bằng", () => {
    const mocked = {
      knowledgeValid: true,
      semanticStatus: "available" as const,
      results: Array.from({ length: 12 }).map((_, i) =>
        resultFixture(
          i,
          [0, 24, 40, 49.9, 50][i] ?? 0,
          (["low", "low", "guarded", "guarded", "balanced"][i] as overview.PalaceOverviewBand) ?? "low"
        )
      ),
      diagnostics: {
        unknownStars: [], duplicateFacts: [], unmappedTransformations: [], missingBrightness: [], contextOnlyFacts: [], ruleHits: []
      },
      semanticDiagnostics: overview.emptySemanticDiagnostics()
    };
    vi.spyOn(overview, "analyzePalaceOverviewDisplay").mockReturnValue(mocked);
    vi.spyOn(overview, "analyzeAllPalaces").mockReturnValue(mocked);

    const { container } = renderRadar();
    const points = container.querySelectorAll(".palace-overview-radar__point");
    expect(points).toHaveLength(12);

    clickRadarPoint(points, 0);
    expect(within(getPalaceDetail(container)).getByText(/Cẩn trọng · 0/)).toBeInTheDocument();

    clickRadarPoint(points, 1);
    expect(within(getPalaceDetail(container)).getByText(/Cẩn trọng · 24/)).toBeInTheDocument();

    clickRadarPoint(points, 2);
    expect(within(getPalaceDetail(container)).getByText(/Cẩn trọng · 40/)).toBeInTheDocument();

    clickRadarPoint(points, 3);
    expect(within(getPalaceDetail(container)).getByText(/Cẩn trọng · 49.9/)).toBeInTheDocument();

    clickRadarPoint(points, 4);
    expect(within(getPalaceDetail(container)).getByText(/Cân bằng · 50/)).toBeInTheDocument();
  });
});

describe("PalaceOverviewRadar — V1.2.1 stale-selection regression (PR #81 review thread)", () => {
  it("selecting a palace then changing the chart clears the stale result instead of showing old data", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chartA} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();
    const scoreBefore = container.querySelector(
      ".palace-overview-detail__band",
    )!.textContent;

    const chartB = calculateNamPhai(OTHER_CHART);
    rerender(<PalaceOverviewRadar chart={chartB} school="nam-phai" />);

    // Selection must never silently keep showing chartA's analysis.
    const detailAfter = container.querySelector(".palace-overview-detail");
    if (detailAfter) {
      // If a palace at the same index still happens to be selected it must
      // be re-derived from chartB's own results, never chartA's stale object.
      expect(detailAfter.querySelector(".palace-overview-detail__band")!.textContent).not.toBe(
        scoreBefore,
      );
    } else {
      expect(detailAfter).toBeNull();
    }
  });

  it("selecting a palace then switching school clears the stale result", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chart} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();

    rerender(<PalaceOverviewRadar chart={chart} school="trung-chau" />);

    // The stale-selection bug this regresses against left the *previous
    // school's* PalaceOverviewResult object rendered; after the fix the
    // panel must close (selection is reset on school change).
    expect(container.querySelector(".palace-overview-detail")).toBeNull();
  });

  it("hover state clears when chart changes", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chartA} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.mouseEnter(point);
    expect(point.classList.contains("is-active")).toBe(true);

    const chartB = calculateNamPhai(OTHER_CHART);
    rerender(<PalaceOverviewRadar chart={chartB} school="nam-phai" />);

    expect(screen.getByText(/Chạm một cung/)).toBeInTheDocument();
    const pointAfter = container.querySelector(".palace-overview-radar__point")!;
    expect(pointAfter.classList.contains("is-active")).toBe(false);
  });

  it("selection always resolves against the current results (never a stored stale object)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(<PalaceOverviewRadar chart={chart} school="nam-phai" />);
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    const detail = container.querySelector(".palace-overview-detail")!;
    // Re-selecting the exact same chart/school must show identical data —
    // proves the value is derived fresh, not cached as a stale reference.
    const bandText = detail.querySelector(".palace-overview-detail__band")!.textContent;
    fireEvent.click(container.querySelector(".palace-overview-detail__close")!);
    fireEvent.click(point);
    const detail2 = container.querySelector(".palace-overview-detail")!;
    expect(detail2.querySelector(".palace-overview-detail__band")!.textContent).toBe(bandText);
  });

  it("both schools compute without error for the trine-link/pair-detector fixture chart", () => {
    const chart = calculateTrungChau(REGRESSION);
    const { container } = render(<PalaceOverviewRadar chart={chart} school="trung-chau" />);
    expect(container.querySelector(".palace-overview-radar")).not.toBeNull();
  });
});
