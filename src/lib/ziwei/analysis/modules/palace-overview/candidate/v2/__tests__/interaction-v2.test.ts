import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import {
  indexFactsByPalace,
  normalizeNatalFacts,
} from "@/lib/ziwei/analysis/facts";
import { buildStaticFrame } from "@/lib/ziwei/analysis/frame";
import { analyzeAllPalaces } from "../../../analyze-all-palaces";
import type { PalaceEvidence } from "../../../types";
import { analyzePalaceCandidate } from "../../analyze";
import { loadInteractionCandidateProfile } from "../../load-profile";
import { applyCandidateVoidInteraction } from "../../void-interaction";
import { analyzePalaceStrong } from "../analyze-strong";
import { kendallTau } from "../compare";
import { scaleAndBoundFormations } from "../formation";
import { loadInteractionCandidateV2Pack } from "../load";
import { applyRescueContext } from "../rescue";
import { applyStrongVcdContext } from "../vcd";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2000",
  flowBase: "luu-nien" as const,
};

function loadKnowledge() {
  const loaded = loadPalaceOverviewResearchKnowledgeV2();
  if (!loaded.ok) throw new Error("knowledge");
  return loaded.knowledge;
}

function ev(partial: Partial<PalaceEvidence> & Pick<PalaceEvidence, "id" | "axes">): PalaceEvidence {
  return {
    category: "major-star",
    factIds: [partial.id],
    palaceRole: "focus",
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    label: "t",
    explanationKey: "t",
    sourceIds: [],
    knowledgeStatus: "experimental",
    ...partial,
  };
}

describe("interaction candidate v2 — geometry", () => {
  it("strong geometry is 0.60 / 0.25 / 0.075 and is not renormalized", () => {
    const g = loadInteractionCandidateV2Pack().profiles.strong.geometry;
    expect(g.focus).toBe(0.6);
    expect(g.opposite).toBe(0.25);
    expect(g.trine).toBe(0.075);
    expect(g.focus + g.opposite + 2 * g.trine).toBeCloseTo(1, 9);
    const chart = calculateNamPhai(REGRESSION);
    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    const frame = buildStaticFrame(chart, menh.index, { geometry: g });
    expect(frame.nodes.find((n) => n.role === "focus")?.geometryWeight).toBe(0.6);
    expect(frame.nodes.find((n) => n.role === "opposite")?.geometryWeight).toBe(0.25);
    expect(frame.nodes.find((n) => n.role === "trine")?.geometryWeight).toBe(0.075);
  });
});

