import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import {
  indexFactsByPalace,
  normalizeNatalFacts,
} from "@/lib/ziwei/analysis/facts";
import { analyzeAllPalaces } from "../../analyze-all-palaces";
import { analyzePalaceCandidate } from "../analyze";
import { saturateSigned } from "../brightness";
import { loadInteractionCandidateProfile } from "../load-profile";
import { applyCandidateVoidInteraction } from "../void-interaction";
import type { PalaceEvidence } from "../../types";
import { buildStaticFrame } from "@/lib/ziwei/analysis/frame";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2000",
  flowBase: "luu-nien" as const,
};

function loadKnowledge() {
  const loaded = loadPalaceOverviewKnowledgeV1();
  if (!loaded.ok) throw new Error("knowledge");
  return loaded.knowledge;
}

describe("interaction candidate — invariants", () => {
  it("tanh saturation never inverts sign", () => {
    expect(saturateSigned(-20, 8)).toBeLessThan(0);
    expect(saturateSigned(20, 8)).toBeGreaterThan(0);
    expect(Math.abs(saturateSigned(-20, 8))).toBeLessThan(8.01);
  });

  it("does not use whole-score formation multipliers", () => {
    const profile = loadInteractionCandidateProfile();
    expect("wholeScoreMultiplier" in profile.structuralInteractions).toBe(false);
  });

  it("baseline analyzeAllPalaces remains the control on the freeze chart", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeAllPalaces(chart, { school: "nam-phai" });
    const b = analyzeAllPalaces(chart, { school: "nam-phai" });
    expect(a.results.map((r) => r.score)).toEqual(b.results.map((r) => r.score));
  });
});

describe("interaction candidate — brightness", () => {
  it("bounds extreme Hãm major contribution magnitude", () => {
    const knowledge = loadKnowledge();
    const chart = calculateNamPhai(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    const cand = analyzePalaceCandidate({
      chart,
      palaceIndex: menh.index,
      school: "nam-phai",
      factsByPalace: indexFactsByPalace(facts),
      knowledge,
      duplicateFactIds: duplicateIds,
    });
    for (const hit of cand.diagnostics.brightnessHits) {
      expect(Math.abs(hit.boundedContribution.support)).toBeLessThanOrEqual(
        loadInteractionCandidateProfile().brightnessDominance.supportCap + 1e-9,
      );
      expect(Math.abs(hit.boundedContribution.pressure)).toBeLessThanOrEqual(
        loadInteractionCandidateProfile().brightnessDominance.pressureCap + 1e-9,
      );
      expect(Math.sign(hit.boundedContribution.support) * Math.sign(hit.originalContribution.support)).not.toBe(-1);
    }
  });
});

describe("interaction candidate — void", () => {
  it("pressure-heavy focus + void can reduce pressure without creating support", () => {
    const profile = loadInteractionCandidateProfile();
    const evidence: PalaceEvidence[] = [
      {
        id: "maj",
        category: "major-star",
        factIds: ["f1"],
        palaceRole: "focus",
        palaceName: "Mệnh",
        palaceBranch: "Tý",
        axes: { support: 1, pressure: 8, stability: 0, activation: 1 },
        label: "Hãm",
        explanationKey: "t",
        sourceIds: [],
        knowledgeStatus: "experimental",
      },
    ];
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
            voidType: "Triệt" as const,
          },
        ],
      ],
    ]);
    const out = applyCandidateVoidInteraction(frame, factsByPalace, evidence, profile);
    expect(out.hit.reliefApplied).toBe(true);
    expect(out.hit.pressureAfter).toBeLessThan(out.hit.pressureBefore);
    expect(out.hit.supportAfter).toBeLessThanOrEqual(out.hit.supportBefore);
    expect(out.hit.supportAfter).toBeGreaterThanOrEqual(0);
  });

  it("support-heavy palace + void still attenuates support", () => {
    const profile = loadInteractionCandidateProfile();
    const evidence: PalaceEvidence[] = [
      {
        id: "maj",
        category: "major-star",
        factIds: ["f1"],
        palaceRole: "focus",
        palaceName: "Mệnh",
        palaceBranch: "Tý",
        axes: { support: 8, pressure: 1, stability: 0, activation: 1 },
        label: "Miếu",
        explanationKey: "t",
        sourceIds: [],
        knowledgeStatus: "experimental",
      },
    ];
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
            voidType: "Tuần" as const,
          },
        ],
      ],
    ]);
    const out = applyCandidateVoidInteraction(frame, factsByPalace, evidence, profile);
    expect(out.hit.reliefApplied).toBe(false);
    expect(out.hit.supportAfter).toBeLessThan(out.hit.supportBefore);
  });
});

