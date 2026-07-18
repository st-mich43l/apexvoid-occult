import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { loadPalaceOverviewKnowledgeV1 } from "../../../knowledge";
import { collectMajorFortuneStarEvidence as collectStarEvidence } from "../index";
import { emptyMajorFortuneDiagnostics } from "../types";
import type { MajorFortuneFrame } from "../collect-major-frames";

function buildFrame(
  focusStars: Array<{ name: string; brightness?: string }>,
  oppositeStars: Array<{ name: string; brightness?: string }>,
): { chart: ChartData; frame: MajorFortuneFrame } {
  const focusPalace: ChartPalace = {
    index: 0,
    branch: "b0",
    name: "Mệnh",
    stars: focusStars.map((s) => ({ name: s.name, brightness: s.brightness, source: "natal" })),
  };
  const oppositePalace: ChartPalace = {
    index: 6,
    branch: "b6",
    name: "Thiên Di",
    stars: oppositeStars.map((s) => ({ name: s.name, brightness: s.brightness, source: "natal" })),
  };
  const chart = { palaces: [focusPalace, oppositePalace] } as unknown as ChartData;
  const frame: MajorFortuneFrame = {
    scope: "overall",
    domainId: null,
    frameWeight: 1.0,
    nodes: [
      { palaceIndex: 0, natalPalaceName: "Mệnh", palaceBranch: "b0", majorPalaceName: null, role: "focus" },
      { palaceIndex: 6, natalPalaceName: "Thiên Di", palaceBranch: "b6", majorPalaceName: null, role: "opposite" },
    ],
  };
  return { chart, frame };
}

describe("collectStarEvidence — VCD borrowing", () => {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("palace overview knowledge failed to load");
  const numericKnowledge = loaded.knowledge;

  it("borrows the opposite palace's major star into focus at the canonical borrow factor when focus is void", () => {
    const { chart, frame } = buildFrame([], [{ name: "Tử Vi", brightness: "Miếu" }]);
    const diagnostics = emptyMajorFortuneDiagnostics();

    const evidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });

    const borrowed = evidence.find((e) => e.ruleId === "RULE-MFS-STAR-MAJOR-BORROWED-V0");
    expect(borrowed).toBeDefined();
    expect(borrowed?.frameRole).toBe("focus");
    expect(borrowed?.targetPalaceIndex).toBe(0);

    const naturalOppositeCopy = evidence.find(
      (e) => e.physicalFactId === borrowed?.physicalFactId && e.frameRole === "opposite",
    );
    expect(naturalOppositeCopy).toBeUndefined();

    const borrow = numericKnowledge.voidEnvironment.voidMajorBorrowFactor;
    const majorRecord = numericKnowledge.majorStars.stars.find((s) => s.name === "Tử Vi")!;
    const modifier = numericKnowledge.majorStars.brightnessModifiers.Miếu;
    expect(modifier).toBeDefined();
    const expectedSupport = majorRecord.axes.support * (modifier?.supportFactor ?? 1) * borrow;
    expect(borrowed?.rawAxes.support).toBeCloseTo(expectedSupport, 10);
  });

  it("does not borrow when focus already has a major star", () => {
    const { chart, frame } = buildFrame(
      [{ name: "Thiên Phủ", brightness: "Miếu" }],
      [{ name: "Tử Vi", brightness: "Miếu" }],
    );
    const diagnostics = emptyMajorFortuneDiagnostics();

    const evidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });

    expect(evidence.some((e) => e.ruleId === "RULE-MFS-STAR-MAJOR-BORROWED-V0")).toBe(false);
    // The opposite palace's own major star is still counted normally.
    expect(evidence.some((e) => e.frameRole === "opposite")).toBe(true);
  });

  it("never counts Tuần/Triệt as a physical star (zero evidence, zero diagnostic)", () => {
    const { chart, frame } = buildFrame([{ name: "Tuần" }, { name: "Triệt" }], []);
    const diagnostics = emptyMajorFortuneDiagnostics();

    const evidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });

    expect(evidence).toHaveLength(0);
    expect(diagnostics.unknownStars).toHaveLength(0);
  });

  it("treats a context-only minor star (e.g. Đẩu Quân) as known-but-non-scored, not unknown", () => {
    const { chart, frame } = buildFrame([{ name: "Đẩu Quân" }], []);
    const diagnostics = emptyMajorFortuneDiagnostics();

    const evidence = collectStarEvidence({ chart, frame, numericKnowledge, diagnostics });

    expect(evidence).toHaveLength(0);
    expect(diagnostics.unknownStars).toHaveLength(0);
  });
});