describe("interaction candidate v2 — rescue", () => {
  const rescue = loadInteractionCandidateV2Pack().profiles.strong.rescue;
  const families = loadInteractionCandidateV2Pack().beneficMinorFamilyIds;

  it("Hãm + benefic transforms fires rescue and boosts support / relieves pressure", () => {
    const out = applyRescueContext({
      evidence: [
        ev({
          id: "ham",
          axes: { support: 2, pressure: 8, stability: 0, activation: 1 },
          label: "Hãm",
        }),
        ev({
          id: "hoa",
          category: "transformation",
          axes: { support: 2, pressure: 0, stability: 0, activation: 1 },
          label: "Hóa Lộc",
        }),
      ],
      rescue,
      beneficMinorFamilyIds: families,
      focusHasHam: true,
      isVcd: false,
      palaceName: "Mệnh",
      palaceBranch: "Tý",
    });
    expect(out.hit.fired).toBe(true);
    expect(out.hit.supportBoost).toBeGreaterThan(0);
    expect(out.hit.pressureRelief).toBeGreaterThan(0);
    expect(out.hit.supportBoost).toBeLessThanOrEqual(rescue.maxSupportBoost);
    expect(out.hit.pressureRelief).toBeLessThanOrEqual(rescue.maxPressureRelief);
  });

  it("Hãm without rescue sources does not invent a boost", () => {
    const out = applyRescueContext({
      evidence: [
        ev({
          id: "ham",
          axes: { support: 1, pressure: 9, stability: 0, activation: 0 },
          label: "Hãm",
        }),
      ],
      rescue,
      beneficMinorFamilyIds: families,
      focusHasHam: true,
      isVcd: false,
      palaceName: "Mệnh",
      palaceBranch: "Tý",
    });
    expect(out.hit.fired).toBe(false);
    expect(out.hit.supportBoost).toBe(0);
  });

  it("support-heavy palaces get diminished rescue even with sources", () => {
    const heavy = applyRescueContext({
      evidence: [
        ev({
          id: "mieu",
          axes: { support: 12, pressure: 1, stability: 1, activation: 1 },
          label: "Miếu",
        }),
        ev({
          id: "hoa",
          category: "transformation",
          axes: { support: 2, pressure: 0, stability: 0, activation: 0 },
          label: "Hóa Khoa",
        }),
      ],
      rescue,
      beneficMinorFamilyIds: families,
      focusHasHam: true,
      isVcd: false,
      palaceName: "Mệnh",
      palaceBranch: "Tý",
    });
    const needy = applyRescueContext({
      evidence: [
        ev({
          id: "ham",
          axes: { support: 2, pressure: 10, stability: 0, activation: 1 },
          label: "Hãm",
        }),
        ev({
          id: "hoa",
          category: "transformation",
          axes: { support: 2, pressure: 0, stability: 0, activation: 0 },
          label: "Hóa Khoa",
        }),
      ],
      rescue,
      beneficMinorFamilyIds: families,
      focusHasHam: true,
      isVcd: false,
      palaceName: "Mệnh",
      palaceBranch: "Tý",
    });
    expect(needy.hit.supportBoost).toBeGreaterThan(heavy.hit.supportBoost);
  });
});

describe("interaction candidate v2 — void", () => {
  function voidFrameFacts(voidType: "Triệt" | "Tuần") {
    const frame = {
      focusIndex: 0,
      nodes: [
        {
          palaceIndex: 0,
          palaceName: "Mệnh",
          palaceBranch: "Tý",
          role: "focus" as const,
          geometryWeight: 1,
        },
      ],
    };
    const factsByPalace = new Map([
      [
        0,
        [
          {
            id: "v",
            layer: "natal" as const,
            kind: "void-marker" as const,
            school: "nam-phai" as const,
            palaceIndex: 0,
            palaceName: "Mệnh",
            palaceBranch: "Tý",
            source: "natal",
            voidType,
          },
        ],
      ],
    ]);
    return { frame, factsByPalace };
  }

  function strongVoidProfile() {
    const v1 = structuredClone(loadInteractionCandidateProfile());
    const strong = loadInteractionCandidateV2Pack().profiles.strong;
    v1.voidInteraction.singleVoid = strong.void.singleVoid;
    v1.voidInteraction.doubleVoid = strong.void.doubleVoid;
    return v1;
  }

  it("pressure-heavy + Triệt reduces pressure more than moderate", () => {
    const evidence: PalaceEvidence[] = [
      ev({
        id: "maj",
        axes: { support: 1, pressure: 8, stability: 0, activation: 1 },
        label: "Hãm",
      }),
    ];
    const { frame, factsByPalace } = voidFrameFacts("Triệt");
    const mod = applyCandidateVoidInteraction(
      frame,
      factsByPalace,
      evidence,
      loadInteractionCandidateProfile(),
    );
    const str = applyCandidateVoidInteraction(
      frame,
      factsByPalace,
      evidence,
      strongVoidProfile(),
    );
    expect(str.hit.pressureAfter).toBeLessThan(mod.hit.pressureAfter);
    expect(str.hit.supportAfter).toBeLessThanOrEqual(str.hit.supportBefore);
    expect(str.hit.supportAfter).toBeGreaterThanOrEqual(0);
  });

  it("support-heavy + Triệt still attenuates support", () => {
    const evidence: PalaceEvidence[] = [
      ev({
        id: "maj",
        axes: { support: 8, pressure: 1, stability: 0, activation: 1 },
        label: "Miếu",
      }),
    ];
    const { frame, factsByPalace } = voidFrameFacts("Triệt");
    const str = applyCandidateVoidInteraction(
      frame,
      factsByPalace,
      evidence,
      strongVoidProfile(),
    );
    expect(str.hit.supportAfter).toBeLessThan(str.hit.supportBefore);
  });

  it("does not convert negative axes into positive support", () => {
    const evidence: PalaceEvidence[] = [
      ev({
        id: "maj",
        axes: { support: 0, pressure: 6, stability: 0, activation: 0 },
      }),
    ];
    const { frame, factsByPalace } = voidFrameFacts("Tuần");
    const str = applyCandidateVoidInteraction(
      frame,
      factsByPalace,
      evidence,
      strongVoidProfile(),
    );
    expect(str.hit.supportAfter).toBe(0);
  });
});