describe("interaction candidate — VCD school isolation", () => {
  it("does not add Nam Phái VCD context evidence", () => {
    const knowledge = loadKnowledge();
    const chart = calculateNamPhai(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const factsByPalace = indexFactsByPalace(facts);
    for (const p of chart.palaces) {
      const cand = analyzePalaceCandidate({
        chart,
        palaceIndex: p.index,
        school: "nam-phai",
        factsByPalace,
        knowledge,
        duplicateFactIds: duplicateIds,
      });
      expect(cand.diagnostics.vcdContext.added).toBe(false);
      expect(
        cand.result.allEvidence.some((e) => e.sourceKind === "borrowed-opposite-context"),
      ).toBe(false);
    }
  });

  it("Trung Châu VCD context facts are not duplicated", () => {
    const knowledge = loadKnowledge();
    const chart = calculateTrungChau(REGRESSION);
    const { facts, duplicateIds } = normalizeNatalFacts(chart, { school: "trung-chau" });
    const factsByPalace = indexFactsByPalace(facts);
    for (const p of chart.palaces) {
      const cand = analyzePalaceCandidate({
        chart,
        palaceIndex: p.index,
        school: "trung-chau",
        factsByPalace,
        knowledge,
        duplicateFactIds: duplicateIds,
      });
      const contextIds = new Set(
        cand.result.allEvidence
          .filter((e) => e.sourceKind === "borrowed-opposite-context")
          .flatMap((e) => e.factIds),
      );
      const natalTransformIds = new Set(
        cand.result.allEvidence
          .filter(
            (e) =>
              e.category === "transformation" && e.sourceKind === "natal",
          )
          .flatMap((e) => e.factIds),
      );
      for (const id of contextIds) {
        expect(natalTransformIds.has(id)).toBe(false);
      }
    }
  });
});

describe("interaction candidate — geometry experiment", () => {
  it("reviewer geometry is not the default and changes weights when selected", () => {
    const profile = loadInteractionCandidateProfile();
    expect(profile.geometry.defaultProfile).toBe("baseline-relative");
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
      geometryProfile: "baseline-relative",
    });
    const b = analyzePalaceCandidate({
      chart,
      palaceIndex: menh.index,
      school: "nam-phai",
      factsByPalace,
      knowledge,
      duplicateFactIds: duplicateIds,
      geometryProfile: "reviewer-hypothesis",
    });
    expect(a.diagnostics.geometryProfile).toBe("baseline-relative");
    expect(b.diagnostics.geometryProfile).toBe("reviewer-hypothesis");
    const frameA = buildStaticFrame(chart, menh.index, {
      geometry: profile.geometry.profiles["baseline-relative"],
    });
    const frameB = buildStaticFrame(chart, menh.index, {
      geometry: profile.geometry.profiles["reviewer-hypothesis"],
    });
    expect(frameA.nodes.find((n) => n.role === "trine")?.geometryWeight).toBe(0.3);
    expect(frameB.nodes.find((n) => n.role === "trine")?.geometryWeight).toBe(0.075);
  });
});
