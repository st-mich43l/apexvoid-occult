import { describe, expect, it } from "vitest";
import type { ChartData, ChartPalace, ChartStar, MutagenRecord } from "@/types/chart";
import { loadMajorFortuneScoringKnowledgeV0 } from "../../../knowledge/major-fortune-scoring";
import { collectTransformationEvidence } from "../collect-transformation-evidence";
import type { MajorFortuneFrame } from "../collect-major-frames";
import { emptyMajorFortuneDiagnostics } from "../types";

function palace(index: number, stars: ChartStar[], name = `P${index}`): ChartPalace {
  return { index, branch: `b${index}`, name, stars };
}

function overallFrame(focusIndex: number, chart: ChartData): MajorFortuneFrame {
  const focus = chart.palaces.find((p) => p.index === focusIndex)!;
  const opposite = chart.palaces.find((p) => p.index === (focusIndex + 6) % 12)!;
  const trineA = chart.palaces.find((p) => p.index === (focusIndex + 4) % 12)!;
  const trineB = chart.palaces.find((p) => p.index === (focusIndex + 8) % 12)!;
  return {
    scope: "overall",
    domainId: null,
    frameWeight: 1,
    nodes: [
      {
        palaceIndex: focus.index,
        natalPalaceName: focus.name,
        palaceBranch: focus.branch,
        majorPalaceName: null,
        role: "focus",
      },
      {
        palaceIndex: opposite.index,
        natalPalaceName: opposite.name,
        palaceBranch: opposite.branch,
        majorPalaceName: null,
        role: "opposite",
      },
      {
        palaceIndex: trineA.index,
        natalPalaceName: trineA.name,
        palaceBranch: trineA.branch,
        majorPalaceName: null,
        role: "trine",
      },
      {
        palaceIndex: trineB.index,
        natalPalaceName: trineB.name,
        palaceBranch: trineB.branch,
        majorPalaceName: null,
        role: "trine",
      },
    ],
  };
}

describe("collectTransformationEvidence — exact target verification", () => {
  const loaded = loadMajorFortuneScoringKnowledgeV0();
  if (!loaded.ok) throw new Error("failed to load knowledge");
  const knowledge = loaded.knowledge;

  it("accepts an exact canonical target present on the resolved palace", () => {
    const targetPalace = palace(0, [{ name: "Thái Dương", layer: "major", source: "natal" }]);
    const chart = {
      palaces: [
        targetPalace,
        palace(4, []),
        palace(6, []),
        palace(8, []),
      ],
    } as unknown as ChartData;
    // Pad remaining indices so frame lookup works for wrap tests if needed
    for (let i = 0; i < 12; i++) {
      if (!chart.palaces.find((p) => p.index === i)) {
        chart.palaces.push(palace(i, []));
      }
    }

    const diagnostics = emptyMajorFortuneDiagnostics();
    const transformations: MutagenRecord[] = [
      { mutagen: "Quyền", starName: "Thái Dương", palace: targetPalace },
    ];
    const evidence = collectTransformationEvidence({
      chart,
      frame: overallFrame(0, chart),
      transformations,
      knowledge,
      diagnostics,
    });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.category).toBe("transformation");
    expect(diagnostics.unresolvedTransformationTargets).toHaveLength(0);
  });

  it("rejects when the target star is absent from the palace star list", () => {
    const emptyPalace = palace(0, []);
    const chart = { palaces: [emptyPalace] } as unknown as ChartData;
    for (let i = 0; i < 12; i++) {
      if (!chart.palaces.find((p) => p.index === i)) chart.palaces.push(palace(i, []));
    }
    const diagnostics = emptyMajorFortuneDiagnostics();
    const transformations: MutagenRecord[] = [
      { mutagen: "Quyền", starName: "Thái Dương", palace: emptyPalace },
    ];
    const evidence = collectTransformationEvidence({
      chart,
      frame: overallFrame(0, chart),
      transformations,
      knowledge,
      diagnostics,
    });
    expect(evidence).toHaveLength(0);
    expect(diagnostics.unresolvedTransformationTargets.some((d) => d.includes("absent"))).toBe(
      true,
    );
  });

  it("rejects when record.palace index disagrees with the chart layout (wrong palace)", () => {
    const wrongPalace = palace(0, [{ name: "Thái Dương", layer: "major", source: "natal" }]);
    const chart = { palaces: [] as ChartPalace[] } as unknown as ChartData;
    for (let i = 0; i < 12; i++) {
      // Chart index 0 does NOT have Thái Dương — only the detached record object does.
      chart.palaces.push(palace(i, i === 5 ? [{ name: "Thái Dương", layer: "major", source: "natal" }] : []));
    }
    const diagnostics = emptyMajorFortuneDiagnostics();
    const transformations: MutagenRecord[] = [
      { mutagen: "Quyền", starName: "Thái Dương", palace: wrongPalace },
    ];
    const evidence = collectTransformationEvidence({
      chart,
      frame: overallFrame(0, chart),
      transformations,
      knowledge,
      diagnostics,
    });
    expect(evidence).toHaveLength(0);
    expect(diagnostics.unresolvedTransformationTargets.some((d) => d.includes("mismatch"))).toBe(
      true,
    );
  });
});