describe("interaction candidate v2 — formation", () => {
  it("amplifies interaction delta then caps", () => {
    const pack = loadInteractionCandidateV2Pack();
    const rules: PalaceEvidence[] = [
      ev({
        id: "form",
        category: "structural-rule",
        axes: { support: 2.4, pressure: 0, stability: 1.5, activation: 1.5 },
      }),
    ];
    const frame = buildStaticFrame(calculateNamPhai(REGRESSION), 0, {
      geometry: pack.profiles.strong.geometry,
    });
    const out = scaleAndBoundFormations(
      rules,
      frame,
      new Map(),
      pack.profiles.strong,
      true,
    );
    expect(out[0]!.axes.support).toBeLessThanOrEqual(
      pack.profiles.strong.formation.maxSupportContribution,
    );
    expect(out[0]!.axes.support).toBeCloseTo(Math.min(2.4 * 1.5, 3), 6);
  });
});

describe("interaction candidate v2 — VCD", () => {
  it("caps and deduplicates contextual evidence", () => {
    const pack = loadInteractionCandidateV2Pack();
    const chart = calculateTrungChau(REGRESSION);
    const knowledge = loadKnowledge();
    const { facts } = normalizeNatalFacts(chart, { school: "trung-chau" });
    const factsByPalace = indexFactsByPalace(facts);
    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    const frame = buildStaticFrame(chart, menh.index, {
      geometry: pack.profiles.strong.geometry,
    });
    const evidence: PalaceEvidence[] = [
      ev({
        id: "borrowed-major",
        borrowedFromOpposite: true,
        starName: "Tử Vi",
        axes: { support: 1, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "opp-min-1",
        category: "minor-star-family",
        palaceRole: "opposite",
        familyId: "strong-support",
        factIds: ["m1"],
        axes: { support: 4, pressure: 0, stability: 0, activation: 0 },
      }),
      ev({
        id: "opp-min-2",
        category: "minor-star-family",
        palaceRole: "opposite",
        familyId: "strong-support",
        factIds: ["m1"],
        axes: { support: 3, pressure: 0, stability: 0, activation: 0 },
      }),
    ];
    const out = applyStrongVcdContext({
      school: "trung-chau",
      frame,
      factsByPalace,
      knowledge,
      evidence,
      borrowedFactIds: new Set(),
      isVoidMajor: true,
      profile: pack.profiles.strong,
      pack,
      enabled: true,
    });
    const ctx = out.evidence.filter((e) => e.sourceKind === "borrowed-opposite-context");
    for (const item of ctx) {
      expect(Math.abs(item.axes.support)).toBeLessThanOrEqual(
        pack.profiles.strong.vcd.maxAxisMagnitude,
      );
      expect(Math.abs(item.axes.pressure)).toBeLessThanOrEqual(
        pack.profiles.strong.vcd.maxAxisMagnitude,
      );
    }
    const minorCtx = ctx.filter((e) => e.id.includes("v2-vcd-minor"));
    expect(minorCtx.length).toBeLessThanOrEqual(2);
  });
});

describe("interaction candidate v2 — invariants", () => {
  it("does not use a whole-score multiplier", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/lib/ziwei/analysis/modules/palace-overview/candidate/v2/analyze-strong.ts",
      ),
      "utf8",
    );
    expect(src).not.toMatch(/score\s*\*\s*/);
    expect(src).not.toMatch(/wholeScoreMultiplier/);
  });

  it("baseline analyzeAllPalaces is unchanged vs a second run", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeAllPalaces(chart, { school: "nam-phai" });
    const b = analyzeAllPalaces(chart, { school: "nam-phai" });
    expect(a.results.map((r) => r.score)).toEqual(b.results.map((r) => r.score));
  });

  it("moderate path is analyzePalaceCandidate (PR #212 engine)", () => {
    const knowledge = loadKnowledge();
    const chart = calculateNamPhai(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const factsByPalace = indexFactsByPalace(facts);
    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    const a = analyzePalaceCandidate({
      chart,
      palaceIndex: menh.index,
      school: "nam-phai",
      factsByPalace,
      knowledge,
      duplicateFactIds: duplicateIds,
    });
    const b = analyzePalaceCandidate({
      chart,
      palaceIndex: menh.index,
      school: "nam-phai",
      factsByPalace,
      knowledge,
      duplicateFactIds: duplicateIds,
    });
    expect(a.result.score).toBe(b.result.score);
  });

  it("strong profile is deterministic", () => {
    const knowledge = loadKnowledge();
    const chart = calculateNamPhai(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const common = {
      chart,
      school: "nam-phai" as const,
      factsByPalace: indexFactsByPalace(facts),
      knowledge,
      duplicateFactIds: duplicateIds,
      palaceIndex: chart.palaces.find((p) => p.name === "Mệnh")!.index,
    };
    const a = analyzePalaceStrong(common);
    const b = analyzePalaceStrong(common);
    expect(a.result.score).toBe(b.result.score);
    expect(a.result.rawAxes).toEqual(b.result.rawAxes);
  });

  it("ablation removes one mechanism at a time", () => {
    const knowledge = loadKnowledge();
    const chart = calculateNamPhai(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const common = {
      chart,
      school: "nam-phai" as const,
      factsByPalace: indexFactsByPalace(facts),
      knowledge,
      duplicateFactIds: duplicateIds,
      palaceIndex: chart.palaces.find((p) => p.name === "Mệnh")!.index,
    };
    const full = analyzePalaceStrong({ ...common, ablation: "full" });
    const noRescue = analyzePalaceStrong({ ...common, ablation: "no-rescue" });
    const noGeom = analyzePalaceStrong({ ...common, ablation: "no-geometry" });
    expect(noRescue.diagnostics.rescue.fired).toBe(false);
    expect(noGeom.diagnostics.triggeredHypotheses).not.toContain("H-GEOMETRY-01");
    expect(full.diagnostics.ablation).toBe("full");
  });

  it("candidate sources do not read expert review or holdout label files", () => {
    const files = ["analyze-strong.ts", "rescue.ts", "vcd.ts", "formation.ts", "load.ts"];
    for (const name of files) {
      const src = readFileSync(
        join(
          process.cwd(),
          "src/lib/ziwei/analysis/modules/palace-overview/candidate/v2",
          name,
        ),
        "utf8",
      );
      expect(src).not.toMatch(/expert-review/);
      expect(src).not.toMatch(/holdout/);
      expect(src).not.toMatch(/expert-benchmark/);
    }
  });

  it("Nam Phái VCD extra context stays off", () => {
    expect(loadInteractionCandidateV2Pack().profiles.strong.vcd.namPhaiEnabled).toBe(
      false,
    );
  });

  it("kendall helper is concordant on identical ranks", () => {
    expect(kendallTau([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(kendallTau([1, 2, 3], [3, 2, 1])).toBe(-1);
  });
});
