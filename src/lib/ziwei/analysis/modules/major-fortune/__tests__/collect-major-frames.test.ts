import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace } from "@/types/chart";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { collectDomainFrames, collectOverallFrame } from "../collect-major-frames";
import { emptyMajorFortuneDiagnostics } from "../types";
import type { ResolvedMajorFortuneContext } from "../resolve-context";

const FORWARD_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

/** Synthetic chart where natal `palace.name` is deliberately shifted from
 * the Major Fortune ("trùng bài") label at the same index, so an accidental
 * fallback to natal names would resolve the wrong palace. */
function buildSyntheticChart(majorLabelOffset: number): ChartData {
  const palaces: ChartPalace[] = FORWARD_NAMES.map((_, index) => ({
    index,
    branch: `b${index}`,
    name: `NATAL-${index}`,
    majorPalaceName: FORWARD_NAMES[(index + majorLabelOffset) % 12],
  }));
  return { palaces } as unknown as ChartData;
}

function buildResolvedContext(activePalaceIndex: number, chart: ChartData): ResolvedMajorFortuneContext {
  return {
    school: "trung-chau",
    cycleIndex: 3,
    startAge: 35,
    endAge: 44,
    activePalaceIndex,
    activePalaceBranch: chart.palaces[activePalaceIndex]?.branch ?? "",
    calculationPolicyProfileVersion: null,
  };
}

describe("collectOverallFrame — geometry wraparound", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const { domainDefinitions } = loaded.knowledge;

  it("wraps correctly when the active palace is index 11", () => {
    const chart = buildSyntheticChart(0);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const resolvedContext = buildResolvedContext(11, chart);

    const frame = collectOverallFrame(chart, resolvedContext, domainDefinitions, diagnostics);
    expect(frame).not.toBeNull();
    expect(frame?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [11, "focus"],
      [5, "opposite"],
      [3, "trine"],
      [7, "trine"],
    ]);
    expect(diagnostics.missingFrameNodes).toHaveLength(0);
  });

  it("wraps correctly when the active palace is index 0", () => {
    const chart = buildSyntheticChart(0);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const resolvedContext = buildResolvedContext(0, chart);

    const frame = collectOverallFrame(chart, resolvedContext, domainDefinitions, diagnostics);
    expect(frame).not.toBeNull();
    expect(frame?.nodes.map((n) => [n.palaceIndex, n.role])).toEqual([
      [0, "focus"],
      [6, "opposite"],
      [4, "trine"],
      [8, "trine"],
    ]);
  });

  it("never backfills a node's majorPalaceName from its natal palace.name", () => {
    const chart = buildSyntheticChart(0);
    // Focus palace itself resolves, but its neighbors don't carry a label.
    chart.palaces.forEach((p, i) => {
      if (i !== 0) p.majorPalaceName = undefined;
    });
    const diagnostics = emptyMajorFortuneDiagnostics();
    const resolvedContext = buildResolvedContext(0, chart);

    const frame = collectOverallFrame(chart, resolvedContext, domainDefinitions, diagnostics);
    expect(frame?.nodes.map((n) => n.majorPalaceName)).toEqual(["Mệnh", null, null, null]);
    expect(frame?.nodes.map((n) => n.natalPalaceName)).toEqual([
      "NATAL-0",
      "NATAL-6",
      "NATAL-4",
      "NATAL-8",
    ]);
  });
});

describe("collectDomainFrames — anchor resolution by majorPalaceName", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const { domainDefinitions } = loaded.knowledge;

  it("resolves all twelve domain anchors when the label map is complete", () => {
    const chart = buildSyntheticChart(2);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const resolvedContext: ResolvedMajorFortuneContext = {
      ...buildResolvedContext(0, chart),
      majorPalaceLabels: new Map(
        chart.palaces.map((p) => [
          p.index,
          domainDefinitions.domains.find((d) => d.majorPalaceName === p.majorPalaceName)!.domainId,
        ]),
      ),
    };

    const frames = collectDomainFrames(chart, resolvedContext, domainDefinitions, diagnostics);
    expect(frames.size).toBe(12);

    const menhFrame = frames.get("menh");
    expect(menhFrame).toBeDefined();
    // "Mệnh" majorPalaceName sits at physical index (0 - 2 + 12) % 12 = 10.
    expect(menhFrame?.nodes[0]).toMatchObject({ palaceIndex: 10, role: "focus" });
  });

  it("returns nothing when majorPalaceLabels is absent", () => {
    const chart = buildSyntheticChart(0);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const resolvedContext = buildResolvedContext(0, chart);

    const frames = collectDomainFrames(chart, resolvedContext, domainDefinitions, diagnostics);
    expect(frames.size).toBe(0);
  });
});

describe("collectOverallFrame — incomplete TP4C", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("major fortune scoring knowledge failed to load");
  const { domainDefinitions } = loaded.knowledge;

  it("returns null and records missing opposite when opposite palace is absent", () => {
    const chart = buildSyntheticChart(0);
    chart.palaces = chart.palaces.filter((p) => p.index !== 6);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const frame = collectOverallFrame(chart, buildResolvedContext(0, chart), domainDefinitions, diagnostics);
    expect(frame).toBeNull();
    expect(diagnostics.missingFrameNodes.some((d) => d.includes("opposite"))).toBe(true);
  });

  it("returns null and records missing trine when a trine palace is absent", () => {
    const chart = buildSyntheticChart(0);
    chart.palaces = chart.palaces.filter((p) => p.index !== 4);
    const diagnostics = emptyMajorFortuneDiagnostics();
    const frame = collectOverallFrame(chart, buildResolvedContext(0, chart), domainDefinitions, diagnostics);
    expect(frame).toBeNull();
    expect(diagnostics.missingFrameNodes.some((d) => d.includes("trine"))).toBe(true);
  });
});
